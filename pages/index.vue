<template>
<div class="gallery-page">

  <section class="hero-section">
    <div class="container py-5">
      <div class="row align-items-center g-4">
        <div class="col-lg-7">
          <p class="eyebrow mb-2">Remind</p>
          <h1 class="display-5 fw-bold mb-3">Tu archivo personal de recuerdos</h1>
          <p class="lead text-muted mb-4">
            Organiza tus fotografías por álbumes, marca favoritas y encuentra rápido cada momento que guardaste.
          </p>
          <div class="d-flex flex-wrap gap-2">
            <NuxtLink v-if="isLoggedIn" to="/postear" class="btn btn-primary btn-lg rounded-pill px-4">
              Subir fotos
            </NuxtLink>
            <template v-else>
              <NuxtLink to="/login" class="btn btn-primary btn-lg rounded-pill px-4">
                Iniciar sesión
              </NuxtLink>
              <NuxtLink to="/register" class="btn btn-outline-primary btn-lg rounded-pill px-4">
                Crear cuenta
              </NuxtLink>
            </template>
            <a href="#quienes-somos" class="btn btn-light btn-lg rounded-pill px-4 border">
              Quiénes somos
            </a>
            <NuxtLink to="/politica-privacidad" class="btn btn-light btn-lg rounded-pill px-4 border">
              Política y privacidad
            </NuxtLink>
          </div>
        </div>

        <div class="col-lg-5" v-if="isLoggedIn">
          <div class="stats-panel shadow-sm">
            <div>
              <span class="stat-number">{{ stats.images }}</span>
              <span class="stat-label">Fotos</span>
            </div>
            <div>
              <span class="stat-number">{{ stats.albums }}</span>
              <span class="stat-label">Álbumes</span>
            </div>
            <div>
              <span class="stat-number">{{ stats.favorites }}</span>
              <span class="stat-label">Favoritas</span>
            </div>
          </div>
        </div>

        <div class="col-lg-5" v-else>
          <div class="public-slider shadow-lg">
            <img :src="heroSlides[activeSlide].image" :alt="heroSlides[activeSlide].title">
            <div class="slider-caption">
              <strong>{{ heroSlides[activeSlide].title }}</strong>
              <span>{{ heroSlides[activeSlide].text }}</span>
            </div>
            <div class="slider-dots">
              <button
                v-for="(slide, index) in heroSlides"
                :key="slide.image"
                :class="index === activeSlide ? 'active' : ''"
                @click="activeSlide = index"
              ></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section v-if="!isLoggedIn" class="container pb-5">
    <div class="subscription-card shadow-sm mb-5">
      <div>
        <p class="eyebrow mb-2">Almacenamiento privado</p>
        <h3 class="fw-bold mb-2">Guarda tus fotos sin depender del feed público</h3>
        <p class="text-muted mb-0">
          Crea álbumes personales, marca favoritos y conserva tus recuerdos en una galería organizada.
        </p>
      </div>
      <NuxtLink to="/register" class="btn btn-primary btn-lg rounded-pill px-4">
        Suscríbete
      </NuxtLink>
    </div>

    <PwaInstall class="mb-5" />

    <section id="quienes-somos" class="about-section shadow-sm mb-5">
      <div class="row g-4 align-items-start">
        <div class="col-lg-4">
          <p class="eyebrow mb-2">Quiénes somos</p>
          <h2 class="fw-bold mb-3">Recuerdos seguros, historias vivas</h2>
          <p class="about-highlight mb-0">
            Remind fue creada para preservar los momentos más importantes de las personas.
          </p>
        </div>
        <div class="col-lg-8">
          <p>
            <strong>Remind</strong> es una aplicación creada por el diseñador y desarrollador web
            <strong>Yordy Olivares Durango</strong> y la diseñadora gráfica
            <strong>Nuvis Guzmán Galeano</strong>, quienes unieron sus conocimientos en tecnología,
            diseño e innovación para desarrollar una plataforma pensada para preservar los recuerdos
            más importantes de las personas.
          </p>
          <p>
            Este proyecto nació de una realidad muy común: muchas personas capturan fotografías y videos
            de momentos especiales con sus familiares, amigos, viajes y celebraciones, pero con el paso
            del tiempo se ven obligadas a eliminarlos por falta de espacio en sus dispositivos móviles.
            En otros casos, la pérdida o el robo del teléfono, daños inesperados o cambios de equipo hacen
            que esos recuerdos desaparezcan para siempre.
          </p>
          <p>
            Con ese propósito nació <strong>Remind</strong>, una aplicación que permite almacenar fotografías
            y videos de forma segura en la nube, brindando la tranquilidad de saber que esos momentos
            permanecerán protegidos y disponibles cuando el usuario los necesite.
          </p>
          <p>
            Además del almacenamiento privado, Remind ofrece un espacio donde las personas pueden compartir
            sus recuerdos con una comunidad, descubrir experiencias de otros usuarios y organizar sus
            fotografías en álbumes personalizados, manteniendo siempre el control sobre qué contenido desean
            conservar de forma privada y cuál desean compartir.
          </p>
          <p>
            Nuestra misión es convertir a Remind en mucho más que una galería de fotos. Queremos que sea un
            lugar donde los recuerdos permanezcan vivos, donde cada imagen conserve su historia y donde las
            personas puedan revivir los momentos que marcaron sus vidas, sin preocuparse por el espacio de
            almacenamiento, la pérdida de un dispositivo o cualquier imprevisto.
          </p>
          <p class="mb-0">
            En Remind creemos que cada fotografía cuenta una historia y que los recuerdos más valiosos
            merecen un lugar seguro donde permanecer para siempre.
          </p>
        </div>
      </div>
    </section>

    <div class="row g-4 mb-5">
      <div v-for="feature in publicFeatures" :key="feature.title" class="col-md-4">
        <div class="feature-card shadow-sm h-100">
          <span>{{ feature.icon }}</span>
          <h5>{{ feature.title }}</h5>
          <p class="text-muted mb-0">{{ feature.text }}</p>
        </div>
      </div>
    </div>

    <div class="reviews-section">
      <div class="text-center mb-4">
        <p class="eyebrow mb-2">Remind</p>
        <h3 class="fw-bold">Reseñas de usuarios</h3>
        <p class="text-muted mb-0">Opiniones usuarios activos.</p>
      </div>

      <div v-if="visibleReviews.length" class="reviews-carousel" :class="{ 'is-sliding': visibleReviews.length > 3 }">
        <div class="reviews-track">
        <div v-for="(review, index) in carouselReviews" :key="`${review.id}-${index}`" class="review-slide">
          <NuxtLink
            v-if="review.userId"
            :to="`/biografia?id=${review.userId}`"
            class="review-card review-link shadow-sm h-100"
          >
            <div class="review-stars">{{ '★'.repeat(review.rating) }}</div>
            <p>“{{ review.text }}”</p>
            <strong>{{ review.name }}</strong>
            <span class="profile-link-label">Ver perfil</span>
          </NuxtLink>
          <div v-else class="review-card shadow-sm h-100">
            <div class="review-stars">{{ '★'.repeat(review.rating) }}</div>
            <p>“{{ review.text }}”</p>
            <strong>{{ review.name }}</strong>
          </div>
        </div>
        </div>
      </div>

      <div v-else class="empty-reviews shadow-sm">
        <p class="mb-0 text-muted">Aún no hay reseñas publicadas por usuarios.</p>
      </div>
    </div>
  </section>

  <section v-else class="container pb-5">
    <PwaInstall class="mb-4" />

    <div class="toolbar shadow-sm mb-4">
      <div>
        <h5 class="mb-1">Tus álbumes</h5>
        <p class="text-muted small mb-0">Todas tus carpetas organizadas en un solo lugar.</p>
      </div>
      <input
        v-model="search"
        type="search"
        class="form-control search-input"
        placeholder="Buscar álbum"
      >
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="text-muted mt-2">Cargando álbumes...</p>
    </div>

    <div v-else-if="!galleryPhotos.length" class="empty-state shadow-sm">
      <h4>Aún no tienes fotos guardadas</h4>
      <p class="text-muted">Sube tus primeras imágenes y empieza a construir tus álbumes.</p>
      <NuxtLink to="/postear" class="btn btn-primary rounded-pill px-4">Subir fotos</NuxtLink>
    </div>

    <div v-else-if="!visibleAlbums.length" class="empty-state shadow-sm">
      <h4>No hay álbumes con ese nombre</h4>
      <p class="text-muted mb-0">Prueba con otra búsqueda.</p>
    </div>

    <div v-else class="album-grid">
      <button
        v-for="album in visibleAlbums"
        :key="album.id"
        class="album-card"
        type="button"
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
        </div>
      </button>
    </div>
  </section>

