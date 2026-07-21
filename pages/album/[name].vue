<template>
  <div class="album-page">
    <section class="album-hero">
      <div class="container py-4 py-md-5">
        <NuxtLink to="/galeria" class="back-link mb-4">Volver a galería</NuxtLink>
        <div class="d-flex flex-wrap justify-content-between align-items-end gap-3">
          <div>
            <p class="eyebrow mb-2">Álbum</p>
            <h1 class="display-5 fw-bold mb-2">{{ albumName }}</h1>
            <p class="text-muted mb-0">{{ albumPhotos.length }} fotos guardadas en este álbum.</p>
          </div>
          <NuxtLink to="/postear" class="btn btn-primary rounded-pill px-4">Subir fotos</NuxtLink>
        </div>
      </div>
    </section>

    <main class="container py-4">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="text-muted mt-2">Cargando álbum...</p>
      </div>

      <template v-else>
        <div v-if="!albumPhotos.length" class="empty-state shadow-sm">
          <h4>Este álbum está vacío</h4>
          <p class="text-muted mb-0">Mueve fotos desde otros álbumes o sube nuevos recuerdos.</p>
        </div>

        <div v-else class="album-photo-grid">
          <article v-for="(photo, index) in albumPhotos" :key="photo.key" class="photo-tile" :style="{ '--delay': `${Math.min(index * 45, 450)}ms` }">
            <button class="photo-open" type="button" @click="openPhoto(photo)">
              <img :src="optimizeImage(photo.url, 700)" :alt="albumName" loading="lazy">
            </button>
            <button class="favorite-btn" :class="photo.isFavorite ? 'active' : ''" type="button" @click="toggleFavorite(photo)">♥</button>
          </article>
        </div>
      </template>
    </main>

    <div v-if="selectedPhoto" class="lightbox" @click.self="closeLightbox">
      <div class="lightbox-dialog" @touchstart="onLightboxTouchStart" @touchend="onLightboxTouchEnd">
        <button class="lightbox-close" type="button" @click="closeLightbox">×</button>
        <button v-if="canNavigateLightbox" class="lightbox-nav previous" type="button" @click="previousPhoto">‹</button>
        <img :src="selectedPhoto.url" :alt="albumName">
        <button v-if="canNavigateLightbox" class="lightbox-nav next" type="button" @click="nextPhoto">›</button>
        <div class="lightbox-actions-bar">
          <div class="photo-menu-wrapper">
            <button class="photo-menu-button" type="button" aria-label="Opciones de imagen" @click.stop="showPhotoMenu = !showPhotoMenu">⋯</button>
            <div v-if="showPhotoMenu" class="photo-options-panel" @click.stop>
              <div class="photo-detail-block">
                <span>Detalle de la imagen</span>
                <strong>{{ selectedPhoto.album }}</strong>
                <small>{{ formatDate(selectedPhoto.createdAt) }}</small>
              </div>

              <button class="photo-option" type="button" @click="downloadPhoto(selectedPhoto)">Descargar</button>

              <label class="photo-move-label" for="album-move-photo-select">Mover a otro álbum</label>
              <div class="photo-move-row">
                <select id="album-move-photo-select" v-model="targetAlbum" class="form-select form-select-sm">
                  <option value="" disabled>Selecciona álbum</option>
                  <option
                    v-for="album in movableAlbums"
                    :key="album.id"
                    :value="album.name"
                    :disabled="album.name === selectedPhoto.album"
                  >
                    {{ album.name }}
                  </option>
                </select>
                <button class="btn btn-sm btn-primary" type="button" :disabled="!targetAlbum || targetAlbum === selectedPhoto.album" @click="moveSelectedPhoto">
                  Mover
                </button>
              </div>

              <button class="photo-option danger" type="button" @click="deleteSelectedPhoto">Eliminar</button>
            </div>
          </div>
          <button class="btn btn-primary rounded-pill" type="button" @click="sharePhoto(selectedPhoto)">Compartir</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const loading = ref(true)
