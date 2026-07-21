<template>
<nav class="app-navbar sticky-top">
  <div class="container nav-shell">
    <div class="brand-row">
      <NuxtLink to="/" class="brand-link">
        <span class="brand-mark">R</span>
        <span>
          <strong>Remind</strong>
          <small>Recuerdos seguros</small>
        </span>
      </NuxtLink>

      <button class="mobile-menu-btn" type="button" @click="mobileMenuOpen = !mobileMenuOpen">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <div class="desktop-nav">
      <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to" class="nav-pill">
        {{ link.label }}
      </NuxtLink>
    </div>

    <div class="nav-actions">
      <template v-if="!isLoggedIn">
        <NuxtLink to="/login" class="action-link ghost">Login</NuxtLink>
        <NuxtLink to="/register" class="action-link primary">Crear cuenta</NuxtLink>
      </template>

      <template v-else>
        <div class="notification-wrapper">
          <button class="icon-action" type="button" @click="toggleNotifications" title="Notificaciones">
            <span class="bell">●</span>
            <span class="d-none d-xl-inline">Notificaciones</span>
            <span v-if="unread" class="notify-badge">{{ unread }}</span>
          </button>
          <div v-if="showNotifications" class="notifications-menu shadow-lg">
            <div class="notifications-header">
              <div>
                <strong>Notificaciones</strong>
                <small>{{ unread ? `${unread} nuevas` : 'Todo al día' }}</small>
              </div>
              <NuxtLink to="/" class="notification-home" @click="showNotifications = false">Inicio</NuxtLink>
            </div>

            <div v-if="!notifications.length" class="notification-empty">
              <span>R</span>
              <p>Sin notificaciones por ahora.</p>
            </div>

            <NuxtLink
              v-for="notification in notifications"
              :key="notification.id"
              :to="`/notificaciones/${notification.id}`"
              class="notification-card"
              :class="notification.read ? '' : 'unread'"
              @click="closeMenus"
            >
              <img v-if="notification.imageUrl" :src="notification.imageUrl" :alt="notification.title">
              <div v-else class="notification-fallback">R</div>
              <div>
                <strong>{{ notification.title }}</strong>
                <p>{{ truncate(notification.message, 92) }}</p>
                <small>{{ formatNotificationDate(notification.createdAt) }}</small>
              </div>
            </NuxtLink>
          </div>
        </div>

        <NuxtLink v-if="user?.role === 'ADMIN'" to="/admin" class="action-link admin">Admin</NuxtLink>
        <button @click="logout" class="action-link ghost logout-btn" title="Cerrar sesión">
          Salir
        </button>
      </template>
    </div>

    <div v-if="mobileMenuOpen" class="mobile-panel">
      <NuxtLink v-for="link in navLinks" :key="link.to" :to="link.to" class="mobile-link" @click="mobileMenuOpen = false">
        {{ link.label }}
      </NuxtLink>

      <template v-if="!isLoggedIn">
        <NuxtLink to="/login" class="mobile-link" @click="mobileMenuOpen = false">Login</NuxtLink>
        <NuxtLink to="/register" class="mobile-link highlight" @click="mobileMenuOpen = false">Crear cuenta</NuxtLink>
      </template>

      <template v-else>
        <button class="mobile-link text-start" type="button" @click="toggleMobileNotifications">
          Notificaciones <span v-if="unread" class="notify-badge inline">{{ unread }}</span>
        </button>
        <div v-if="showNotifications" class="mobile-notifications">
          <div v-if="!notifications.length" class="notification-empty compact">
            <p>Sin notificaciones por ahora.</p>
          </div>

          <NuxtLink
            v-for="notification in notifications"
            :key="notification.id"
            :to="`/notificaciones/${notification.id}`"
            class="notification-card mobile"
            :class="notification.read ? '' : 'unread'"
            @click="closeMenus"
          >
            <img v-if="notification.imageUrl" :src="notification.imageUrl" :alt="notification.title">
            <div v-else class="notification-fallback">R</div>
            <div>
              <strong>{{ notification.title }}</strong>
              <p>{{ truncate(notification.message, 78) }}</p>
              <small>{{ formatNotificationDate(notification.createdAt) }}</small>
            </div>
          </NuxtLink>
        </div>
        <NuxtLink v-if="user?.role === 'ADMIN'" to="/admin" class="mobile-link highlight" @click="mobileMenuOpen = false">Admin</NuxtLink>
        <button class="mobile-link text-start" type="button" @click="logout">Salir</button>
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
const mobileMenuOpen = ref(false)
const initializedNotifications = ref(false)
let notificationInterval = null

