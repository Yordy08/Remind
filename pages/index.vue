<template>
<div class="gallery-page">

  <section class="hero-section">
    <div class="container py-5">
      <div class="row align-items-center g-4">
        <div class="col-lg-7">
          <p class="eyebrow mb-2">EntreNos Fotos</p>
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
        <p class="eyebrow mb-2">Confianza</p>
        <h3 class="fw-bold">Reseñas de usuarios</h3>
        <p class="text-muted mb-0">Opiniones que ayudan a nuevos usuarios a decidirse.</p>
      </div>

      <div class="row g-4">
        <div v-for="review in visibleReviews" :key="review.id || review.text" class="col-md-4">
          <div class="review-card shadow-sm h-100">
            <div class="review-stars">{{ '★'.repeat(review.rating) }}</div>
            <p>“{{ review.text }}”</p>
            <strong>{{ review.name }}</strong>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section v-else class="container pb-5">
    <PwaInstall class="mb-4" />

    <div class="toolbar shadow-sm mb-4">
      <div>
        <h5 class="mb-1">Álbumes</h5>
        <p class="text-muted small mb-0">Filtra tu biblioteca por categoría o favoritos.</p>
      </div>
      <input
        v-model="search"
        type="search"
        class="form-control search-input"
        placeholder="Buscar por descripción o categoría"
      >
    </div>

    <div class="album-strip mb-4">
      <button
        class="album-card"
        :class="activeCategory === 'Todos' ? 'active' : ''"
        @click="activeCategory = 'Todos'"
      >
        <span class="album-count">{{ photos.length }}</span>
        <strong>Todos</strong>
      </button>

      <button
        class="album-card favorite-card"
        :class="activeCategory === 'Favoritos' ? 'active' : ''"
        @click="activeCategory = 'Favoritos'"
      >
        <span class="album-count">{{ favoriteCount }}</span>
        <strong>Favoritos</strong>
      </button>

      <button
        v-for="category in categories"
        :key="category"
        class="album-card"
        :class="activeCategory === category ? 'active' : ''"
        @click="activeCategory = category"
      >
        <span class="album-count">{{ countByCategory(category) }}</span>
        <strong>{{ category }}</strong>
      </button>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="text-muted mt-2">Cargando galería...</p>
    </div>

    <div v-else-if="!photos.length" class="empty-state shadow-sm">
      <h4>Aún no tienes fotos guardadas</h4>
      <p class="text-muted">Sube tus primeras imágenes y empieza a construir tus álbumes.</p>
      <NuxtLink to="/postear" class="btn btn-primary rounded-pill px-4">Subir fotos</NuxtLink>
    </div>

    <div v-else-if="!filteredPhotos.length" class="empty-state shadow-sm">
      <h4>No hay resultados</h4>
      <p class="text-muted mb-0">Prueba con otra búsqueda o cambia el álbum seleccionado.</p>
    </div>

    <div v-else class="masonry-gallery">
      <article
        v-for="post in filteredPhotos"
        :key="post.id"
        class="photo-card shadow-sm"
      >
        <button class="photo-open" @click="openPhoto(post)">
          <img :src="optimizeImage(post.imagenes[0])" :alt="post.descripcion || post.categoria" loading="lazy">
          <span v-if="post.imagenes.length > 1" class="photo-badge">{{ post.imagenes.length }} fotos</span>
        </button>

        <div class="photo-body">
          <div class="d-flex justify-content-between gap-2 align-items-start">
            <div>
              <span class="category-pill">{{ post.categoria }}</span>
              <p class="photo-description mb-1">{{ post.descripcion || 'Sin descripción' }}</p>
              <small class="text-muted">{{ formatDate(post.createdAt) }}</small>
            </div>
            <button
              class="favorite-btn"
              :class="post.isFavorite ? 'active' : ''"
              :disabled="favoriteLoading[post.id]"
              @click="toggleFavorite(post)"
              title="Marcar favorito"
            >
              ★
            </button>
          </div>

          <div v-if="post.imagenes.length > 1" class="thumb-row mt-3">
            <img
              v-for="image in post.imagenes.slice(0, 4)"
              :key="image"
              :src="optimizeThumb(image)"
              loading="lazy"
            >
          </div>
        </div>
      </article>
    </div>
  </section>

  <div v-if="selectedPost" class="lightbox" @click.self="selectedPost = null">
    <div class="lightbox-dialog">
      <button class="lightbox-close" @click="selectedPost = null">×</button>
      <ImageCarousel v-if="selectedPost.imagenes.length > 1" :images="selectedPost.imagenes" />
      <img v-else :src="selectedPost.imagenes[0]" class="lightbox-image">
      <div class="lightbox-info">
        <span class="category-pill">{{ selectedPost.categoria }}</span>
        <p class="mb-0 mt-2">{{ selectedPost.descripcion || 'Sin descripción' }}</p>
      </div>
    </div>
  </div>

