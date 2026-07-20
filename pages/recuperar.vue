<template>
<div class="container py-5">

<div class="col-md-5 mx-auto">

<div class="card p-4 shadow">

<h3 class="text-center text-primary mb-3">
Recuperar contraseña
</h3>

<p class="text-muted small text-center">
Ingresa tu correo o nombre de usuario para generar una contraseña temporal.
</p>

<input
  v-model="identifier"
  class="form-control mb-3"
  placeholder="Correo o usuario"
  @keyup.enter="recoverPassword"
>

<button
  class="btn btn-primary w-100"
  :disabled="loading || !identifier.trim()"
  @click="recoverPassword"
>
  <span v-if="loading">Generando...</span>
  <span v-else>Generar contraseña temporal</span>
</button>

<div v-if="temporaryPassword" class="alert alert-warning mt-4">
  <h6 class="fw-bold">Contraseña temporal generada</h6>
  <p class="mb-2">
    Usa esta contraseña para iniciar sesión:
  </p>
  <div class="temporary-password text-center fw-bold mb-2">
    {{ temporaryPassword }}
  </div>
  <p class="mb-3 small">
    Esta contraseña es temporal y vence en 10 minutos. Al entrar, cambia tu contraseña desde tu perfil.
  </p>
  <button class="btn btn-warning w-100" @click="goToLogin">
    Aceptar e ir al login
  </button>
</div>

<p v-if="message && !temporaryPassword" class="text-success mt-3 mb-0">{{ message }}</p>
<p v-if="error" class="text-danger mt-3 mb-0">{{ error }}</p>

<div class="text-center mt-3">
  <NuxtLink to="/login" class="small">Volver al login</NuxtLink>
</div>

</div>

</div>

</div>
</template>

<script setup>
const identifier = ref('')
const temporaryPassword = ref('')
const message = ref('')
const error = ref('')
const loading = ref(false)

const recoverPassword = async () => {
  if (!identifier.value.trim()) return

  loading.value = true
  error.value = ''
  message.value = ''
  temporaryPassword.value = ''

  try {
    const res = await $fetch('/api/auth/recover', {
      method: 'POST',
      body: { identifier: identifier.value.trim() }
    })

    temporaryPassword.value = res.temporaryPassword
    message.value = res.message
  } catch (err) {
    error.value = err?.data?.statusMessage || 'No se pudo generar la contraseña temporal'
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  navigateTo('/login')
}
</script>

<style scoped>
.temporary-password {
  background: #fff3cd;
  border: 1px dashed #b58100;
  border-radius: 0.5rem;
  color: #5c4100;
  font-size: 1.25rem;
  letter-spacing: 0.08em;
  padding: 0.75rem;
}
</style>
