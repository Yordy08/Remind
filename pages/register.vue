<template>
<div class="register-page container py-5">

<div class="col-md-7 mx-auto">

<div class="register-card card p-4 shadow">

<h2 class="text-center mb-2 text-primary">
Suscribirse
</h2>
<p class="text-muted text-center mb-4">
Completa tus datos y luego realiza el pago por Bre-B para enviar tu solicitud.
</p>

<div class="steps mb-4">
  <span :class="step === 'datos' ? 'active' : ''">1. Datos</span>
  <span :class="step === 'pago' ? 'active' : ''">2. Pago</span>
</div>

<template v-if="step === 'datos'">
  <input v-model="nombreCompleto" class="form-control mb-3" placeholder="Nombre completo">

  <input v-model="celular" class="form-control mb-3" placeholder="Celular">

  <input v-model="email" class="form-control mb-3" placeholder="Correo">

  <input v-model="password" type="password" class="form-control mb-3" placeholder="Contraseña">

  <label class="form-label fw-bold">Fecha de Nacimiento</label>
  <input v-model="fechaNacimiento" type="date" class="form-control mb-3">

  <button @click="goToPayment" class="btn btn-primary w-100">
    Siguiente
  </button>
</template>

<template v-else>
  <div class="payment-card mb-4">
    <div class="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-3">
      <div>
        <p class="text-primary fw-bold text-uppercase small mb-1">Método de pago</p>
        <h4 class="mb-1">Pago por Bre-B</h4>
        <p class="text-muted mb-0">Escanea el QR o paga usando la llave.</p>
      </div>
      <span class="badge text-bg-primary rounded-pill">Bre-B</span>
    </div>

    <div class="row g-4 align-items-center">
      <div class="col-md-5 text-center">
        <img :src="qrUrl" alt="QR Bre-B" class="qr-image shadow-sm">
      </div>
      <div class="col-md-7">
        <label class="form-label fw-bold">Llave de pago</label>
        <div class="input-group mb-3">
          <input :value="paymentKey" class="form-control" readonly>
          <button class="btn btn-outline-primary" type="button" @click="copyPaymentKey">
            Copiar
          </button>
        </div>

        <div class="payment-instructions">
          <strong>Instrucciones</strong>
          <p class="mb-1">1. Abre la app de tu banco.</p>
          <p class="mb-1">2. Elige Bre-B y paga por llave.</p>
          <p class="mb-1">3. Usa la llave: <strong>{{ paymentKey }}</strong>.</p>
          <p class="mb-0">4. Sube la captura del comprobante abajo.</p>
        </div>

        <p v-if="copyMessage" class="text-success small mt-2 mb-0">{{ copyMessage }}</p>
      </div>
    </div>
  </div>

  <label class="form-label fw-bold">Captura del pago</label>
  <input @change="seleccionarComprobante" type="file" class="form-control mb-3" accept="image/*">

  <div v-if="paymentPreview" class="payment-preview mb-3">
    <img :src="paymentPreview" alt="Captura del pago">
  </div>

  <div class="alert alert-info">
    Al registrarte, tu cuenta quedará en verificación. Durante los próximos 30 minutos tu suscripción será revisada y aprobada. Si no sucede en ese tiempo, comunícate por llamada a la línea <strong>3143509438</strong>.
  </div>

  <div class="d-flex gap-2">
    <button class="btn btn-light w-50" @click="step = 'datos'" :disabled="loading">
      Atrás
    </button>
    <button @click="registrar" class="btn btn-primary w-50" :disabled="loading || !paymentProof">
      <span v-if="loading">Enviando...</span>
      <span v-else>Registrarme</span>
    </button>
  </div>
</template>

<p class="mt-3" :class="mensajeError ? 'text-danger' : 'text-success'">{{ mensaje }}</p>

</div>

</div>

</div>
</template>

<script setup>
const step = ref('datos')
const nombreCompleto = ref('')
const celular = ref('')
const email = ref('')
const password = ref('')
const fechaNacimiento = ref('')
const paymentProof = ref(null)
const paymentPreview = ref('')
const mensaje = ref('')
const mensajeError = ref(false)
const loading = ref(false)
const paymentKey = 'yordisdurango@gmail.com'
const copyMessage = ref('')

const qrUrl = computed(() => {
  const payload = `Bre-B pago por llave: ${paymentKey}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(payload)}`
})