</div>
</template>

<script setup>
const { isLoggedIn, checkAuth } = useAuth()

const loading = ref(false)
const photos = ref([])
const categories = ref([])
const publicReviews = ref([])
const stats = ref({ albums: 0, posts: 0, images: 0, favorites: 0 })
const activeCategory = ref('Todos')
const activeSlide = ref(0)
const search = ref('')
const selectedPost = ref(null)
const favoriteLoading = ref({})
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

const fallbackReviews = [
  { rating: 5, text: 'Me ayudó a tener mis fotos familiares ordenadas sin mezclar redes sociales.', name: 'Laura M.' },
  { rating: 5, text: 'La galería por categorías hace que encuentre mis recuerdos muy rápido.', name: 'Andrés P.' },
  { rating: 4, text: 'Simple, privado y perfecto para guardar fotos importantes.', name: 'Camila R.' }
]

const favoriteCount = computed(() => photos.value.filter(post => post.isFavorite).length)
const visibleReviews = computed(() => {
  if (!publicReviews.value.length) return fallbackReviews

  return publicReviews.value.map((review) => ({
    id: review.id,
    rating: review.rating,
    text: review.text,
    name: `${review.user?.nombre || 'Usuario'} ${review.user?.apellido || ''}`.trim()
  }))
})

const loadPublicReviews = async () => {
  try {
    const res = await $fetch('/api/reviews/public')
    publicReviews.value = res.reviews || []
  } catch {
    publicReviews.value = []
  }
}

const filteredPhotos = computed(() => {
  const query = search.value.trim().toLowerCase()

  return photos.value.filter((post) => {
    const matchesCategory = activeCategory.value === 'Todos'
      || (activeCategory.value === 'Favoritos' && post.isFavorite)
      || post.categoria === activeCategory.value
    const matchesSearch = !query
      || post.descripcion?.toLowerCase().includes(query)
      || post.categoria?.toLowerCase().includes(query)

    return matchesCategory && matchesSearch
  })
})

const loadGallery = async () => {
  if (!isLoggedIn.value) return

  loading.value = true

  try {
    const res = await $fetch('/api/photos/gallery')
    photos.value = res.photos || []
    categories.value = res.categories || []
    stats.value = res.stats || { albums: 0, posts: 0, images: 0, favorites: 0 }
  } catch (err) {
    if (err?.statusCode === 401) return
    console.error('Error cargando galería:', err)
  } finally {
    loading.value = false
  }
}

const countByCategory = (category) => {
  return photos.value.filter(post => post.categoria === category).length
}

const toggleFavorite = async (post) => {
  favoriteLoading.value[post.id] = true

  try {
    const res = await $fetch('/api/photos/favorite', {
      method: 'POST',
      body: { postId: post.id }
    })

    post.isFavorite = res.favorite
    stats.value.favorites = favoriteCount.value
  } catch (err) {
    alert(err?.data?.statusMessage || 'No se pudo actualizar favorito')
  } finally {
    favoriteLoading.value[post.id] = false
  }
}