const photos = ref([])
const albums = ref([])
const selectedPhoto = ref(null)
const touchStartX = ref(0)
const showPhotoMenu = ref(false)
const targetAlbum = ref('')

const albumName = computed(() => decodeURIComponent(String(route.params.name || 'Recientes')))

const galleryPhotos = computed(() => {
  return photos.value.flatMap((post) => {
    const images = post.imagenes?.length ? post.imagenes : (post.imagen ? [post.imagen] : [])
    return images.map((url, index) => ({
      key: `${post.id}-${index}`,
      postId: post.id,
      imageIndex: index,
      url,
      album: post.categoria || 'Recientes',
      createdAt: post.createdAt,
      isFavorite: post.isFavorite
    }))
  })
})

const albumPhotos = computed(() => {
  if (albumName.value === 'Favoritos') return galleryPhotos.value.filter(photo => photo.isFavorite)
  return galleryPhotos.value.filter(photo => photo.album === albumName.value)
})

const currentPhotoIndex = computed(() => {
  return albumPhotos.value.findIndex(photo => photo.key === selectedPhoto.value?.key)
})

const canNavigateLightbox = computed(() => albumPhotos.value.length > 1)

const movableAlbums = computed(() => {
  return albums.value.filter(album => album.name !== 'Favoritos')
})

const loadAlbum = async () => {
  loading.value = true

  try {
    const res = await $fetch('/api/photos/gallery')
    photos.value = res.photos || []
    albums.value = res.albums || []
  } finally {
    loading.value = false
  }
}

const openPhoto = (photo) => {
  selectedPhoto.value = photo
  showPhotoMenu.value = false
  targetAlbum.value = ''
}

const closeLightbox = () => {
  selectedPhoto.value = null
  showPhotoMenu.value = false
  targetAlbum.value = ''
}

const nextPhoto = () => {
  if (!canNavigateLightbox.value) return
  const nextIndex = (currentPhotoIndex.value + 1) % albumPhotos.value.length
  selectedPhoto.value = albumPhotos.value[nextIndex]
  showPhotoMenu.value = false
  targetAlbum.value = ''
}

const previousPhoto = () => {
  if (!canNavigateLightbox.value) return
  const previousIndex = (currentPhotoIndex.value - 1 + albumPhotos.value.length) % albumPhotos.value.length
  selectedPhoto.value = albumPhotos.value[previousIndex]
  showPhotoMenu.value = false
  targetAlbum.value = ''
}

const onLightboxTouchStart = (event) => {
  touchStartX.value = event.changedTouches?.[0]?.clientX || 0
}

const onLightboxTouchEnd = (event) => {
  const distance = (event.changedTouches?.[0]?.clientX || 0) - touchStartX.value
  if (Math.abs(distance) < 45) return
  if (distance < 0) nextPhoto()
  else previousPhoto()
}

const onKeydown = (event) => {
  if (!selectedPhoto.value) return
  if (event.key === 'ArrowRight') nextPhoto()
  if (event.key === 'ArrowLeft') previousPhoto()
  if (event.key === 'Escape') closeLightbox()
}

const toggleFavorite = async (photo) => {
  try {
    const res = await $fetch('/api/photos/favorite', {
      method: 'POST',
      body: { postId: photo.postId }
    })

    photos.value = photos.value.map(post => post.id === photo.postId
      ? { ...post, isFavorite: res.favorite }
      : post
    )
  } catch (err) {
    alert(err?.data?.statusMessage || 'No se pudo actualizar favorito')
  }
}

const moveSelectedPhoto = async () => {
  if (!selectedPhoto.value || !targetAlbum.value) return

  try {
    await $fetch('/api/photos/move', {
      method: 'POST',
      body: {
        postId: selectedPhoto.value.postId,
        album: targetAlbum.value
      }
    })

    closeLightbox()
    await loadAlbum()
  } catch (err) {
    alert(err?.data?.statusMessage || 'No se pudo mover la foto')
  }
}

