<template>
  <div class="gallery-page">
    <section class="gallery-hero">
      <div class="container py-4 py-md-5">
        <div class="d-flex flex-wrap justify-content-between align-items-end gap-3">
          <div>
            <p class="eyebrow mb-2">Galería</p>
            <h1 class="display-6 fw-bold mb-2">Tus recuerdos organizados</h1>
            <p class="text-muted mb-0">Crea álbumes, mueve fotos, marca favoritas, descarga o comparte tus imágenes.</p>
          </div>
          <NuxtLink to="/postear" class="btn btn-primary rounded-pill px-4">
            Subir fotos
          </NuxtLink>
        </div>
      </div>
    </section>

    <main class="container py-4">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="text-muted mt-2">Cargando galería...</p>
      </div>

      <template v-else>
        <div class="gallery-tools shadow-sm mb-4">
          <div class="album-create">
            <input
              v-model="newAlbumName"
              class="form-control rounded-pill"
              placeholder="Nombre del nuevo álbum"
              @keyup.enter="createAlbum"
            >
            <button class="btn btn-outline-primary rounded-pill" :disabled="creatingAlbum || !newAlbumName.trim()" @click="createAlbum">
              Crear álbum
            </button>
          </div>
          <input v-model="search" class="form-control rounded-pill" placeholder="Buscar álbum o fecha">
        </div>

        <div class="album-grid mb-4">
          <button
            v-for="album in visibleAlbums"
            :key="album.id"
            class="album-card"
            @click="openAlbum(album.name)"
          >
            <div class="album-stack">
              <img
                v-for="(url, index) in getAlbumPreviewUrls(album.name)"
                :key="`${album.name}-${url}-${index}`"
                :src="optimizeImage(url, 260)"
                :alt="album.name"
                :style="{ '--stack-index': index }"
              >
              <div v-if="!getAlbumPreviewUrls(album.name).length" class="album-stack-empty">R</div>
            </div>
            <div class="album-card-body">
              <span>{{ album.count }}</span>
              <strong>{{ album.name }}</strong>
              <small>{{ album.automatic ? 'Automático' : 'Personal' }}</small>
            </div>
          </button>
        </div>

        <div v-if="!galleryPhotos.length" class="empty-state shadow-sm">
          <h4>Aún no tienes fotos</h4>
          <p class="text-muted">Sube tus primeras imágenes y Remind creará tu galería automáticamente.</p>
          <NuxtLink to="/postear" class="btn btn-primary rounded-pill px-4">Subir fotos</NuxtLink>
        </div>
      </template>
    </main>

    <div v-if="selectedPhoto" class="lightbox" @click.self="closeLightbox">
      <div
        class="lightbox-dialog"
        @touchstart="onLightboxTouchStart"
        @touchend="onLightboxTouchEnd"
      >
        <button class="lightbox-close" @click="closeLightbox">×</button>
        <button v-if="canNavigateLightbox" class="lightbox-nav previous" type="button" @click="previousPhoto">‹</button>
        <img :src="selectedPhoto.url" :alt="selectedPhoto.album" @error="useBackupImage($event, selectedPhoto)">
        <button v-if="canNavigateLightbox" class="lightbox-nav next" type="button" @click="nextPhoto">›</button>
        <div class="lightbox-actions-bar">
          <div class="photo-menu-wrapper">
            <button class="photo-menu-button" type="button" aria-label="Opciones de imagen" @click.stop="showPhotoMenu = !showPhotoMenu">
              ⋯
            </button>
            <div v-if="showPhotoMenu" class="photo-options-panel" @click.stop>
              <div class="photo-detail-block">
                <span>Detalle de la imagen</span>
                <strong>{{ selectedPhoto.album }}</strong>
                <small>{{ formatDate(selectedPhoto.createdAt) }}</small>
              </div>

              <button class="photo-option" type="button" @click="downloadPhoto(selectedPhoto)">
                Descargar
              </button>

              <label class="photo-move-label" for="move-photo-select">Mover a otro álbum</label>
              <div class="photo-move-row">
                <select id="move-photo-select" v-model="targetAlbum" class="form-select form-select-sm">
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

              <button class="photo-option danger" type="button" @click="deleteSelectedPhoto">
                Eliminar
              </button>
            </div>
          </div>
          <button class="btn btn-primary rounded-pill" type="button" @click="sharePhoto(selectedPhoto)">
            Compartir
          </button>
        </div>
        <div v-if="canNavigateLightbox" class="lightbox-thumbs">
          <button
            v-for="photo in lightboxPhotos"
            :key="photo.key"
            :class="photo.key === selectedPhoto.key ? 'active' : ''"
            type="button"
            @click="openPhoto(photo)"
          >
            <img :src="optimizeImage(photo.url, 140)" :alt="photo.album">
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const loading = ref(true)
const creatingAlbum = ref(false)
const photos = ref([])
const albums = ref([])
const activeAlbum = ref('Recientes')
const newAlbumName = ref('')
const search = ref('')
const selectedPhoto = ref(null)
const touchStartX = ref(0)
const showPhotoMenu = ref(false)
const targetAlbum = ref('')