const copyPaymentKey = async () => {
  try {
    await navigator.clipboard.writeText(paymentKey)
    copyMessage.value = 'Llave copiada correctamente'
  } catch {
    copyMessage.value = 'No se pudo copiar automáticamente. Copia la llave manualmente.'
  }
}

const seleccionarComprobante = (e) => {
  const file = e.target.files[0]
  paymentProof.value = file
  if (paymentPreview.value) URL.revokeObjectURL(paymentPreview.value)
  paymentPreview.value = ''

  if (file) {
    paymentPreview.value = URL.createObjectURL(file)
  }
}

const validateData = () => {
  if (!nombreCompleto.value.trim() || !celular.value.trim() || !email.value.trim() || !password.value) {
    mensajeError.value = true
    mensaje.value = 'Todos los campos son obligatorios'
    return false
  }

  if (nombreCompleto.value.trim().split(/\s+/).length < 2) {
    mensajeError.value = true
    mensaje.value = 'Ingresa tu nombre y apellido'
    return false
  }

  if (!email.value.includes('@')) {
    mensajeError.value = true
    mensaje.value = 'Ingresa un correo válido'
    return false
  }

  return true
}

const goToPayment = () => {
  mensaje.value = ''
  mensajeError.value = false

  if (!validateData()) return

  step.value = 'pago'
}

const registrar = async () => {
  mensaje.value = ''
  mensajeError.value = false

  if (!validateData()) return

  if (!paymentProof.value) {
    mensajeError.value = true
    mensaje.value = 'Debes subir la captura del pago'
    return
  }

  loading.value = true

  try {
    const formData = new FormData()
    formData.append('nombreCompleto', nombreCompleto.value.trim())
    formData.append('celular', celular.value.trim())
    formData.append('email', email.value.trim().toLowerCase())
    formData.append('password', password.value)
    formData.append('paymentProof', paymentProof.value)

    if (fechaNacimiento.value) {
      formData.append('fechaNacimiento', fechaNacimiento.value)
    }

    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: formData
    })

    if (response.success) {
      mensajeError.value = false
      mensaje.value = `${response.message} En caso de que no suceda durante ese tiempo, comunícate por llamada a la línea 3143509438.`

      nombreCompleto.value = ''
      celular.value = ''
      email.value = ''
      password.value = ''
      fechaNacimiento.value = ''
      paymentProof.value = null
      paymentPreview.value = ''
      step.value = 'datos'
    } else {
      mensajeError.value = true
      mensaje.value = response.error
    }
  } catch (error) {
    mensajeError.value = true
    mensaje.value = error?.data?.statusMessage || error?.message || 'Error al registrar'
  }

  loading.value = false
}
</script>

<style scoped>
.steps {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, 1fr);
}

.steps span {
  background: #f1f3f5;
  border-radius: 999px;
  color: #6c757d;
  font-weight: 700;
  padding: 0.65rem;
  text-align: center;
}

.steps span.active {
  background: #0d6efd;
  color: #fff;
}

.payment-card {
  border: 1px solid rgba(13, 110, 253, 0.12);
  border-radius: 1rem;
  padding: 1rem;
}

.qr-image {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 1rem;
  max-width: 260px;
  padding: 0.75rem;
  width: 100%;
}

.payment-instructions {
  background: #f8fbff;
  border: 1px solid #e5efff;
  border-radius: 0.85rem;
  padding: 1rem;
}

.payment-preview {
  border: 1px dashed #adb5bd;
  border-radius: 1rem;
  padding: 0.75rem;
  text-align: center;
}

.payment-preview img {
  border-radius: 0.75rem;
  max-height: 260px;
  max-width: 100%;
  object-fit: contain;
}

.register-card {
  border: 0;
  border-radius: 1.25rem;
}

@media (max-width: 576px) {
  .register-page {
    padding-top: 1.5rem !important;
  }

  .register-card {
    border-radius: 1rem;
    padding: 1.25rem !important;
  }

  .steps {
    gap: 0.5rem;
  }

  .steps span {
    font-size: 0.85rem;
    padding: 0.55rem 0.35rem;
  }

  .form-control,
  .btn {
    min-height: 2.8rem;
  }

  .payment-card {
    padding: 1rem;
  }

  .qr-image {
    max-width: 220px;
  }

  .input-group {
    flex-direction: column;
  }

  .input-group .form-control,
  .input-group .btn {
    border-radius: 0.75rem !important;
    width: 100%;
  }
}
</style>
