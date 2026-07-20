<template>
<div class="container py-5">

<div class="col-md-5 mx-auto">

<div class="card p-4 shadow">

<h3 class="text-center text-primary mb-4">
Login Remind
</h3>

<input v-model="email" class="form-control mb-3" placeholder="Correo">

<input v-model="password" type="password" class="form-control mb-3" placeholder="Contraseña">

<button @click="login" class="btn btn-primary w-100">
Entrar
</button>

<div class="text-center mt-3">
  <NuxtLink to="/recuperar" class="small">¿Olvidaste tu contraseña?</NuxtLink>
</div>

<p class="text-danger mt-3">{{ error }}</p>

</div>

</div>

</div>
</template>

<script setup>
const email = ref('')
const password = ref('')
const error = ref('')
const { checkAuth } = useAuth()

const login = async () => {
  try {

    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    })

    if (res.success) {
      // Actualizar estado de autenticación antes de navegar
      await checkAuth()
      if (res.mustChangePassword) {
        alert('Ingresaste con una contraseña temporal. Tienes 10 minutos para cambiarla desde tu perfil.')
        navigateTo(`/biografia?id=${res.user.id}`)
      } else {
        navigateTo('/')
      }
    }

  } catch (err) {
    error.value = err?.data?.statusMessage || 'Error login'
  }
}
</script>