const galleryPhotos = computed(() => {
  return photos.value.flatMap((post) => {
    const images = post.imagenes?.length ? post.imagenes : (post.imagen ? [post.imagen] : [])
    const backups = post.imagenesBackup?.length ? post.imagenesBackup : (post.imagenBackup ? [post.imagenBackup] : [])
    return images.map((url, index) => ({
      key: `${post.id}-${index}`,
      postId: post.id,
      imageIndex: index,
      url,
      backupUrl: backups[index],
      album: post.categoria || 'Recientes',
      createdAt: post.createdAt,
      isFavorite: post.isFavorite
    }))
  })
})

const visibleAlbums = computed(() => {
  const query = search.value.trim().toLowerCase()
  const baseAlbums = albums.value.length ? albums.value : [{ id: 'Recientes', name: 'Recientes', count: 0, automatic: true }]

  if (!query) return baseAlbums

  return baseAlbums.filter(album => album.name.toLowerCase().includes(query))
})

const movableAlbums = computed(() => {
  return albums.value.filter(album => album.name !== 'Favoritos')
})

const filteredPhotos = computed(() => {
  if (activeAlbum.value === 'Favoritos') {
    return galleryPhotos.value.filter(photo => photo.isFavorite)
  }

  return galleryPhotos.value.filter(photo => photo.album === activeAlbum.value)
})

const lightboxPhotos = computed(() => {
  if (!selectedPhoto.value) return []
  const photosInAlbum = filteredPhotos.value.length ? filteredPhotos.value : galleryPhotos.value
  return photosInAlbum.length ? photosInAlbum : [selectedPhoto.value]
})

const currentPhotoIndex = computed(() => {
  return lightboxPhotos.value.findIndex(photo => photo.key === selectedPhoto.value?.key)
})

const canNavigateLightbox = computed(() => lightboxPhotos.value.length > 1)

const openAlbum = (album) => {
  return navigateTo(`/album/${encodeURIComponent(album)}`)
}

const getAlbumPreviewUrls = (albumName) => {
  const source = albumName === 'Favoritos'
    ? galleryPhotos.value.filter(photo => photo.isFavorite)
    : galleryPhotos.value.filter(photo => photo.album === albumName)

  return source.slice(0, 3).map(photo => photo.url)
}

const openPhoto = (photo) => {
  selectedPhoto.value = photo
  showPhotoMenu.value = false
  targetAlbum.value = ''
}

const useBackupImage = (event, photo) => {
  if (!photo?.backupUrl || event.target.dataset.backupApplied) return
  event.target.dataset.backupApplied = 'true'
  event.target.src = photo.backupUrl
}

const closeLightbox = () => {
  selectedPhoto.value = null
  showPhotoMenu.value = false
  targetAlbum.value = ''
}

const nextPhoto = () => {
  if (!canNavigateLightbox.value) return
  const nextIndex = (currentPhotoIndex.value + 1) % lightboxPhotos.value.length
  selectedPhoto.value = lightboxPhotos.value[nextIndex]
  showPhotoMenu.value = false
  targetAlbum.value = ''
}

