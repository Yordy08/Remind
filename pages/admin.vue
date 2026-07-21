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
            <table class="table admin-users-table align-middle">
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
              <img v-if="notification.imageUrl" :src="notification.imageUrl" alt="Imagen de notificación" class="admin-notification-thumb">
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
      <label class="form-label fw-bold">Imagen opcional</label>
      <input class="form-control mb-2" type="file" accept="image/*" @change="onNotificationImageChange">
      <div v-if="notificationImagePreview" class="notification-image-preview mb-3">
        <img :src="notificationImagePreview" alt="Vista previa">
        <button class="btn btn-sm btn-light" type="button" @click="clearNotificationImage">Quitar imagen</button>
      </div>
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
const notificationImage = ref(null)
const notificationImagePreview = ref('')
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
  clearNotificationImage()
}

const onNotificationImageChange = (event) => {
  const file = event.target.files?.[0]
  clearNotificationImage()

  if (!file) return
  notificationImage.value = file
  notificationImagePreview.value = URL.createObjectURL(file)
}

const clearNotificationImage = () => {
  if (notificationImagePreview.value) URL.revokeObjectURL(notificationImagePreview.value)
  notificationImage.value = null
  notificationImagePreview.value = ''
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
    const formData = new FormData()
    formData.append('userId', notificationUser.value.id)
    formData.append('title', notificationTitle.value)
    formData.append('message', notificationMessage.value)
    if (notificationImage.value) formData.append('image', notificationImage.value)

    await $fetch('/api/admin/notifications', {
      method: 'POST',
      body: formData
    })
    notificationUser.value = null
    clearNotificationImage()
    await loadAdminData()
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
  overflow-x: hidden;
}

.admin-page .container,
.admin-page .card,
.admin-page .card-body {
  max-width: 100%;
  min-width: 0;
}

.admin-page p,
.admin-page small,
.admin-page strong,
.admin-page td,
.admin-page span {
  overflow-wrap: anywhere;
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

.admin-notification-thumb {
  aspect-ratio: 1;
  border-radius: 0.85rem;
  height: 64px;
  object-fit: cover;
  width: 64px;
}

.notification-image-preview {
  background: #f8fbff;
  border: 1px solid #e5efff;
  border-radius: 1rem;
  display: grid;
  gap: 0.75rem;
  padding: 0.75rem;
}

.notification-image-preview img {
  border-radius: 0.85rem;
  max-height: 220px;
  object-fit: cover;
  width: 100%;
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
    max-width: 100%;
    overflow-x: hidden;
    padding-left: 0.85rem;
    padding-right: 0.85rem;
    padding-top: 1.5rem !important;
  }

  .admin-page h1 {
    font-size: 1.8rem;
  }

  .admin-page .card {
    border-radius: 1rem;
    overflow: hidden;
  }

  .admin-page .card-body {
    padding: 1rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-card span {
    font-size: 1.65rem;
  }

  .cloudinary-progress {
    height: 1.15rem;
  }

  .cloudinary-progress .progress-bar {
    font-size: 0.7rem;
  }

  .cloudinary-metrics {
    grid-template-columns: repeat(2, 1fr);
  }

  .table-responsive {
    border: 0;
    overflow: visible;
  }

  .admin-users-table,
  .admin-users-table tbody,
  .admin-users-table tr,
  .admin-users-table td {
    display: block;
    width: 100%;
  }

  .admin-users-table {
    border-collapse: separate;
    border-spacing: 0;
    margin-bottom: 0;
  }

  .admin-users-table thead {
    display: none;
  }

  .admin-users-table tr {
    background: #fff;
    border: 1px solid #edf0f3;
    border-radius: 1rem;
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
    margin-bottom: 0.85rem;
    overflow: hidden;
    padding: 0.45rem 0;
  }

  .admin-users-table td {
    border: 0;
    padding: 0.45rem 0.85rem;
    text-align: left !important;
  }

  .admin-users-table td::before {
    color: #6c757d;
    content: attr(data-label);
    display: block;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    margin-bottom: 0.15rem;
    text-transform: uppercase;
  }

  .admin-users-table td:nth-child(1)::before { content: 'Usuario'; }
  .admin-users-table td:nth-child(2)::before { content: 'Rol'; }
  .admin-users-table td:nth-child(3)::before { content: 'Estado'; }
  .admin-users-table td:nth-child(4)::before { content: 'Suscripción'; }
  .admin-users-table td:nth-child(5)::before { content: 'Pago'; }
  .admin-users-table td:nth-child(6)::before { content: 'Fotos'; }
  .admin-users-table td:nth-child(7)::before { content: 'Reseña pendiente'; }
  .admin-users-table td:nth-child(8)::before { content: 'Acciones'; }

  .admin-users-table .btn-group {
    width: 100%;
  }

  .btn-group.flex-wrap {
    display: grid;
    gap: 0.35rem;
  }

  .btn-group.flex-wrap .btn {
    border-radius: 0.65rem !important;
    width: 100%;
  }

  .notification-row > .d-flex,
  .review-row > .d-flex,
  .complaint-row > div {
    align-items: flex-start !important;
    flex-direction: column;
  }

  .complaint-row .d-flex.align-items-start {
    width: 100%;
  }

  .complaint-row .d-flex.align-items-start .btn {
    width: 100%;
  }

  .notification-modal,
  .proof-modal {
    border-radius: 1rem;
    max-width: calc(100vw - 1.5rem);
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