const deleteSelectedPhoto = async () => {
  if (!selectedPhoto.value) return
  const confirmed = window.confirm('¿Seguro que quieres eliminar esta imagen?')

  if (!confirmed) return

  try {
    await $fetch('/api/photos/delete', {
      method: 'POST',
      body: {
        postId: selectedPhoto.value.postId,
        imageIndex: selectedPhoto.value.imageIndex,
        imageUrl: selectedPhoto.value.url
      }
    })

    closeLightbox()
    await loadAlbum()
  } catch (err) {
    alert(err?.data?.statusMessage || 'No se pudo eliminar la imagen')
  }
}

const downloadPhoto = (photo) => {
  const link = document.createElement('a')
  link.href = photo.url
  link.download = `remind-${photo.postId}.jpg`
  link.target = '_blank'
  link.rel = 'noopener'
  link.click()
}

const sharePhoto = async (photo) => {
  if (navigator.share) {
    await navigator.share({
      title: 'Foto en Remind',
      text: 'Mira este recuerdo guardado en Remind.',
      url: photo.url
    })
    return
  }

  await navigator.clipboard.writeText(photo.url)
  alert('Enlace copiado para compartir')
}

const optimizeImage = (url, width = 700) => {
  if (typeof url !== 'string') return url
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`)
  }
  return url
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(async () => {
  await loadAlbum()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.album-page {
  background:
    radial-gradient(circle at 12% 8%, rgba(13, 110, 253, 0.14), transparent 30%),
    #f5f7fb;
  min-height: 100vh;
  overflow-x: hidden;
}

.album-hero {
  background: linear-gradient(135deg, #fff 0%, #eef4ff 100%);
  border-bottom: 1px solid rgba(13, 110, 253, 0.08);
}

.back-link {
  background: #fff;
  border: 1px solid #e5efff;
  border-radius: 999px;
  color: #0d6efd;
  display: inline-flex;
  font-weight: 800;
  padding: 0.65rem 1rem;
  text-decoration: none;
}

.eyebrow {
  color: #0d6efd;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.album-photo-grid {
  animation: albumOpen 0.8s cubic-bezier(0.2, 0.9, 0.2, 1) both;
  columns: 4 220px;
  column-gap: 1rem;
}

.photo-tile {
  animation: photoIn 0.55s ease both;
  animation-delay: var(--delay);
  break-inside: avoid;
  margin-bottom: 1rem;
  position: relative;
}

.photo-open {
  background: transparent;
  border: 0;
  border-radius: 1.25rem;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.12);
  display: block;
  overflow: hidden;
  padding: 0;
  width: 100%;
}

.photo-open img {
  display: block;
  object-fit: cover;
  transition: filter 0.25s ease, transform 0.45s ease;
  width: 100%;
}

.photo-open:hover img {
  filter: saturate(1.08) contrast(1.03);
  transform: scale(1.05);
}

.favorite-btn {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  color: #adb5bd;
  height: 2.4rem;
  position: absolute;
  right: 0.75rem;
  top: 0.75rem;
  width: 2.4rem;
}

.favorite-btn.active {
  background: #fff3cd;
  color: #b58100;
}

.empty-state {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 1.25rem;
  padding: 3rem 1.5rem;
  text-align: center;
}

.lightbox {
  align-items: center;
  animation: fadeIn 0.22s ease both;
  background: rgba(8, 15, 31, 0.9);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  z-index: 2500;
}

.lightbox-dialog {
  animation: liftIn 0.28s ease both;
  background: #fff;
  border-radius: 1.25rem;
  max-width: 920px;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.lightbox-dialog > img {
  background: #0b1220;
  display: block;
  max-height: 76vh;
  object-fit: contain;
  width: 100%;
}

.lightbox-close,
.lightbox-nav {
  border: 0;
  border-radius: 999px;
  position: absolute;
  z-index: 2;
}

.lightbox-close {
  background: rgba(0, 0, 0, 0.72);
  color: #fff;
  font-size: 1.5rem;
  height: 2.5rem;
  right: 1rem;
  top: 1rem;
  width: 2.5rem;
}

.lightbox-nav {
  background: rgba(255, 255, 255, 0.9);
  color: #0d6efd;
  font-size: 2.2rem;
  height: 3.25rem;
  top: 44%;
  transform: translateY(-50%);
  width: 3.25rem;
}

.lightbox-nav.previous { left: 1rem; }
.lightbox-nav.next { right: 1rem; }

.lightbox-actions-bar {
  display: flex;
  gap: 0.65rem;
  justify-content: space-between;
  padding: 1rem;
}

.lightbox-actions-bar .btn {
  font-weight: 800;
  min-width: 130px;
}

.photo-menu-wrapper {
  position: relative;
}

.photo-menu-button {
  align-items: center;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 999px;
  color: #1f2937;
  display: flex;
  font-size: 1.55rem;
  font-weight: 900;
  height: 2.7rem;
  justify-content: center;
  line-height: 1;
  min-width: 3.75rem;
  padding-bottom: 0.35rem;
}

.photo-options-panel {
  background: #fff;
  border: 1px solid rgba(13, 110, 253, 0.1);
  border-radius: 1rem;
  bottom: calc(100% + 0.65rem);
  box-shadow: 0 22px 50px rgba(15, 23, 42, 0.2);
  display: grid;
  gap: 0.65rem;
  left: 0;
  min-width: 280px;
  padding: 0.9rem;
  position: absolute;
  z-index: 4;
}

.photo-detail-block {
  background: #f5f8ff;
  border-radius: 0.85rem;
  display: grid;
  gap: 0.15rem;
  padding: 0.75rem;
}

.photo-detail-block span,
.photo-move-label {
  color: #6c757d;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.photo-detail-block strong {
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-detail-block small {
  color: #6c757d;
}

.photo-option {
  background: transparent;
  border: 0;
  border-radius: 0.75rem;
  color: #1f2937;
  font-weight: 800;
  padding: 0.7rem 0.75rem;
  text-align: left;
}

.photo-option:hover {
  background: #f1f5ff;
  color: #0d6efd;
}

.photo-option.danger {
  color: #dc3545;
}

.photo-option.danger:hover {
  background: #fff1f1;
  color: #b02a37;
}

.photo-move-row {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: 1fr auto;
}

@keyframes albumOpen {
  0% { filter: blur(14px); opacity: 0; transform: scale(0.92) translateY(34px); }
  60% { filter: blur(0); opacity: 1; transform: scale(1.02) translateY(-6px); }
  100% { filter: blur(0); opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes photoIn {
  from { opacity: 0; transform: translateY(18px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes liftIn {
  from { opacity: 0; transform: translateY(18px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 768px) {
  .album-photo-grid {
    columns: 2 150px;
  }

  .lightbox {
    align-items: stretch;
    padding: 0;
  }

  .lightbox-dialog {
    border-radius: 0;
    display: grid;
    grid-template-rows: 1fr auto;
    max-height: 100vh;
    max-width: 100vw;
  }

  .lightbox-dialog > img {
    height: 100%;
    max-height: none;
    min-height: 0;
  }

  .lightbox-nav {
    display: none;
  }

  .lightbox-actions-bar {
    background: #fff;
    gap: 0.5rem;
  }

  .photo-options-panel {
    bottom: calc(100% + 0.5rem);
    left: 0;
    max-width: calc(100vw - 1rem);
    min-width: min(280px, calc(100vw - 1rem));
  }

  .photo-move-row {
    grid-template-columns: 1fr;
  }

  .lightbox-actions-bar .btn {
    min-width: 0;
    width: 100%;
  }
}
</style>
