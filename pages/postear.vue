<template>
<div class="post-page container py-5">

<div class="post-card card p-4 shadow">

<div class="text-center mb-4">
  <p class="eyebrow mb-2">Nueva carga</p>
  <h1 class="h3 fw-bold mb-2">Sube tus recuerdos</h1>
  <p class="text-muted mb-0">Selecciona tus fotos. Remind las organizará en tu Galería automáticamente.</p>
</div>

<!-- INPUT IMÁGENES MÚLTIPLES -->
<input
  type="file"
  class="form-control mb-3"
  accept="image/*"
  multiple
  @change="onFilesChange"
/>

<!-- INFO Y LÍMITE -->
<div class="d-flex justify-content-between align-items-center mb-2">
  <small class="text-muted">
    {{ files.length }} / {{ MAX_IMAGES }} fotos seleccionadas
  </small>
  <small v-if="files.length >= MAX_IMAGES" class="text-danger fw-bold">
    Límite alcanzado
  </small>
</div>

<!-- PREVIEWS GRID -->
<div v-if="previews.length" class="mb-3">
  <div class="preview-grid">
    <div
      v-for="(preview, idx) in previews"
      :key="idx"
      class="preview-item"
    >
      <img :src="preview" class="preview-img" />
      <button
        type="button"
        class="btn-remove"
        @click="removeFile(idx)"
        title="Eliminar foto"
      >
        ✕
      </button>
    </div>
  </div>
</div>

<div class="upload-note mb-3">
  Las fotos se guardarán privadas en el álbum <strong>Recientes</strong>. Luego podrás moverlas a otros álbumes desde la Galería.
</div>

<!-- BOTÓN -->
<button
  class="btn btn-primary w-100"
  @click="subirPost"
  :disabled="loading || !files.length"
>
  <span v-if="loading">Subiendo...</span>
  <span v-else>Guardar en Galería</span>
</button>

<p class="mt-3" :class="mensajeError ? 'text-danger' : 'text-success'">{{ mensaje }}</p>

</div>

</div>
</template>

<script setup>
const MAX_IMAGES = 10

const files = ref([])
const previews = ref([])
const mensaje = ref('')
const mensajeError = ref(false)
const loading = ref(false)

// seleccionar múltiples imágenes
const onFilesChange = (e) => {
  const selectedFiles = Array.from(e.target.files || [])

  if (!selectedFiles.length) return

  // Validar límite total
  const total = files.value.length + selectedFiles.length
  if (total > MAX_IMAGES) {
    mensajeError.value = true
    mensaje.value = `Máximo ${MAX_IMAGES} fotos permitidas. Ya tienes ${files.value.length}.`
    return
  }

  // Filtrar solo imágenes
  const imageFiles = selectedFiles.filter(f => f.type.startsWith('image/'))

  for (const f of imageFiles) {
    files.value.push(f)
    previews.value.push(URL.createObjectURL(f))
  }

  mensajeError.value = false
  mensaje.value = ''
}

// eliminar una foto del preview
const removeFile = (idx) => {
  URL.revokeObjectURL(previews.value[idx])
  files.value.splice(idx, 1)
  previews.value.splice(idx, 1)

  if (files.value.length < MAX_IMAGES) {
    mensajeError.value = false
    mensaje.value = ''
  }
}

// subir post
const subirPost = async () => {

  if (!files.value.length) {
    mensajeError.value = true
    mensaje.value = 'Debes seleccionar al menos una imagen'
    return
  }

  loading.value = true
  mensajeError.value = false
  mensaje.value = ''

  try {

    const formData = new FormData()

    // Adjuntar todas las imágenes
    for (const f of files.value) {
      formData.append('file', f)
    }

    formData.append('estado', 'PRIVADO')
    formData.append('taggedUserIds', '[]')

    const res = await $fetch('/api/posts/create', {
      method: 'POST',
      body: formData
    })

    if (res.success) {
      mensajeError.value = false
      mensaje.value = 'Publicación creada correctamente'

      // Limpiar previews
      for (const url of previews.value) {
        URL.revokeObjectURL(url)
      }

      files.value = []
      previews.value = []
      await navigateTo('/galeria')
    }

  } catch (err) {
    mensajeError.value = true
    mensaje.value = err?.data?.statusMessage || 'Error al publicar'
  }

  loading.value = false
}
</script>

<style scoped>
.eyebrow {
  color: #0d6efd;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.upload-note {
  background: #f8fbff;
  border: 1px solid #e5efff;
  border-radius: 1rem;
  color: #495057;
  padding: 1rem;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}

.preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #f8f9fa;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.btn-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.btn-remove:hover {
  background: rgba(220, 53, 69, 0.9);
}

.post-card {
  border: 0;
  border-radius: 1.25rem;
}

@media (max-width: 576px) {
  .post-page {
    padding-top: 1.5rem !important;
  }

  .post-card {
    border-radius: 1rem;
    padding: 1.25rem !important;
  }

  .preview-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .form-control,
  .form-select,
  .btn {
    min-height: 2.8rem;
  }

  textarea.form-control {
    min-height: 7rem;
  }
}
</style>
