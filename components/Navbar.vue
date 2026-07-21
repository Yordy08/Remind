<template>
<nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top app-navbar">

  <div class="container">

    <NuxtLink to="/" class="navbar-brand fw-bold">
      Remind
    </NuxtLink>

    <div class="d-none d-lg-flex gap-2 ms-4 me-auto">
      <NuxtLink to="/" class="nav-link text-white">
        Inicio
      </NuxtLink>

      <template v-if="isLoggedIn">
        <NuxtLink to="/postear" class="nav-link text-white">
          Publicar
        </NuxtLink>

        <NuxtLink v-if="user" :to="`/biografia?id=${user.id}`" class="nav-link text-white">
          Mi perfil
        </NuxtLink>

        <NuxtLink to="/reclamos" class="nav-link text-white">
          Reclamos
        </NuxtLink>

        <NuxtLink v-if="user?.role === 'ADMIN'" to="/admin" class="nav-link text-white">
          Admin
        </NuxtLink>
      </template>
    </div>

    <input
      class="form-control w-25 d-none d-md-block rounded-pill me-3"
      placeholder="Buscar..."
    />

    <div class="nav-actions d-flex gap-2 align-items-center">

      <!-- Usuario NO autenticado -->
      <template v-if="!isLoggedIn">
        <NuxtLink to="/register" class="btn btn-light btn-sm rounded-pill">
          Registro
        </NuxtLink>

        <NuxtLink to="/login" class="btn btn-outline-light btn-sm rounded-pill">
          Login
        </NuxtLink>
      </template>

      <!-- Usuario autenticado -->
      <template v-else>
        <div class="position-relative">
          <button class="btn btn-outline-light btn-sm rounded-pill" type="button" @click="toggleNotifications">
            Notificaciones
            <span v-if="unread" class="badge text-bg-warning ms-1">{{ unread }}</span>
          </button>
          <div v-if="showNotifications" class="notifications-menu shadow p-0">
            <div v-if="!notifications.length" class="notification-item text-muted small">Sin notificaciones</div>
            <div v-for="notification in notifications" :key="notification.id" class="notification-item">
              <strong class="d-block small">{{ notification.title }}</strong>
              <span class="small text-muted">{{ notification.message }}</span>
            </div>
          </div>
        </div>

        <NuxtLink to="/" class="btn btn-outline-light btn-sm rounded-pill d-lg-none">
          Inicio
        </NuxtLink>

        <NuxtLink to="/postear" class="btn btn-light btn-sm rounded-pill d-lg-none">
          Publicar
        </NuxtLink>

        <NuxtLink v-if="user" :to="`/biografia?id=${user.id}`" class="btn btn-outline-light btn-sm rounded-pill d-lg-none">
          Perfil
        </NuxtLink>

        <NuxtLink to="/reclamos" class="btn btn-outline-light btn-sm rounded-pill d-lg-none">
          Reclamos
        </NuxtLink>

        <NuxtLink v-if="user?.role === 'ADMIN'" to="/admin" class="btn btn-warning btn-sm rounded-pill">
          Admin
        </NuxtLink>

        <button
          @click="logout"
          class="btn btn-outline-light btn-sm rounded-pill d-flex align-items-center gap-2"
          title="Cerrar sesión"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-right" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
            <path fill-rule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
          </svg>
          <span class="d-none d-sm-inline">Salir</span>
        </button>
      </template>

    </div>

  </div>

</nav>
</template>

<script setup>
const { isLoggedIn, user, logout, checkAuth } = useAuth()
const notifications = ref([])
const unread = ref(0)
const showNotifications = ref(false)
let notificationInterval = null

const notifyBrowser = async (notification) => {
  if (!process.client || !('Notification' in window) || Notification.permission !== 'granted') return
  if (!('serviceWorker' in navigator)) return

  const shownKey = `remind_notification_${notification.id}`
  if (localStorage.getItem(shownKey)) return

  const registration = await navigator.serviceWorker.ready
  if (!registration?.active) return

  registration.active.postMessage({
    type: 'SHOW_NOTIFICATION',
    title: notification.title,
    body: notification.message,
    url: '/'
  })
  localStorage.setItem(shownKey, '1')
}

const loadNotifications = async () => {
  if (!isLoggedIn.value) return

  try {
    const res = await $fetch('/api/notifications/get')
    notifications.value = res.notifications || []
    unread.value = res.unread || 0
    const unreadNotifications = notifications.value.filter(notification => !notification.read)
    for (const notification of unreadNotifications) {
      await notifyBrowser(notification)
    }
  } catch {
    notifications.value = []
    unread.value = 0
  }
}

const toggleNotifications = async () => {
  showNotifications.value = !showNotifications.value
  if (!unread.value) return

  try {
    await $fetch('/api/notifications/read', { method: 'POST' })
    unread.value = 0
  } catch {}
}

// Verificar estado de autenticación al montar el componente
onMounted(async () => {
  await checkAuth()
  await loadNotifications()
  notificationInterval = setInterval(loadNotifications, 60000)
})

onUnmounted(() => {
  if (notificationInterval) clearInterval(notificationInterval)
})
</script>

<style scoped>
.app-navbar {
  --nav-blue: #0d6efd;
}

.navbar .container {
  gap: 0.75rem;
}

.navbar-brand {
  letter-spacing: -0.02em;
}

.nav-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.notifications-menu {
  background: #fff;
  border-radius: 0.75rem;
  color: #212529;
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  z-index: 1200;
  max-height: 320px;
  min-width: 280px;
  overflow-y: auto;
}

.notification-item {
  border-bottom: 1px solid #f1f3f5;
  padding: 0.75rem;
  white-space: normal;
}

@media (max-width: 991px) {
  .navbar .container {
    align-items: flex-start;
    flex-direction: column;
  }

  .nav-actions {
    display: grid !important;
    gap: 0.45rem !important;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }

  .nav-actions > * {
    min-width: 0;
  }

  .nav-actions .btn {
    align-items: center;
    display: inline-flex;
    justify-content: center;
    min-height: 2.35rem;
    width: 100%;
  }

  .notifications-menu {
    left: 0;
    max-width: calc(100vw - 2rem);
    min-width: min(360px, calc(100vw - 2rem));
    right: auto;
  }
}

@media (max-width: 380px) {
  .nav-actions {
    grid-template-columns: 1fr;
  }
}
</style>