const previousPhoto = () => {
  if (!canNavigateLightbox.value) return
  const previousIndex = (currentPhotoIndex.value - 1 + lightboxPhotos.value.length) % lightboxPhotos.value.length
  selectedPhoto.value = lightboxPhotos.value[previousIndex]
  showPhotoMenu.value = false
  targetAlbum.value = ''
}

const onLightboxTouchStart = (event) => {
  touchStartX.value = event.changedTouches?.[0]?.clientX || 0
}

const onLightboxTouchEnd = (event) => {
  const touchEndX = event.changedTouches?.[0]?.clientX || 0
  const distance = touchEndX - touchStartX.value

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

const loadGallery = async () => {
  loading.value = true

  try {
    const res = await $fetch('/api/photos/gallery')
    photos.value = res.photos || []
    albums.value = res.albums || []

    if (!albums.value.some(album => album.name === activeAlbum.value)) {
      activeAlbum.value = albums.value[0]?.name || 'Recientes'
    }
  } finally {
    loading.value = false
  }
}

const createAlbum = async () => {
  const name = newAlbumName.value.trim()
  if (!name) return

  creatingAlbum.value = true

  try {
    await $fetch('/api/albums/create', {
      method: 'POST',
      body: { name }
    })
    newAlbumName.value = ''
    await loadGallery()
    activeAlbum.value = name
  } catch (err) {
    alert(err?.data?.statusMessage || 'No se pudo crear el álbum')
  } finally {
    creatingAlbum.value = false
  }
}

const movePhoto = async (photo, album) => {
  if (!album || album === photo.album) return

  try {
    await $fetch('/api/photos/move', {
      method: 'POST',
      body: {
        postId: photo.postId,
        album
      }
    })
    await loadGallery()
    activeAlbum.value = album
  } catch (err) {
    alert(err?.data?.statusMessage || 'No se pudo mover la foto')
  }
}

const moveSelectedPhoto = async () => {
  if (!selectedPhoto.value || !targetAlbum.value) return

  await movePhoto(selectedPhoto.value, targetAlbum.value)
  selectedPhoto.value = {
    ...selectedPhoto.value,
    album: targetAlbum.value
  }
  showPhotoMenu.value = false
  targetAlbum.value = ''
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
    await loadGallery()
  } catch (err) {
    alert(err?.data?.statusMessage || 'No se pudo eliminar la imagen')
  }
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
    await loadGallery()
  } catch (err) {
    alert(err?.data?.statusMessage || 'No se pudo actualizar favorito')
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
  await loadGallery()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.gallery-page {
  background:
    radial-gradient(circle at 6% 4%, rgba(13, 110, 253, 0.12), transparent 28%),
    radial-gradient(circle at 92% 16%, rgba(255, 193, 7, 0.14), transparent 24%),
    #f5f7fb;
  min-height: 100vh;
  overflow-x: hidden;
}

.gallery-hero {
  background:
    radial-gradient(circle at 10% 10%, rgba(13, 110, 253, 0.22), transparent 32%),
    radial-gradient(circle at 90% 0%, rgba(255, 193, 7, 0.18), transparent 26%),
    linear-gradient(135deg, #fff 0%, #eef4ff 100%);
  border-bottom: 1px solid rgba(13, 110, 253, 0.08);
}

.eyebrow {
  color: #0d6efd;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.gallery-tools {
  align-items: center;
  background: #fff;
  border: 1px solid rgba(13, 110, 253, 0.1);
  border-radius: 1.25rem;
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr minmax(220px, 0.45fr);
  padding: 1rem;
  transform: translateY(0);
}

.album-create {
  display: flex;
  gap: 0.75rem;
}

.album-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  padding: 1rem 0 1.35rem;
}

.album-card {
  background: transparent;
  border: 0;
  color: #1f2937;
  padding: 0;
  position: relative;
  text-align: center;
  transition: transform 0.25s ease;
}

.album-card:hover {
  transform: translateY(-9px) scale(1.02);
}

.album-stack {
  height: 178px;
  margin-bottom: 0.7rem;
  position: relative;
}

.album-stack img,
.album-stack-empty {
  aspect-ratio: 4 / 3;
  border-radius: 1.25rem;
  box-shadow: 0 24px 42px rgba(15, 23, 42, 0.2);
  height: 135px;
  left: 50%;
  object-fit: cover;
  position: absolute;
  top: calc(14px + (var(--stack-index, 1) * 10px));
  transform: translateX(-50%) rotate(calc((var(--stack-index, 1) - 1) * 9deg));
  transition: transform 0.32s ease, top 0.32s ease;
  width: 178px;
}

.album-card:hover .album-stack img {
  top: calc(6px + (var(--stack-index, 1) * 10px));
  transform: translateX(-50%) rotate(calc((var(--stack-index, 1) - 1) * 13deg)) scale(1.06);
}

.album-stack img:nth-child(1) {
  z-index: 3;
}

.album-stack img:nth-child(2) {
  filter: saturate(0.95);
  opacity: 0.9;
  z-index: 2;
}

.album-stack img:nth-child(3) {
  filter: saturate(0.9);
  opacity: 0.78;
  z-index: 1;
}

.album-stack-empty {
  align-items: center;
  background: linear-gradient(135deg, #0d6efd, #6ea8fe);
  color: #fff;
  display: flex;
  font-size: 2rem;
  font-weight: 900;
  justify-content: center;
  z-index: 1;
}

.album-card-body {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(13, 110, 253, 0.08);
  border-radius: 999px;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
  display: inline-flex;
  gap: 0.45rem;
  max-width: 100%;
  padding: 0.55rem 0.85rem;
  position: relative;
  z-index: 1;
}

.album-card span,
.album-card strong,
.album-card small {
  display: inline;
  line-height: 1.2;
}

.album-card span {
  color: #0d6efd;
  font-size: 0.9rem;
  font-weight: 800;
}

.album-card strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.album-card small {
  color: #6c757d;
  display: none;
}

.photo-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  perspective: 1200px;
}

.album-reveal {
  animation: albumReveal 0.72s cubic-bezier(0.2, 0.9, 0.2, 1) both;
}

.photo-card,
.empty-state {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 1.25rem;
}

.photo-card {
  animation: cardIn 0.55s ease both;
  animation-delay: var(--delay);
  overflow: hidden;
  transform-origin: center bottom;
  transition: box-shadow 0.25s ease, transform 0.25s ease;
}

.photo-card:hover {
  box-shadow: 0 20px 44px rgba(15, 23, 42, 0.14) !important;
  transform: translateY(-6px) rotateX(1deg);
}

.photo-preview {
  background: #e9ecef;
  border: 0;
  overflow: hidden;
  padding: 0;
  width: 100%;
}

.photo-preview img {
  aspect-ratio: 1;
  display: block;
  object-fit: cover;
  transition: filter 0.25s ease, transform 0.45s ease;
  width: 100%;
}

.photo-card:hover .photo-preview img {
  filter: saturate(1.08) contrast(1.03);
  transform: scale(1.06);
}

.photo-body {
  padding: 0.9rem;
}

.album-pill {
  background: #edf4ff;
  border-radius: 999px;
  color: #0d6efd;
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.25rem 0.65rem;
}

.favorite-btn {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 50%;
  color: #adb5bd;
  height: 2.25rem;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
  width: 2.25rem;
}

.favorite-btn:hover {
  transform: scale(1.08);
}

.favorite-btn.active {
  background: #fff3cd;
  border-color: #ffc107;
  color: #b58100;
}

.photo-actions {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: 1fr 1fr;
}

.empty-state {
  padding: 3rem 1.5rem;
  text-align: center;
}

.lightbox {
  align-items: center;
  background: rgba(8, 15, 31, 0.86);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  z-index: 2500;
  animation: fadeIn 0.22s ease both;
}

.lightbox-dialog {
  background: #fff;
  border-radius: 1.25rem;
  max-width: 920px;
  overflow: hidden;
  position: relative;
  width: 100%;
  animation: liftIn 0.28s ease both;
}

.lightbox-dialog > img {
  background: #0b1220;
  display: block;
  max-height: 76vh;
  object-fit: contain;
  width: 100%;
}

.lightbox-close {
  background: rgba(0, 0, 0, 0.72);
  border: 0;
  border-radius: 50%;
  color: #fff;
  font-size: 1.5rem;
  height: 2.5rem;
  position: absolute;
  right: 1rem;
  top: 1rem;
  width: 2.5rem;
  z-index: 2;
}

.lightbox-nav {
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  border: 0;
  border-radius: 999px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
  color: #0d6efd;
  display: flex;
  font-size: 2.2rem;
  height: 3.25rem;
  justify-content: center;
  line-height: 1;
  position: absolute;
  top: 44%;
  transform: translateY(-50%);
  transition: background 0.2s ease, transform 0.2s ease;
  width: 3.25rem;
  z-index: 2;
}

.lightbox-nav:hover {
  background: #fff;
  transform: translateY(-50%) scale(1.05);
}

.lightbox-nav.previous {
  left: 1rem;
}

.lightbox-nav.next {
  right: 1rem;
}

.lightbox-actions-bar {
  align-items: center;
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
  transition: background 0.2s ease, transform 0.2s ease;
}

.photo-menu-button:hover {
  background: #fff;
  transform: translateY(-1px);
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
  transition: background 0.2s ease, color 0.2s ease;
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

.lightbox-thumbs {
  background: #f8f9fa;
  border-top: 1px solid #edf0f3;
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.75rem 1rem;
  scroll-snap-type: x mandatory;
}

.lightbox-thumbs button {
  background: #fff;
  border: 2px solid transparent;
  border-radius: 0.8rem;
  flex: 0 0 58px;
  height: 58px;
  overflow: hidden;
  padding: 0;
  scroll-snap-align: start;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.lightbox-thumbs button.active {
  border-color: #0d6efd;
  transform: translateY(-2px);
}

.lightbox-thumbs img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes liftIn {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes albumReveal {
  0% {
    filter: blur(10px) saturate(1.3);
    opacity: 0;
    transform: translateY(28px) scale(0.94);
  }
  55% {
    filter: blur(0) saturate(1.1);
    opacity: 1;
    transform: translateY(-6px) scale(1.015);
  }
  100% {
    filter: blur(0) saturate(1);
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 768px) {
  .gallery-tools,
  .album-create {
    grid-template-columns: 1fr;
  }

  .gallery-tools,
  .album-create {
    display: grid;
  }

  .gallery-tools .btn,
  .gallery-hero .btn {
    width: 100%;
  }

  .album-grid {
    gap: 1.15rem 0.85rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding-top: 0.5rem;
  }

  .album-card:hover {
    transform: none;
  }

  .album-stack {
    height: 132px;
    margin-bottom: 0.55rem;
  }

  .album-stack img,
  .album-stack-empty {
    border-radius: 1rem;
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.18);
    height: 98px;
    top: calc(10px + (var(--stack-index, 1) * 8px));
    transform: translateX(-50%) rotate(calc((var(--stack-index, 1) - 1) * 7deg));
    width: 130px;
  }

  .album-card:hover .album-stack img {
    top: calc(10px + (var(--stack-index, 1) * 8px));
    transform: translateX(-50%) rotate(calc((var(--stack-index, 1) - 1) * 7deg));
  }

  .album-card-body {
    align-items: center;
    background: transparent;
    border: 0;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0;
  }

  .album-card strong {
    max-width: 100%;
  }

  .photo-grid {
    grid-template-columns: 1fr;
  }

  .photo-preview img {
    aspect-ratio: 4 / 3;
  }

  .lightbox {
    align-items: stretch;
    padding: 0;
  }

  .lightbox-dialog {
    border-radius: 0;
    display: grid;
    grid-template-rows: 1fr auto auto;
    max-height: 100vh;
    max-width: 100vw;
  }

  .lightbox-dialog > img {
    height: 100%;
    max-height: none;
    min-height: 0;
    object-fit: contain;
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

  .lightbox-thumbs {
    display: none;
  }
}
</style>