const navLinks = computed(() => {
  const links = [{ to: '/', label: 'Inicio' }]

  if (isLoggedIn.value) {
    links.push(
      { to: '/galeria', label: 'Galería' },
      { to: '/postear', label: 'Subir' },
      { to: user.value ? `/biografia?id=${user.value.id}` : '/', label: 'Perfil' },
      { to: '/reclamos', label: 'Reclamos' }
    )
  }

  return links
})

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
    image: notification.imageUrl,
    url: `/notificaciones/${notification.id}`
  })
  localStorage.setItem(shownKey, '1')
}

const playNotificationSound = async (notification) => {
  if (!process.client) return

  const soundKey = `remind_notification_sound_${notification.id}`
  if (localStorage.getItem(soundKey)) return

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return

    const audioContext = new AudioContext()
    const gain = audioContext.createGain()
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.14, audioContext.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.38)
    gain.connect(audioContext.destination)

    for (const [index, frequency] of [660, 880].entries()) {
      const oscillator = audioContext.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      oscillator.connect(gain)
      oscillator.start(audioContext.currentTime + index * 0.13)
      oscillator.stop(audioContext.currentTime + index * 0.13 + 0.18)
    }

    setTimeout(() => audioContext.close(), 600)
    localStorage.setItem(soundKey, '1')
  } catch {}
}

const loadNotifications = async () => {
  if (!isLoggedIn.value) return

  try {
    const res = await $fetch('/api/notifications/get')
    const previousIds = new Set(notifications.value.map(notification => notification.id))
    notifications.value = res.notifications || []
    unread.value = res.unread || 0
    const unreadNotifications = notifications.value.filter(notification => !notification.read)

    if (initializedNotifications.value) {
      const newUnreadNotifications = unreadNotifications.filter(notification => !previousIds.has(notification.id))
      for (const notification of newUnreadNotifications) {
        await playNotificationSound(notification)
      }
    }

    for (const notification of unreadNotifications) {
      await notifyBrowser(notification)
    }
    initializedNotifications.value = true
  } catch {
    notifications.value = []
    unread.value = 0
  }
}

const toggleNotifications = async () => {
  showNotifications.value = !showNotifications.value
  mobileMenuOpen.value = false
}

const toggleMobileNotifications = async () => {
  showNotifications.value = !showNotifications.value
}

const closeMenus = () => {
  showNotifications.value = false
  mobileMenuOpen.value = false
}

const truncate = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text || ''
  return `${text.slice(0, maxLength).trim()}...`
}

const formatNotificationDate = (date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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
  background: rgba(13, 110, 253, 0.92);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 16px 35px rgba(13, 110, 253, 0.2);
  z-index: 1050;
}

.nav-shell {
  align-items: center;
  display: grid;
  gap: 1rem;
  grid-template-columns: auto 1fr auto;
  min-height: 76px;
  position: relative;
}

.brand-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.brand-link {
  align-items: center;
  color: #fff;
  display: inline-flex;
  gap: 0.7rem;
  text-decoration: none;
}

.brand-mark {
  align-items: center;
  background: #fff;
  border-radius: 1rem;
  color: #0d6efd;
  display: inline-flex;
  font-size: 1.1rem;
  font-weight: 900;
  height: 2.75rem;
  justify-content: center;
  width: 2.75rem;
}

.brand-link strong,
.brand-link small {
  display: block;
  line-height: 1.05;
}

.brand-link strong {
  font-size: 1.2rem;
}

.brand-link small {
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.72rem;
  font-weight: 600;
  margin-top: 0.15rem;
}

.desktop-nav {
  align-items: center;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  display: flex;
  gap: 0.25rem;
  justify-self: center;
  padding: 0.3rem;
}

.nav-pill {
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.86);
  font-size: 0.92rem;
  font-weight: 700;
  padding: 0.55rem 0.9rem;
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
  white-space: nowrap;
}

.nav-pill:hover,
.nav-pill.router-link-active {
  background: #fff;
  color: #0d6efd;
  transform: translateY(-1px);
}

