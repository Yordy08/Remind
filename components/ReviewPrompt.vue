<template>
<div v-if="showPrompt" class="review-overlay">
  <div class="review-modal shadow-lg">
    <p class="eyebrow mb-2">Solicitud del administrador</p>
    <h4 class="fw-bold mb-2">Comparte tu reseña</h4>
    <p class="text-muted">
      Para continuar, deja una reseña breve sobre tu experiencia usando Remind.
    </p>

    <label class="form-label fw-semibold">Calificación</label>
    <select v-model="rating" class="form-select mb-3">
      <option :value="5">5 - Excelente</option>
      <option :value="4">4 - Muy buena</option>
      <option :value="3">3 - Buena</option>
      <option :value="2">2 - Regular</option>
      <option :value="1">1 - Mala</option>
    </select>

    <label class="form-label fw-semibold">Reseña</label>
    <textarea
      v-model="text"
      class="form-control mb-3"
      rows="4"
      placeholder="Escribe tu opinión..."
    ></textarea>

    <button class="btn btn-primary w-100" :disabled="loading || !text.trim()" @click="submitReview">
      <span v-if="loading">Enviando...</span>
      <span v-else>Enviar reseña</span>
    </button>

    <p v-if="error" class="text-danger small mt-2 mb-0">{{ error }}</p>
  </div>
</div>
</template>

<script setup>
const { isLoggedIn, user, checkAuth } = useAuth()

const rating = ref(5)
const text = ref('')
const loading = ref(false)
const error = ref('')

const showPrompt = computed(() => Boolean(isLoggedIn.value && user.value?.reviewRequired))

const submitReview = async () => {
  if (!text.value.trim()) return

  loading.value = true
  error.value = ''

  try {
    await $fetch('/api/reviews/submit', {
      method: 'POST',
      body: {
        rating: rating.value,
        text: text.value.trim()
      }
    })

    text.value = ''
    await checkAuth()
  } catch (err) {
    error.value = err?.data?.statusMessage || 'No se pudo enviar la reseña'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.review-overlay {
  align-items: center;
  background: rgba(8, 15, 31, 0.78);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  z-index: 3000;
}

.review-modal {
  background: #fff;
  border-radius: 1.25rem;
  max-width: 460px;
  padding: 1.5rem;
  width: 100%;
}

.eyebrow {
  color: #0d6efd;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

@media (max-width: 576px) {
  .review-overlay {
    align-items: flex-end;
    padding: 0.75rem;
  }

  .review-modal {
    border-radius: 1rem 1rem 0.75rem 0.75rem;
    padding: 1.25rem;
  }

  .form-select,
  .form-control,
  .btn {
    min-height: 2.75rem;
  }
}
</style>
