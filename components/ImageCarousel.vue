<template>
  <div
    class="carousel-container"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <!-- Contador arriba derecha -->
    <div v-if="images.length > 1" class="image-counter">
      {{ currentIndex + 1 }}/{{ images.length }}
    </div>

    <!-- Track de imágenes -->
    <div
      class="carousel-track"
      :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
    >
      <div
        v-for="(img, idx) in optimizedImages"
        :key="idx"
        class="carousel-slide"
      >
        <img
          :src="img"
          :alt="`Imagen ${idx + 1}`"
          class="carousel-image"
          loading="lazy"
          draggable="false"
        />
      </div>
    </div>

    <!-- Flecha izquierda -->
    <button
      v-if="images.length > 1"
      class="carousel-arrow carousel-arrow-left"
      @click="prev"
      aria-label="Anterior"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>

    <!-- Flecha derecha -->
    <button
      v-if="images.length > 1"
      class="carousel-arrow carousel-arrow-right"
      @click="next"
      aria-label="Siguiente"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>

    <!-- Dots indicadores -->
    <div v-if="images.length > 1" class="carousel-dots">
      <button
        v-for="(_, idx) in images"
        :key="idx"
        class="carousel-dot"
        :class="{ active: idx === currentIndex }"
        @click="goTo(idx)"
        :aria-label="`Ir a imagen ${idx + 1}`"
      />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  images: {
    type: Array,
    required: true,
    default: () => []
  }
})

const currentIndex = ref(0)

// Optimizar URLs de Cloudinary para compresión automática
const optimizedImages = computed(() => {
  return props.images.map((url) => {
    if (typeof url !== 'string') return url
    // Si es URL de Cloudinary, insertar transformaciones antes de /upload/
    if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
      return url.replace('/upload/', '/upload/w_1200,q_auto,f_auto/')
    }
    return url
  })
})

const next = () => {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++
  } else {
    currentIndex.value = 0 // loop infinito opcional
  }
}

const prev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  } else {
    currentIndex.value = props.images.length - 1 // loop infinito opcional
  }
}

const goTo = (index) => {
  currentIndex.value = index
}

// Swipe táctil
let touchStartX = 0
let touchEndX = 0
const SWIPE_THRESHOLD = 50

const onTouchStart = (e) => {
  touchStartX = e.changedTouches[0].screenX
}

const onTouchMove = (e) => {
  touchEndX = e.changedTouches[0].screenX
}

const onTouchEnd = () => {
  const diff = touchStartX - touchEndX
  if (Math.abs(diff) > SWIPE_THRESHOLD) {
    if (diff > 0) {
      next()
    } else {
      prev()
    }
  }
  touchStartX = 0
  touchEndX = 0
}

// Navegación con teclado
onMounted(() => {
  const handleKeydown = (e) => {
    if (e.key === 'ArrowRight') next()
    if (e.key === 'ArrowLeft') prev()
  }
  window.addEventListener('keydown', handleKeydown)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
})
</script>

<style scoped>
.carousel-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  background-color: #000;
  border-radius: 0;
  user-select: none;
  touch-action: pan-y;
}

.carousel-track {
  display: flex;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.carousel-slide {
  min-width: 100%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 4 / 3;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

/* Contador */
.image-counter {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  z-index: 10;
  backdrop-filter: blur(4px);
  letter-spacing: 0.5px;
}

/* Flechas */
.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease, background 0.2s ease;
  z-index: 10;
  backdrop-filter: blur(4px);
}

.carousel-container:hover .carousel-arrow {
  opacity: 1;
}

.carousel-arrow:hover {
  background: rgba(255, 255, 255, 0.35);
}

.carousel-arrow-left {
  left: 10px;
}

.carousel-arrow-right {
  right: 10px;
}

.carousel-arrow svg {
  width: 18px;
  height: 18px;
}

/* Dots */
.carousel-dots {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 10;
}

.carousel-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
  padding: 0;
}

.carousel-dot.active {
  background: #fff;
  transform: scale(1.2);
}

/* Responsive: siempre mostrar flechas en móvil para mejor UX */
@media (max-width: 768px) {
  .carousel-arrow {
    opacity: 0.7;
    width: 32px;
    height: 32px;
  }

  .carousel-slide {
    aspect-ratio: 1 / 1;
  }
}
</style>
