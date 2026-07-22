<template>
<div v-if="visible" class="phrase-overlay">
  <div class="phrase-card shadow-lg">
    <p class="eyebrow mb-2">Frase del día</p>
    <h4 class="fw-bold mb-3">Para ti</h4>
    <p class="phrase-text mb-4">{{ phrase }}</p>

    <div class="d-grid gap-2 d-sm-flex">
      <button class="btn btn-primary flex-fill" :disabled="loading" @click="sendReaction('LOVE')">
        Me encanta
      </button>
      <button class="btn btn-outline-primary flex-fill" :disabled="loading" @click="sendReaction('THANKS')">
        Gracias
      </button>
    </div>

    <p v-if="error" class="text-danger small mt-3 mb-0">{{ error }}</p>
  </div>
</div>
</template>

<script setup>
const { isLoggedIn, user } = useAuth()

const visible = ref(false)
const phrase = ref('')
const interactionId = ref('')
const loading = ref(false)
const error = ref('')

const loadPhrase = async () => {
  if (!isLoggedIn.value || !user.value) {
    visible.value = false
    return
  }

  try {
    const res = await $fetch('/api/daily-phrase/today')
    if (res.show) {
      phrase.value = res.phrase
      interactionId.value = res.interactionId
      visible.value = true
    }
  } catch {
    visible.value = false
  }
}

const sendReaction = async (action) => {
  if (!interactionId.value) return

  loading.value = true
  error.value = ''

  try {
    await $fetch('/api/daily-phrase/reaction', {
      method: 'POST',
      body: {
        interactionId: interactionId.value,
        action
      }
    })
    visible.value = false
  } catch (err) {
    error.value = err?.data?.statusMessage || 'No se pudo guardar tu respuesta'
  } finally {
    loading.value = false
  }
}

watch(
  () => [isLoggedIn.value, user.value?.id],
  () => loadPhrase(),
  { immediate: true }
)
</script>

<style scoped>
.phrase-overlay {
  align-items: center;
  background: radial-gradient(circle at top, rgba(13, 110, 253, 0.28), rgba(8, 15, 31, 0.78));
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  z-index: 2900;
}

.phrase-card {
  background: linear-gradient(145deg, #ffffff, #f8fbff);
  border: 1px solid rgba(13, 110, 253, 0.14);
  border-radius: 1.35rem;
  max-width: 480px;
  padding: 1.6rem;
  width: 100%;
}

.eyebrow {
  color: #0d6efd;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.phrase-text {
  color: #243247;
  font-size: 1.15rem;
  line-height: 1.7;
}

@media (max-width: 576px) {
  .phrase-overlay {
    align-items: flex-end;
    padding: 0.75rem;
  }

  .phrase-card {
    border-radius: 1rem 1rem 0.75rem 0.75rem;
    padding: 1.25rem;
  }
}
</style>
