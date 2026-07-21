<template>
<div class="admin-page">
  <div class="container py-5">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <p class="eyebrow mb-1">Administración</p>
        <h1 class="fw-bold mb-0">Dashboard</h1>
      </div>
      <button class="btn btn-outline-primary rounded-pill" @click="loadAdminData">Actualizar</button>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="text-muted mt-2">Cargando dashboard...</p>
    </div>

    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <template v-else>
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="stat-card shadow-sm">
            <span>{{ users.length }}</span>
            <small>Usuarios</small>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card shadow-sm">
            <span>{{ activeUsers }}</span>
            <small>Activos</small>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card shadow-sm">
            <span>{{ pendingReviews }}</span>
            <small>Reseñas pendientes</small>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card shadow-sm">
            <span>{{ pendingComplaints }}</span>
            <small>Reclamos pendientes</small>
          </div>
        </div>
      </div>

      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
            <div>
              <p class="eyebrow mb-1">Cloudinary</p>
              <h5 class="card-title mb-1">Almacenamiento en tiempo real</h5>
              <p class="text-muted small mb-0">
                Se actualiza automáticamente cada 30 segundos para controlar el uso de recursos.
              </p>
            </div>
            <button class="btn btn-outline-primary btn-sm rounded-pill" :disabled="loadingCloudinary" @click="loadCloudinaryUsage">
              <span v-if="loadingCloudinary">Actualizando...</span>
              <span v-else>Actualizar ahora</span>
            </button>
          </div>

          <div v-if="cloudinaryError" class="alert alert-warning small">
            {{ cloudinaryError }}
          </div>

          <template v-else-if="cloudinaryUsage">
            <div class="d-flex justify-content-between small mb-1">
              <strong>Uso de almacenamiento</strong>
              <span>
                {{ formatBytes(cloudinaryUsage.storage.usage) }} /
                {{ formatBytes(cloudinaryUsage.storage.limit) }}
                <small v-if="cloudinaryUsage.storage.estimatedLimit" class="text-muted">estimado</small>
              </span>
            </div>
            <div class="progress cloudinary-progress mb-2">
              <div
                class="progress-bar"
                :class="cloudinaryProgressClass"
                :style="{ width: `${cloudinaryUsage.storage.percent}%` }"
              >
                {{ cloudinaryUsage.storage.percent }}%
              </div>
            </div>

            <div v-if="cloudinaryUsage.storage.percent >= 80" class="alert alert-danger small mb-3">
              El almacenamiento de Cloudinary está alto. Revisa el plan o reemplaza/amplía la capacidad en Cloudinary antes de que se llene.
            </div>
            <div v-else-if="cloudinaryUsage.storage.percent >= 60" class="alert alert-warning small mb-3">
              El almacenamiento de Cloudinary va en aumento. Conviene revisar limpieza o ampliación del plan.
            </div>

            <div class="cloudinary-metrics">
              <div>
                <span>{{ cloudinaryUsage.bandwidth.percent }}%</span>
                <small>Ancho de banda</small>
              </div>
              <div>
                <span>{{ cloudinaryUsage.transformations.percent }}%</span>
                <small>Transformaciones</small>
              </div>
              <div>
                <span>{{ cloudinaryUsage.resources.percent }}%</span>
                <small>Recursos</small>
              </div>
              <div>
                <span>{{ cloudinaryUsage.requests.percent }}%</span>
                <small>Solicitudes</small>
              </div>
            </div>

            <p class="text-muted small mt-3 mb-0">
              Última actualización: {{ formatDate(cloudinaryUsage.updatedAt) }}
            </p>
          </template>

          <div v-else class="text-muted small">
            Cargando uso de Cloudinary...
          </div>
        </div>
      </div>

      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <h5 class="card-title mb-3">Usuarios</h5>
          <div class="table-responsive">
            <table class="table align-middle">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Suscripción</th>
                  <th>Pago</th>
                  <th>Fotos</th>
                  <th>Reseña pendiente</th>
                  <th class="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in users" :key="item.id">
                  <td>
                    <strong>{{ item.nombre }} {{ item.apellido }}</strong>
                    <br>
                    <small class="text-muted">{{ item.email }}</small>
                  </td>
                  <td>{{ item.role }}</td>
                  <td>
                    <span class="badge" :class="item.estado === 'ACTIVO' ? 'text-bg-success' : 'text-bg-secondary'">
                      {{ item.estado }}
                    </span>
                  </td>
                  <td>{{ item.subscriptionStatus || 'PENDING' }}</td>
                  <td>
                    <button v-if="item.paymentProofUrl" class="btn btn-sm btn-outline-primary" @click="openPaymentProof(item)">
                      Ver captura
                    </button>
                    <span v-else class="text-muted small">Sin captura</span>
                  </td>
                  <td>{{ item._count?.posts || 0 }}</td>
                  <td>{{ item.reviewRequired ? 'Sí' : 'No' }}</td>
                  <td class="text-end">
                    <div class="btn-group btn-group-sm flex-wrap">
                      <button class="btn btn-outline-secondary" @click="toggleStatus(item)">
                        {{ item.estado === 'ACTIVO' ? 'Desactivar' : 'Activar' }}
                      </button>
                      <button class="btn btn-outline-primary" @click="openNotification(item)">
                        Notificar
                      </button>
                      <button class="btn btn-outline-warning" @click="requireReview(item)">
                        Exigir reseña
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <h5 class="card-title mb-3">Panel de notificaciones</h5>
          <div v-if="!notifications.length" class="text-muted">No hay notificaciones para el administrador.</div>
          <div v-for="notification in notifications" :key="notification.id" class="notification-row">
            <div class="d-flex justify-content-between gap-3">
              <div>
                <strong>{{ notification.title }}</strong>
                <p class="mb-1 text-muted">{{ notification.message }}</p>
                <small class="text-muted">{{ formatDate(notification.createdAt) }}</small>
              </div>
              <span class="badge" :class="notification.read ? 'text-bg-light' : 'text-bg-warning'">
                {{ notification.read ? 'Leída' : 'Nueva' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <h5 class="card-title mb-3">Quejas y reclamos</h5>
          <div v-if="!complaints.length" class="text-muted">No hay quejas o reclamos.</div>
          <div v-for="complaint in complaints" :key="complaint.id" class="complaint-row">
            <div class="d-flex justify-content-between gap-3 flex-wrap">
              <div>
                <strong>{{ complaint.subject }}</strong>
                <p class="mb-1 text-muted">{{ complaint.message }}</p>
                <small class="text-muted">
                  {{ complaint.user?.nombre }} {{ complaint.user?.apellido }} - {{ complaint.user?.email }} - {{ formatDate(complaint.createdAt) }}
                </small>
                <div v-if="complaint.response" class="admin-response mt-2">
                  <strong>Respuesta:</strong> {{ complaint.response }}
                </div>
              </div>
              <div class="d-flex align-items-start gap-2">
                <span class="badge" :class="complaintStatusClass(complaint.status)">
                  {{ complaintStatusLabel(complaint.status) }}
                </span>
                <button class="btn btn-sm btn-outline-primary" @click="openComplaint(complaint)">
                  Responder
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card shadow-sm">
        <div class="card-body">
          <h5 class="card-title mb-3">Reseñas</h5>
          <div v-if="!reviews.length" class="text-muted">Aún no hay reseñas.</div>
          <div v-for="review in reviews" :key="review.id" class="review-row">
            <div class="d-flex justify-content-between gap-3">
              <div>
                <strong>{{ review.user?.nombre }} {{ review.user?.apellido }}</strong>
                <p class="mb-1">{{ review.text }}</p>
                <small class="text-muted">{{ formatDate(review.createdAt) }}</small>
              </div>
              <span class="rating">★ {{ review.rating }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>

  <div v-if="notificationUser" class="modal-backdrop-custom" @click.self="notificationUser = null">
    <div class="notification-modal shadow-lg">
      <h5>Enviar notificación</h5>
      <p class="text-muted small">Para {{ notificationUser.nombre }} {{ notificationUser.apellido }}</p>
      <input v-model="notificationTitle" class="form-control mb-2" placeholder="Título">
      <textarea v-model="notificationMessage" class="form-control mb-3" rows="4" placeholder="Mensaje"></textarea>
      <div class="d-flex gap-2 justify-content-end">
        <button class="btn btn-light" @click="notificationUser = null">Cancelar</button>
        <button class="btn btn-primary" :disabled="sendingNotification" @click="sendNotification">Enviar</button>
      </div>
    </div>
  </div>

  <div v-if="paymentProofUser" class="modal-backdrop-custom" @click.self="paymentProofUser = null">
    <div class="proof-modal shadow-lg">
      <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h5 class="mb-1">Comprobante de pago</h5>
          <p class="text-muted small mb-0">
            {{ paymentProofUser.nombre }} {{ paymentProofUser.apellido }} - {{ paymentProofUser.email }}
          </p>
        </div>
        <button class="btn btn-light btn-sm" @click="paymentProofUser = null">Cerrar</button>
      </div>

      <div class="proof-frame">
        <img :src="paymentProofUser.paymentProofUrl" alt="Comprobante de pago">
      </div>

      <div class="d-flex justify-content-end gap-2 mt-3">
        <button
          v-if="paymentProofUser.estado !== 'ACTIVO'"
          class="btn btn-success"
          @click="approveFromProof"
        >
          Activar usuario
        </button>
        <button class="btn btn-outline-secondary" @click="paymentProofUser = null">Cerrar</button>
      </div>
    </div>
  </div>

  <div v-if="selectedComplaint" class="modal-backdrop-custom" @click.self="selectedComplaint = null">
    <div class="notification-modal shadow-lg">
      <h5>Responder reclamo</h5>
      <p class="text-muted small mb-2">
        {{ selectedComplaint.user?.nombre }} {{ selectedComplaint.user?.apellido }} - {{ selectedComplaint.subject }}
      </p>

      <select v-model="complaintStatus" class="form-select mb-2">
        <option value="PENDING">Pendiente</option>
        <option value="REVIEWED">En revisión</option>
        <option value="ANSWERED">Respondido</option>
      </select>

      <textarea v-model="complaintResponse" class="form-control mb-3" rows="5" placeholder="Respuesta para el usuario"></textarea>

      <div class="d-flex gap-2 justify-content-end">
        <button class="btn btn-light" @click="selectedComplaint = null">Cancelar</button>
        <button class="btn btn-primary" :disabled="respondingComplaint" @click="respondComplaint">Guardar respuesta</button>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
const { user, checkAuth } = useAuth()

const loading = ref(true)
const error = ref('')
const users = ref([])
const reviews = ref([])
const notifications = ref([])
const complaints = ref([])
const notificationUser = ref(null)
const paymentProofUser = ref(null)
const selectedComplaint = ref(null)
const notificationTitle = ref('')
const notificationMessage = ref('')
const complaintResponse = ref('')
const complaintStatus = ref('ANSWERED')
const sendingNotification = ref(false)
const respondingComplaint = ref(false)
const cloudinaryUsage = ref(null)
const cloudinaryError = ref('')
const loadingCloudinary = ref(false)
let cloudinaryInterval = null

const activeUsers = computed(() => users.value.filter(item => item.estado === 'ACTIVO').length)
const pendingReviews = computed(() => users.value.filter(item => item.reviewRequired).length)
const pendingComplaints = computed(() => complaints.value.filter(item => item.status !== 'ANSWERED').length)
const cloudinaryProgressClass = computed(() => {
  const percent = cloudinaryUsage.value?.storage?.percent || 0
  if (percent >= 80) return 'bg-danger'
  if (percent >= 60) return 'bg-warning text-dark'
  return 'bg-success'
})

const loadCloudinaryUsage = async () => {
  loadingCloudinary.value = true
  cloudinaryError.value = ''

  try {
    const res = await $fetch('/api/admin/cloudinary/usage')
    cloudinaryUsage.value = res
  } catch (err) {
    cloudinaryError.value = err?.data?.statusMessage || 'No se pudo consultar Cloudinary'
  } finally {
    loadingCloudinary.value = false
  }
}

const loadAdminData = async () => {
  loading.value = true
  error.value = ''

  try {
    await checkAuth()
    if (user.value?.role !== 'ADMIN') {
      error.value = 'No tienes permisos de administrador.'
      return
    }

    const [usersRes, reviewsRes, notificationsRes, complaintsRes] = await Promise.all([
      $fetch('/api/admin/users'),
      $fetch('/api/admin/reviews'),
      $fetch('/api/notifications/get'),
      $fetch('/api/admin/complaints')
    ])

    users.value = usersRes.users || []
    reviews.value = reviewsRes.reviews || []
    notifications.value = notificationsRes.notifications || []
    complaints.value = complaintsRes.complaints || []
  } catch (err) {
    error.value = err?.data?.statusMessage || 'No se pudo cargar el dashboard'
  } finally {
    loading.value = false
  }
}

const toggleStatus = async (item, forcedStatus = null) => {
  const estado = forcedStatus || (item.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO')

  try {
    await $fetch('/api/admin/users/status', {
      method: 'POST',
      body: { userId: item.id, estado }
    })
    item.estado = estado
    item.subscriptionStatus = estado === 'ACTIVO' ? 'APPROVED' : 'PENDING'
  } catch (err) {
    alert(err?.data?.statusMessage || 'No se pudo actualizar el usuario')
  }
}

const openNotification = (item) => {
  notificationUser.value = item
  notificationTitle.value = ''
  notificationMessage.value = ''
}

const openPaymentProof = (item) => {
  paymentProofUser.value = item
}

const approveFromProof = async () => {
  if (!paymentProofUser.value) return

  await toggleStatus(paymentProofUser.value, 'ACTIVO')
  paymentProofUser.value = null
}

const sendNotification = async () => {
  if (!notificationUser.value) return

  sendingNotification.value = true

  try {
    await $fetch('/api/admin/notifications', {
      method: 'POST',
      body: {
        userId: notificationUser.value.id,
        title: notificationTitle.value,
        message: notificationMessage.value
      }
    })
    notificationUser.value = null
  } catch (err) {
    alert(err?.data?.statusMessage || 'No se pudo enviar la notificación')
  } finally {
    sendingNotification.value = false
  }
}

const requireReview = async (item) => {
  try {
    await $fetch('/api/admin/reviews/require', {
      method: 'POST',
      body: { userId: item.id }
    })
    item.reviewRequired = true
  } catch (err) {
    alert(err?.data?.statusMessage || 'No se pudo solicitar la reseña')
  }
}

const openComplaint = (complaint) => {
  selectedComplaint.value = complaint
  complaintResponse.value = complaint.response || ''
  complaintStatus.value = complaint.status === 'ANSWERED' ? 'ANSWERED' : 'REVIEWED'
}

const respondComplaint = async () => {
  if (!selectedComplaint.value) return

  respondingComplaint.value = true

  try {
    const res = await $fetch('/api/admin/complaints/respond', {
      method: 'POST',
      body: {
        complaintId: selectedComplaint.value.id,
        response: complaintResponse.value,
        status: complaintStatus.value
      }
    })

    const idx = complaints.value.findIndex(item => item.id === selectedComplaint.value.id)
    if (idx !== -1) complaints.value[idx] = res.complaint
    selectedComplaint.value = null
  } catch (err) {
    alert(err?.data?.statusMessage || 'No se pudo responder el reclamo')
  } finally {
    respondingComplaint.value = false
  }
}

const complaintStatusLabel = (status) => {
  return {
    PENDING: 'Pendiente',
    REVIEWED: 'En revisión',
    ANSWERED: 'Respondido'
  }[status] || status
}

const complaintStatusClass = (status) => {
  return {
    PENDING: 'text-bg-warning',
    REVIEWED: 'text-bg-info',
    ANSWERED: 'text-bg-success'
  }[status] || 'text-bg-secondary'
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('es-ES')
}

const formatBytes = (bytes) => {
  const value = Number(bytes) || 0
  if (value < 1024) return `${value} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let size = value / 1024
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size = size / 1024
    unitIndex++
  }

  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[unitIndex]}`
}

onMounted(async () => {
  await loadAdminData()
  if (user.value?.role === 'ADMIN') {
    await loadCloudinaryUsage()
    cloudinaryInterval = setInterval(loadCloudinaryUsage, 30000)
  }
})

onUnmounted(() => {
  if (cloudinaryInterval) clearInterval(cloudinaryInterval)
})
</script>

<style scoped>
.admin-page {
  background: #f6f8fb;
  min-height: 100vh;
}

.eyebrow {
  color: #0d6efd;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.stat-card {
  background: #fff;
  border-radius: 1rem;
  padding: 1.25rem;
}

.stat-card span {
  color: #0d6efd;
  display: block;
  font-size: 2rem;
  font-weight: 800;
}

.stat-card small {
  color: #6c757d;
  text-transform: uppercase;
}

.cloudinary-progress {
  border-radius: 999px;
  height: 1.4rem;
  overflow: hidden;
}

.cloudinary-metrics {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
}

.cloudinary-metrics div {
  background: #f8f9fa;
  border: 1px solid #edf0f3;
  border-radius: 0.85rem;
  padding: 0.85rem;
}

.cloudinary-metrics span,
.cloudinary-metrics small {
  display: block;
}

.cloudinary-metrics span {
  color: #0d6efd;
  font-size: 1.25rem;
  font-weight: 800;
}

.cloudinary-metrics small {
  color: #6c757d;
}

.review-row {
  border-top: 1px solid #edf0f3;
  padding: 1rem 0;
}

.notification-row {
  border-top: 1px solid #edf0f3;
  padding: 1rem 0;
}

.complaint-row {
  border-top: 1px solid #edf0f3;
  padding: 1rem 0;
}

.admin-response {
  background: #f8fbff;
  border: 1px solid #e5efff;
  border-radius: 0.75rem;
  padding: 0.75rem;
}

.rating {
  color: #b58100;
  font-weight: 800;
  white-space: nowrap;
}

.modal-backdrop-custom {
  align-items: center;
  background: rgba(8, 15, 31, 0.74);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  z-index: 2500;
}

.notification-modal {
  background: #fff;
  border-radius: 1rem;
  max-width: 520px;
  padding: 1.5rem;
  width: 100%;
}

.proof-modal {
  background: #fff;
  border-radius: 1rem;
  max-width: 820px;
  padding: 1.5rem;
  width: 100%;
}

.proof-frame {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 1rem;
  max-height: 70vh;
  overflow: auto;
  padding: 1rem;
  text-align: center;
}

.proof-frame img {
  border-radius: 0.75rem;
  max-width: 100%;
}

@media (max-width: 768px) {
  .admin-page .container {
    padding-top: 1.5rem !important;
  }

  .stat-card {
    padding: 1rem;
  }

  .cloudinary-metrics {
    grid-template-columns: repeat(2, 1fr);
  }

  .table-responsive {
    border: 1px solid #edf0f3;
    border-radius: 1rem;
  }

  .table {
    min-width: 860px;
  }

  .btn-group.flex-wrap {
    display: grid;
    gap: 0.35rem;
  }

  .notification-modal,
  .proof-modal {
    border-radius: 1rem;
    max-height: 88vh;
    overflow-y: auto;
    padding: 1rem;
  }

  .proof-frame {
    max-height: 58vh;
    padding: 0.65rem;
  }
}

@media (max-width: 420px) {
  .cloudinary-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
