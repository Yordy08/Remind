<template>
<div class="pwa-card shadow-sm">
  <div>
    <p class="eyebrow mb-2">Aplicación móvil</p>
    <h4 class="fw-bold mb-2">Descarga la app en tu celular</h4>
    <p class="text-muted mb-0">
      Instala Remind como PWA para abrirla como app y recibir avisos del administrador cuando tengas notificaciones nuevas.
    </p>
  </div>

  <div class="pwa-actions">
    <button class="btn btn-primary rounded-pill px-4" @click="installApp">
      {{ installButtonText }}
    </button>
    <button class="btn btn-outline-primary rounded-pill px-4" @click="enableNotifications">
      {{ notificationButtonText }}
    </button>
  </div>

  <p v-if="message" class="small mt-3 mb-0" :class="messageError ? 'text-danger' : 'text-success'">
    {{ message }}
  </p>
</div>
</template>

<script setup>
const deferredPrompt = ref(null)
const isInstalled = ref(false)
const notificationPermission = ref('default')
const message = ref('')
const messageError = ref(false)

const installButtonText = computed(() => {
  if (isInstalled.value) return 'App instalada'
  return 'Descargar app'
})

const notificationButtonText = computed(() => {
  if (notificationPermission.value === 'granted') return 'Notificaciones activas'
  if (notificationPermission.value === 'denied') return 'Notificaciones bloqueadas'
  return 'Activar notificaciones'
})

const installApp = async () => {
  message.value = ''
  messageError.value = false

  if (isInstalled.value) {
    message.value = 'La app ya está instalada en este dispositivo.'
    return
  }

  if (!deferredPrompt.value) {
    messageError.value = true
    message.value = 'La descarga directa todavía no está disponible en este navegador.'
    return
  }

  deferredPrompt.value.prompt()
  const choice = await deferredPrompt.value.userChoice
  deferredPrompt.value = null

  if (choice.outcome === 'accepted') {
    message.value = 'Instalación iniciada correctamente.'
  } else {
    messageError.value = true
    message.value = 'Instalación cancelada.'
  }
}

const enableNotifications = async () => {
  message.value = ''
  messageError.value = false

  if (!('Notification' in window)) {
    messageError.value = true
    message.value = 'Este navegador no soporta notificaciones.'
    return
  }

  if (Notification.permission === 'granted') {
    notificationPermission.value = 'granted'
    message.value = 'Las notificaciones ya están activas.'
    return
  }

  const permission = await Notification.requestPermission()
  notificationPermission.value = permission

  if (permission === 'granted') {
    message.value = 'Notificaciones activadas. Recibirás avisos cuando haya mensajes nuevos del administrador.'
  } else {
    messageError.value = true
    message.value = 'No se activaron las notificaciones. Puedes habilitarlas desde los permisos del navegador.'
  }
}

onMounted(() => {
  notificationPermission.value = 'Notification' in window ? Notification.permission : 'denied'
  isInstalled.value = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt.value = event
  })

  window.addEventListener('appinstalled', () => {
    isInstalled.value = true
    deferredPrompt.value = null
    message.value = 'App instalada correctamente.'
  })
})
</script>

<style scoped>
.pwa-card {
  align-items: center;
  background: linear-gradient(135deg, #ffffff 0%, #eef4ff 100%);
  border: 1px solid rgba(13, 110, 253, 0.12);
  border-radius: 1.5rem;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  padding: 1.5rem;
}

.pwa-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
}

.eyebrow {
  color: #0d6efd;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

@media (max-width: 768px) {
  .pwa-card {
    align-items: stretch;
    flex-direction: column;
    border-radius: 1rem;
    padding: 1.25rem;
  }

  .pwa-actions {
    justify-content: stretch;
  }

  .pwa-actions .btn {
    width: 100%;
  }
}
</style>
