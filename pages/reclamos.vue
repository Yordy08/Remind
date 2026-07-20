<template>
<div class="complaints-page">
  <div class="container py-5">
    <div class="row g-4">
      <div class="col-lg-5">
        <div class="card shadow-sm">
          <div class="card-body p-4">
            <p class="eyebrow mb-2">Soporte</p>
            <h3 class="fw-bold mb-3">Quejas y reclamos</h3>
            <p class="text-muted">
              Envía tu solicitud. Solo el administrador podrá verla, verificarla y responderte dentro del aplicativo.
            </p>

            <input v-model="subject" class="form-control mb-3" placeholder="Asunto">
            <textarea v-model="message" class="form-control mb-3" rows="6" placeholder="Describe tu queja o reclamo"></textarea>

            <button class="btn btn-primary w-100" :disabled="loading || !subject.trim() || !message.trim()" @click="submitComplaint">
              <span v-if="loading">Enviando...</span>
              <span v-else>Enviar reclamo</span>
            </button>

            <p v-if="success" class="text-success small mt-3 mb-0">{{ success }}</p>
            <p v-if="error" class="text-danger small mt-3 mb-0">{{ error }}</p>
          </div>
        </div>
      </div>

      <div class="col-lg-7">
        <div class="card shadow-sm">
          <div class="card-body p-4">
            <h4 class="fw-bold mb-3">Mis reclamos</h4>

            <div v-if="loadingList" class="text-muted">Cargando reclamos...</div>
            <div v-else-if="!complaints.length" class="text-muted">Aún no has enviado reclamos.</div>

            <div v-for="complaint in complaints" :key="complaint.id" class="complaint-item">
              <div class="d-flex justify-content-between gap-3">
                <div>
                  <h6 class="fw-bold mb-1">{{ complaint.subject }}</h6>
                  <p class="mb-2">{{ complaint.message }}</p>
                  <small class="text-muted">{{ formatDate(complaint.createdAt) }}</small>
                </div>
                <span class="badge status-badge" :class="statusClass(complaint.status)">
                  {{ statusLabel(complaint.status) }}
                </span>
              </div>

              <div v-if="complaint.response" class="response-box mt-3">
                <strong>Respuesta del administrador</strong>
                <p class="mb-0">{{ complaint.response }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
const { isLoggedIn, checkAuth } = useAuth()

const subject = ref('')
const message = ref('')
const complaints = ref([])
const loading = ref(false)
const loadingList = ref(false)
const success = ref('')
const error = ref('')

const loadComplaints = async () => {
  loadingList.value = true
  try {
    const res = await $fetch('/api/complaints/get')
    complaints.value = res.complaints || []
  } catch (err) {
    if (err?.statusCode === 401) navigateTo('/login')
  } finally {
    loadingList.value = false
  }
}

const submitComplaint = async () => {
  loading.value = true
  success.value = ''
  error.value = ''

  try {
    await $fetch('/api/complaints/create', {
      method: 'POST',
      body: {
        subject: subject.value,
        message: message.value
      }
    })

    subject.value = ''
    message.value = ''
    success.value = 'Tu reclamo fue enviado al administrador.'
    await loadComplaints()
  } catch (err) {
    error.value = err?.data?.statusMessage || 'No se pudo enviar el reclamo'
  } finally {
    loading.value = false
  }
}

const statusLabel = (status) => {
  return {
    PENDING: 'Pendiente',
    REVIEWED: 'En revisión',
    ANSWERED: 'Respondido'
  }[status] || status
}

const statusClass = (status) => {
  return {
    PENDING: 'text-bg-warning',
    REVIEWED: 'text-bg-info',
    ANSWERED: 'text-bg-success'
  }[status] || 'text-bg-secondary'
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('es-ES')
}

onMounted(async () => {
  await checkAuth()
  if (!isLoggedIn.value) {
    navigateTo('/login')
    return
  }
  await loadComplaints()
})
</script>

<style scoped>
.complaints-page {
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

.complaint-item {
  border-top: 1px solid #edf0f3;
  padding: 1rem 0;
}

.status-badge {
  height: fit-content;
  white-space: nowrap;
}

.response-box {
  background: #f8fbff;
  border: 1px solid #e5efff;
  border-radius: 0.85rem;
  padding: 1rem;
}
</style>
