<template>
  <div class="notification-detail-page">
    <main class="container py-4 py-md-5">
      <NuxtLink to="/" class="back-link mb-4">Volver al inicio</NuxtLink>

      <div v-if="loading" class="detail-card shadow-sm text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="text-muted mt-3 mb-0">Cargando notificación...</p>
      </div>

      <div v-else-if="error" class="detail-card shadow-sm text-center py-5">
        <h1 class="h4 fw-bold">No pudimos abrir esta notificación</h1>
        <p class="text-muted mb-0">{{ error }}</p>
      </div>

      <article v-else class="detail-card shadow-sm">
        <img
          v-if="notification.imageUrl"
          :src="notification.imageUrl"
          :alt="notification.title"
          class="hero-image"
        >

        <div class="detail-body">
          <p class="eyebrow mb-2">Notificación</p>
          <h1 class="display-6 fw-bold mb-3">{{ notification.title }}</h1>
          <p class="message mb-4">{{ notification.message }}</p>

          <section v-if="isSubscriptionApproval" class="approval-panel mb-4">
            <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
              <div>
                <p class="eyebrow mb-2">Suscripción pendiente</p>
                <h2 class="h4 fw-bold mb-1">{{ targetUserName }}</h2>
                <p class="text-muted mb-0">{{ notification.targetUser?.email }}</p>
              </div>
              <span class="status-pill" :class="isApproved ? 'approved' : ''">
                {{ isApproved ? 'Aprobada' : 'Pendiente' }}
              </span>
            </div>

            <div v-if="paymentProofUrl" class="proof-box mb-3">
              <img :src="paymentProofUrl" alt="Comprobante de pago">
            </div>

            <button
              class="btn btn-primary rounded-pill px-4"
              :disabled="approving || isApproved"
              @click="approveSubscription"
            >
              <span v-if="approving">Aprobando...</span>
              <span v-else-if="isApproved">Usuario activo</span>
              <span v-else>Aprobar y activar usuario</span>
            </button>

            <p v-if="approvalMessage" class="small mt-3 mb-0" :class="approvalError ? 'text-danger' : 'text-success'">
              {{ approvalMessage }}
            </p>
          </section>

          <div class="detail-meta">
            <span>{{ formatDate(notification.createdAt) }}</span>
            <span class="read-pill">Leída</span>
          </div>
        </div>
      </article>
    </main>
  </div>
</template>

<script setup>
const route = useRoute()
const loading = ref(true)
const error = ref('')
const notification = ref(null)
const approving = ref(false)
const approvalMessage = ref('')
const approvalError = ref(false)

const isSubscriptionApproval = computed(() => {
  return notification.value?.actionType === 'SUBSCRIPTION_APPROVAL' && notification.value?.targetUser
})

const isApproved = computed(() => {
  return notification.value?.targetUser?.estado === 'ACTIVO' || notification.value?.targetUser?.subscriptionStatus === 'APPROVED'
})

const targetUserName = computed(() => {
  const targetUser = notification.value?.targetUser
  if (!targetUser) return 'Usuario'
  return `${targetUser.nombre || ''} ${targetUser.apellido || ''}`.trim() || 'Usuario'
})

const paymentProofUrl = computed(() => {
  return notification.value?.targetUser?.paymentProofUrl || notification.value?.imageUrl || ''
})

const loadNotification = async () => {
  loading.value = true
  error.value = ''

  try {
    const res = await $fetch(`/api/notifications/${route.params.id}`)
    notification.value = res.notification
  } catch (err) {
    error.value = err?.data?.statusMessage || 'La notificación no existe o no tienes acceso.'
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const approveSubscription = async () => {
  const targetUserId = notification.value?.targetUser?.id
  if (!targetUserId || approving.value || isApproved.value) return

  approving.value = true
  approvalMessage.value = ''
  approvalError.value = false

  try {
    const res = await $fetch('/api/admin/users/status', {
      method: 'POST',
      body: {
        userId: targetUserId,
        estado: 'ACTIVO'
      }
    })

    notification.value = {
      ...notification.value,
      targetUser: {
        ...notification.value.targetUser,
        ...res.user
      }
    }
    approvalMessage.value = 'Suscripción aprobada y usuario activado correctamente.'
  } catch (err) {
    approvalError.value = true
    approvalMessage.value = err?.data?.statusMessage || 'No se pudo aprobar la suscripción.'
  } finally {
    approving.value = false
  }
}

onMounted(loadNotification)
</script>

<style scoped>
.notification-detail-page {
  background:
    radial-gradient(circle at top left, rgba(13, 110, 253, 0.14), transparent 32%),
    #f5f7fb;
  min-height: 100vh;
}

.back-link {
  background: #fff;
  border: 1px solid #e5efff;
  border-radius: 999px;
  color: #0d6efd;
  display: inline-flex;
  font-weight: 800;
  padding: 0.65rem 1rem;
  text-decoration: none;
}

.detail-card {
  background: #fff;
  border: 1px solid rgba(13, 110, 253, 0.08);
  border-radius: 1.5rem;
  margin: 0 auto;
  max-width: 860px;
  overflow: hidden;
}

.hero-image {
  aspect-ratio: 16 / 8;
  display: block;
  object-fit: cover;
  width: 100%;
}

.detail-body {
  padding: clamp(1.25rem, 4vw, 2.5rem);
}

.eyebrow {
  color: #0d6efd;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.message {
  color: #334155;
  font-size: 1.1rem;
  line-height: 1.75;
  white-space: pre-wrap;
}

.approval-panel {
  background: linear-gradient(135deg, #f8fbff, #eef6ff);
  border: 1px solid #dceaff;
  border-radius: 1.25rem;
  padding: 1rem;
}

.status-pill {
  background: #fff3cd;
  border-radius: 999px;
  color: #8a6100;
  font-weight: 900;
  padding: 0.45rem 0.85rem;
}

.status-pill.approved {
  background: #e7f7ef;
  color: #137a3a;
}

.proof-box {
  background: #fff;
  border: 1px solid #e5efff;
  border-radius: 1rem;
  padding: 0.75rem;
}

.proof-box img {
  border-radius: 0.85rem;
  display: block;
  max-height: 560px;
  object-fit: contain;
  width: 100%;
}

.detail-meta {
  align-items: center;
  border-top: 1px solid #edf0f3;
  color: #6c757d;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
  padding-top: 1rem;
}

.read-pill {
  background: #e7f7ef;
  border-radius: 999px;
  color: #137a3a;
  font-weight: 800;
  padding: 0.35rem 0.75rem;
}

@media (max-width: 576px) {
  .hero-image {
    aspect-ratio: 4 / 3;
  }

  .detail-meta {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