const openPhoto = (post) => {
  selectedPost.value = post
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const optimizeImage = (url) => {
  if (typeof url !== 'string') return url
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/w_900,q_auto,f_auto/')
  }
  return url
}

const optimizeThumb = (url) => {
  if (typeof url !== 'string') return url
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/w_160,h_160,c_fill,q_auto,f_auto/')
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

.album-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
  gap: 0.85rem;
}

.album-card {
  background: #fff;
  border: 1px solid rgba(13, 110, 253, 0.1);
  border-radius: 1rem;
  color: #1f2937;
  padding: 1rem;
  text-align: left;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.album-card:hover,
.album-card.active {
  border-color: #0d6efd;
  box-shadow: 0 12px 28px rgba(13, 110, 253, 0.14);
  transform: translateY(-2px);
}

.favorite-card.active,
.favorite-card:hover {
  border-color: #ffc107;
  box-shadow: 0 12px 28px rgba(255, 193, 7, 0.18);
}

.album-count {
  color: #0d6efd;
  display: block;
  font-size: 1.5rem;
  font-weight: 800;
}

.masonry-gallery {
  column-count: 3;
  column-gap: 1.25rem;
}

.photo-card {
  background: #fff;
  border-radius: 1.25rem;
  break-inside: avoid;
  margin: 0 0 1.25rem;
  overflow: hidden;
}

.photo-open {
  background: #e9ecef;
  border: 0;
  cursor: zoom-in;
  display: block;
  padding: 0;
  position: relative;
  width: 100%;
}

.photo-open img {
  display: block;
  min-height: 220px;
  object-fit: cover;
  width: 100%;
}

.photo-badge {
  background: rgba(0, 0, 0, 0.68);
  border-radius: 999px;
  bottom: 0.8rem;
  color: #fff;
  font-size: 0.75rem;
  padding: 0.35rem 0.7rem;
  position: absolute;
  right: 0.8rem;
}

.photo-body {
  padding: 1rem;
}

.category-pill {
  background: #edf4ff;
  border-radius: 999px;
  color: #0d6efd;
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  margin-bottom: 0.55rem;
  padding: 0.25rem 0.65rem;
}

.photo-description {
  color: #212529;
  font-weight: 600;
}

.favorite-btn {
  align-items: center;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 50%;
  color: #adb5bd;
  display: inline-flex;
  flex-shrink: 0;
  font-size: 1.1rem;
  height: 2.25rem;
  justify-content: center;
  width: 2.25rem;
}

.favorite-btn.active {
  background: #fff3cd;
  border-color: #ffc107;
  color: #b58100;
}

.thumb-row {
  display: grid;
  gap: 0.35rem;
  grid-template-columns: repeat(4, 1fr);
}

.thumb-row img {
  aspect-ratio: 1;
  border-radius: 0.45rem;
  object-fit: cover;
  width: 100%;
}

.lightbox {
  align-items: center;
  background: rgba(8, 15, 31, 0.86);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  z-index: 2000;
}

.lightbox-dialog {
  background: #fff;
  border-radius: 1rem;
  max-height: 92vh;
  max-width: 980px;
  overflow: hidden;
  position: relative;
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
  z-index: 3;
}

.lightbox-image {
  display: block;
  max-height: 72vh;
  object-fit: contain;
  width: 100%;
}

.lightbox-info {
  padding: 1rem;
}

@media (max-width: 992px) {
  .masonry-gallery {
    column-count: 2;
  }
}

@media (max-width: 768px) {
  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .search-input {
    max-width: none;
  }

  .masonry-gallery {
    column-count: 1;
  }

  .stats-panel {
    grid-template-columns: 1fr;
  }
}
</style>