.nav-actions {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.action-link,
.icon-action {
  align-items: center;
  border: 0;
  border-radius: 999px;
  display: inline-flex;
  font-size: 0.9rem;
  font-weight: 800;
  gap: 0.4rem;
  min-height: 2.45rem;
  padding: 0.55rem 0.95rem;
  text-decoration: none;
  white-space: nowrap;
}

.action-link.primary {
  background: #fff;
  color: #0d6efd;
}

.action-link.ghost,
.icon-action {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.action-link.admin {
  background: #ffc107;
  color: #3b2b00;
}

.logout-btn {
  cursor: pointer;
}

.notification-wrapper {
  position: relative;
}

.bell {
  color: #ffc107;
  font-size: 0.75rem;
  line-height: 1;
}

.notify-badge {
  background: #ffc107;
  border-radius: 999px;
  color: #3b2b00;
  font-size: 0.72rem;
  font-weight: 900;
  min-width: 1.25rem;
  padding: 0.15rem 0.4rem;
  text-align: center;
}

.notify-badge.inline {
  margin-left: 0.35rem;
}

.mobile-menu-btn {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 0.9rem;
  display: none;
  padding: 0.65rem;
}

.mobile-menu-btn span {
  background: #fff;
  border-radius: 999px;
  display: block;
  height: 2px;
  margin: 4px 0;
  width: 22px;
}

.notifications-menu {
  background: #fff;
  border: 1px solid rgba(13, 110, 253, 0.08);
  border-radius: 1.25rem;
  color: #212529;
  display: grid;
  gap: 0.4rem;
  padding: 0.7rem;
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  z-index: 1200;
  max-height: 430px;
  min-width: 390px;
  overflow-y: auto;
}

.notifications-header {
  align-items: center;
  border-bottom: 1px solid #edf0f3;
  display: flex;
  justify-content: space-between;
  padding: 0.35rem 0.35rem 0.75rem;
}

.notifications-header strong,
.notifications-header small {
  display: block;
}

.notifications-header small {
  color: #6c757d;
}

.notification-home {
  background: #edf4ff;
  border-radius: 999px;
  color: #0d6efd;
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.35rem 0.7rem;
  text-decoration: none;
}

.mobile-panel {
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(13, 110, 253, 0.1);
  border-radius: 1.25rem;
  box-shadow: 0 22px 45px rgba(15, 23, 42, 0.18);
  display: grid;
  gap: 0.45rem;
  grid-column: 1 / -1;
  padding: 0.75rem;
  width: 100%;
}

.mobile-link {
  background: #f5f7fb;
  border: 0;
  border-radius: 0.95rem;
  color: #1f2937;
  font-weight: 800;
  padding: 0.85rem 1rem;
  text-decoration: none;
}

.mobile-link.highlight {
  background: #0d6efd;
  color: #fff;
}

.mobile-notifications {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 0.95rem;
  display: grid;
  gap: 0.45rem;
  max-height: 260px;
  overflow-y: auto;
  padding: 0.5rem;
}

.notification-card {
  align-items: center;
  border: 1px solid transparent;
  border-radius: 1rem;
  color: #1f2937;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 58px 1fr;
  padding: 0.65rem;
  text-decoration: none;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.notification-card:hover,
.notification-card.unread {
  background: #f5f9ff;
  border-color: #dceaff;
}

.notification-card:hover {
  transform: translateY(-1px);
}

.notification-card img,
.notification-fallback {
  aspect-ratio: 1;
  border-radius: 0.85rem;
  width: 58px;
}

.notification-card img {
  object-fit: cover;
}

.notification-fallback {
  align-items: center;
  background: linear-gradient(135deg, #0d6efd, #6ea8fe);
  color: #fff;
  display: flex;
  font-weight: 900;
  justify-content: center;
}

.notification-card strong,
.notification-card p,
.notification-card small {
  display: block;
}

.notification-card strong {
  font-size: 0.92rem;
  line-height: 1.2;
}

.notification-card p {
  color: #6c757d;
  font-size: 0.82rem;
  line-height: 1.35;
  margin: 0.2rem 0;
}

.notification-card small {
  color: #0d6efd;
  font-size: 0.72rem;
  font-weight: 800;
}

.notification-empty {
  color: #6c757d;
  display: grid;
  justify-items: center;
  padding: 1.5rem 1rem;
  text-align: center;
}

.notification-empty span {
  align-items: center;
  background: #edf4ff;
  border-radius: 1rem;
  color: #0d6efd;
  display: flex;
  font-weight: 900;
  height: 3rem;
  justify-content: center;
  margin-bottom: 0.65rem;
  width: 3rem;
}

.notification-empty p {
  margin: 0;
}

.notification-empty.compact {
  padding: 0.75rem;
}

@media (max-width: 991px) {
  .nav-shell {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-height: auto;
    padding-bottom: 0.75rem;
    padding-top: 0.75rem;
  }

  .brand-row {
    width: 100%;
  }

  .desktop-nav,
  .nav-actions {
    display: none;
  }

  .mobile-menu-btn {
    display: block;
  }

  .notifications-menu {
    left: 0.75rem;
    max-width: calc(100vw - 2rem);
    min-width: min(360px, calc(100vw - 2rem));
    right: auto;
    top: calc(100% + 0.35rem);
  }
}

@media (max-width: 380px) {
  .brand-link small {
    display: none;
  }
}
</style>