</div>
</template>

<script setup>
const { isLoggedIn, checkAuth } = useAuth()

const loading = ref(false)
const photos = ref([])
const albums = ref([])
const publicReviews = ref([])
const stats = ref({ albums: 0, posts: 0, images: 0, favorites: 0 })
const activeSlide = ref(0)
const search = ref('')
let slideInterval = null

const heroSlides = [
  {
    title: 'Recuerdos espontáneos',
    text: 'Fotos personales siempre organizadas.',
    image: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1100&q=80'
  },
  {
    title: 'Momentos en familia',
    text: 'Álbumes privados para lo importante.',
    image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1100&q=80'
  },
  {
    title: 'Viajes y aventuras',
    text: 'Clasifica cada historia por categoría.',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1100&q=80'
  }
]

const publicFeatures = [
  { icon: '▦', title: 'Álbumes claros', text: 'Categorías para separar viajes, familia, trabajo y eventos.' },
  { icon: '★', title: 'Favoritos', text: 'Marca tus mejores fotos y encuéntralas en segundos.' },
  { icon: '🔒', title: 'Privado', text: 'El inicio no expone fotos públicas de otros usuarios.' }
]

const galleryPhotos = computed(() => {
  return photos.value.flatMap((post) => {
    const images = post.imagenes?.length ? post.imagenes : (post.imagen ? [post.imagen] : [])
    return images.map((url, index) => ({
      key: `${post.id}-${index}`,
      postId: post.id,
      url,
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

const visibleReviews = computed(() => {
  return publicReviews.value.map((review) => ({
    id: review.id,
    userId: review.user?.id,
    rating: review.rating,
    text: review.text,
    name: `${review.user?.nombre || 'Usuario'} ${review.user?.apellido || ''}`.trim()
  }))
})
const carouselReviews = computed(() => {
  if (visibleReviews.value.length > 3) {
    return [...visibleReviews.value, ...visibleReviews.value]
  }

  return visibleReviews.value
})

const loadPublicReviews = async () => {
  try {
    const res = await $fetch('/api/reviews/public')
    publicReviews.value = res.reviews || []
  } catch {
    publicReviews.value = []
  }
}

const loadGallery = async () => {
  if (!isLoggedIn.value) return

  loading.value = true

  try {
    const res = await $fetch('/api/photos/gallery')
    photos.value = res.photos || []
    albums.value = res.albums || []
    stats.value = res.stats || { albums: 0, posts: 0, images: 0, favorites: 0 }
  } catch (err) {
    if (err?.statusCode === 401) return
    console.error('Error cargando galería:', err)
  } finally {
    loading.value = false
  }
}

const openAlbum = (album) => {
  return navigateTo(`/album/${encodeURIComponent(album)}`)
}

const getAlbumPreviewUrls = (albumName) => {
  const source = albumName === 'Favoritos'
    ? galleryPhotos.value.filter(photo => photo.isFavorite)
    : galleryPhotos.value.filter(photo => photo.album === albumName)

  return source.slice(0, 3).map(photo => photo.url)
}

const optimizeImage = (url, width = 900) => {
  if (typeof url !== 'string') return url
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`)
  }
  return url
}

onMounted(async () => {
  await checkAuth()
  if (!isLoggedIn.value) {
    await loadPublicReviews()
    slideInterval = setInterval(() => {
      activeSlide.value = (activeSlide.value + 1) % heroSlides.length
    }, 4500)
  }
  await loadGallery()
})

onUnmounted(() => {
  if (slideInterval) clearInterval(slideInterval)
})
</script>

<style scoped>
.gallery-page {
  background: #f5f7fb;
  min-height: 100vh;
  overflow-x: hidden;
}

.hero-section {
  background:
    radial-gradient(circle at 15% 20%, rgba(13, 110, 253, 0.16), transparent 28%),
    linear-gradient(135deg, #ffffff 0%, #eef4ff 100%);
  border-bottom: 1px solid rgba(13, 110, 253, 0.08);
}

.eyebrow {
  color: #0d6efd;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.public-slider {
  border-radius: 1.5rem;
  min-height: 360px;
  overflow: hidden;
  position: relative;
}

.public-slider img {
  display: block;
  height: 420px;
  object-fit: cover;
  width: 100%;
}

.slider-caption {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.72), transparent);
  bottom: 0;
  color: #fff;
  left: 0;
  padding: 4rem 1.25rem 1.25rem;
  position: absolute;
  right: 0;
}

.slider-caption strong,
.slider-caption span {
  display: block;
}

.slider-caption strong {
  font-size: 1.3rem;
}

.slider-dots {
  display: flex;
  gap: 0.45rem;
  position: absolute;
  right: 1.25rem;
  top: 1.25rem;
}

.slider-dots button {
  background: rgba(255, 255, 255, 0.55);
  border: 0;
  border-radius: 999px;
  height: 0.55rem;
  width: 0.55rem;
}

.slider-dots button.active {
  background: #fff;
  width: 1.35rem;
}

.subscription-card {
  align-items: center;
  background: #fff;
  border: 1px solid rgba(13, 110, 253, 0.1);
  border-radius: 1.5rem;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  padding: 1.5rem;
}

.feature-card,
.review-card {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 1.25rem;
  padding: 1.25rem;
}

.reviews-carousel {
  overflow: hidden;
  padding: 0.4rem 0 0.9rem;
}

.reviews-track {
  display: flex;
  gap: 1rem;
}

.reviews-carousel:not(.is-sliding) .reviews-track {
  flex-wrap: wrap;
  justify-content: center;
}

.review-slide {
  flex: 1 1 280px;
  max-width: 360px;
}

.reviews-carousel.is-sliding .reviews-track {
  animation: reviews-scroll 44s linear infinite;
  width: max-content;
}

.reviews-carousel.is-sliding:hover .reviews-track {
  animation-play-state: paused;
}

.reviews-carousel.is-sliding .review-slide {
  flex: 0 0 340px;
  max-width: 340px;
}

.empty-reviews {
  background: #fff;
  border: 1px dashed rgba(13, 110, 253, 0.2);
  border-radius: 1.25rem;
  padding: 1.5rem;
  text-align: center;
}

@keyframes reviews-scroll {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-50%);
  }
}

.about-section {
  background:
    linear-gradient(135deg, rgba(13, 110, 253, 0.1), rgba(255, 255, 255, 0) 42%),
    #fff;
  border: 1px solid rgba(13, 110, 253, 0.1);
  border-radius: 1.5rem;
  scroll-margin-top: 2rem;
  padding: 2rem;
}

.about-section p {
  color: #495057;
  line-height: 1.75;
}

.about-highlight {
  color: #0d6efd;
  font-size: 1.1rem;
  font-weight: 700;
}

.feature-card span {
  align-items: center;
  background: #edf4ff;
  border-radius: 1rem;
  color: #0d6efd;
  display: inline-flex;
  font-size: 1.4rem;
  height: 3rem;
  justify-content: center;
  margin-bottom: 1rem;
  width: 3rem;
}

.review-stars {
  color: #b58100;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin-bottom: 0.75rem;
}

.review-link {
  color: inherit;
  display: block;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.review-link:hover {
  box-shadow: 0 14px 30px rgba(13, 110, 253, 0.14) !important;
  transform: translateY(-2px);
}

.profile-link-label {
  color: #0d6efd;
  display: inline-block;
  font-size: 0.85rem;
  font-weight: 700;
  margin-top: 0.85rem;
}

.stats-panel {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(13, 110, 253, 0.12);
  border-radius: 1.5rem;
  padding: 1.25rem;
  backdrop-filter: blur(12px);
}

.stat-number,
.stat-label {
  display: block;
  text-align: center;
}

.stat-number {
  color: #0d6efd;
  font-size: 2rem;
  font-weight: 800;
}

.stat-label {
  color: #6c757d;
  font-size: 0.8rem;
  text-transform: uppercase;
}

.toolbar,
.empty-state {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 1.25rem;
  padding: 1.25rem;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.search-input {
  max-width: 360px;
  border-radius: 999px;
}

.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
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

.album-stack img:nth-child(1) { z-index: 3; }
.album-stack img:nth-child(2) { filter: saturate(0.95); opacity: 0.9; z-index: 2; }
.album-stack img:nth-child(3) { filter: saturate(0.9); opacity: 0.78; z-index: 1; }

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
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.album-card-body span {
  color: #0d6efd;
  font-size: 0.9rem;
  font-weight: 800;
}

.album-card-body strong {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .hero-section .container {
    padding-bottom: 2rem !important;
    padding-top: 2rem !important;
  }

  .hero-section .display-5 {
    font-size: 2rem;
    line-height: 1.08;
  }

  .hero-section .lead {
    font-size: 1rem;
  }

  .hero-section .btn-lg {
    flex: 1 1 100%;
    font-size: 0.95rem;
    padding-bottom: 0.75rem;
    padding-top: 0.75rem;
  }

  .public-slider {
    border-radius: 1rem;
    min-height: 260px;
  }

  .public-slider img {
    height: 300px;
  }

  .subscription-card {
    align-items: stretch;
    flex-direction: column;
    margin-bottom: 1.5rem !important;
  }

  .subscription-card .btn {
    width: 100%;
  }

  .about-section {
    padding: 1.35rem;
  }

  .reviews-carousel.is-sliding .review-slide {
    flex-basis: 82vw;
    max-width: 82vw;
  }

  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .search-input {
    max-width: none;
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

  .stats-panel {
    grid-template-columns: 1fr;
  }
}
</style>
