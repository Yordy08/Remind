<template>
  <div class="error-page">
    <main class="error-card shadow-sm">
      <div class="brand-mark">R</div>
      <p class="eyebrow mb-2">Remind</p>
      <h1 class="fw-bold mb-3">Algo no salió bien</h1>
      <p class="text-muted mb-4">
        {{ error?.statusMessage || 'No pudimos cargar esta vista. Intenta volver al inicio.' }}
      </p>
      <button class="btn btn-primary rounded-pill px-4" @click="handleError">
        Volver al inicio
      </button>
    </main>
  </div>
</template>

<script setup>
defineProps({
  error: {
    type: Object,
    default: () => ({})
  }
})

const handleError = () => clearError({ redirect: '/' })
</script>

<style scoped>
.error-page {
  align-items: center;
  background:
    radial-gradient(circle at 15% 15%, rgba(13, 110, 253, 0.16), transparent 30%),
    linear-gradient(135deg, #f8fbff, #eef4ff);
  display: flex;
  min-height: 100vh;
  padding: 1rem;
}

.error-card {
  background: #fff;
  border: 1px solid rgba(13, 110, 253, 0.1);
  border-radius: 1.5rem;
  margin: 0 auto;
  max-width: 520px;
  padding: 2rem;
  text-align: center;
  width: 100%;
}

.brand-mark {
  align-items: center;
  background: #0d6efd;
  border-radius: 1.2rem;
  color: #fff;
  display: inline-flex;
  font-size: 1.5rem;
  font-weight: 900;
  height: 4rem;
  justify-content: center;
  margin-bottom: 1rem;
  width: 4rem;
}

.eyebrow {
  color: #0d6efd;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
</style>
