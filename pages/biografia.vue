<template>
  <div class="biografia-page">
    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2 text-muted">Cargando perfil...</p>
    </div>

    <!-- Usuario no encontrado -->
    <div v-else-if="error" class="container py-5 text-center">
      <div class="card shadow-sm mx-auto" style="max-width: 400px;">
        <div class="card-body py-5">
          <div class="display-1 text-muted mb-3">😕</div>
          <h4 class="text-muted">Usuario no encontrado</h4>
          <p class="text-muted mb-3">El perfil que buscas no existe o ha sido eliminado.</p>
          <NuxtLink to="/" class="btn btn-primary">Volver al inicio</NuxtLink>
        </div>
      </div>
    </div>

    <!-- Perfil encontrado -->
    <div v-else-if="profile" class="profile-container">
      <!-- Header / Cover -->
      <div class="profile-header">
        <div class="cover-photo">
          <div class="cover-overlay"></div>
        </div>
        <div class="container">
          <div class="profile-header-content">
            <div class="profile-avatar-wrapper">
              <Avatar
                :src="profile.user.foto"
                :name="fullName"
                :size="160"
                class="profile-avatar"
              />
            </div>
            <div class="profile-info flex-grow-1">
              <h2 class="profile-name mb-1">{{ fullName }}</h2>
              <p v-if="profile.user.bio" class="profile-bio text-muted mb-2">{{ profile.user.bio }}</p>
              <div class="profile-meta d-flex flex-wrap gap-3 text-muted small">
                <span v-if="profile.user.fechaNacimiento" class="d-flex align-items-center gap-1">
                  🎂 {{ formatBirthDate(profile.user.fechaNacimiento) }}
                </span>
                <span class="d-flex align-items-center gap-1">
                  📅 Se unió en {{ formatJoinDate(profile.user.createdAt) }}
                </span>
              </div>
            </div>
            <div class="profile-actions d-flex gap-2">
              <button class="btn btn-primary d-flex align-items-center gap-2">
                <span>➕</span>
                <span>Seguir</span>
              </button>
              <button class="btn btn-light border d-flex align-items-center gap-2">
                <span>✉️</span>
                <span>Mensaje</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="profile-stats-bar border-bottom bg-white">
        <div class="container">
          <div class="row text-center py-3">
            <div class="col-4">
              <div class="stat-value fw-bold text-dark">{{ profile.stats.postsCount }}</div>
              <div class="stat-label small text-muted text-uppercase">Publicaciones</div>
            </div>
            <div class="col-4 border-start border-end">
              <div class="stat-value fw-bold text-dark">{{ profile.stats.likesReceived }}</div>
              <div class="stat-label small text-muted text-uppercase">Me encanta</div>
            </div>
            <div class="col-4">
              <div class="stat-value fw-bold text-dark">{{ profile.stats.commentsReceived }}</div>
              <div class="stat-label small text-muted text-uppercase">Comentarios</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="container py-4">
        <div class="row g-4">
          <!-- Sidebar Info -->
          <div class="col-lg-4">
            <div class="card shadow-sm mb-4">
              <div class="card-body">
                <h5 class="card-title mb-3">📋 Información</h5>
                <ul class="list-unstyled mb-0">
                  <li v-if="profile.user.email" class="d-flex align-items-start gap-2 mb-2">
                    <span class="text-muted">📧</span>
                    <span>{{ profile.user.email }}</span>
                  </li>
                  <li v-if="profile.user.fechaNacimiento" class="d-flex align-items-start gap-2 mb-2">
                    <span class="text-muted">🎂</span>
                    <span>{{ formatBirthDate(profile.user.fechaNacimiento) }}</span>
                  </li>
                  <li class="d-flex align-items-start gap-2">
                    <span class="text-muted">📅</span>
                    <span>Miembro desde {{ formatJoinDate(profile.user.createdAt) }}</span>
                  </li>
                  <li class="d-flex align-items-start gap-2 mt-2">
                    <span class="text-muted">✅</span>
                    <span class="text-success small">{{ profile.user.estado }}</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Cambiar contraseña -->
            <div v-if="isOwnProfile" class="card shadow-sm mb-4">
              <div class="card-body">
                <h5 class="card-title mb-3">🔐 Cambiar contraseña</h5>
                <div v-if="user?.mustChangePassword" class="alert alert-warning small">
                  Estás usando una contraseña temporal. Cámbiala antes de que venza.
                </div>
                <input
                  v-model="currentPassword"
                  type="password"
                  class="form-control mb-2"
                  placeholder="Contraseña actual o temporal"
                >
                <input
                  v-model="newPassword"
                  type="password"
                  class="form-control mb-2"
                  placeholder="Nueva contraseña"
                >
                <input
                  v-model="confirmPassword"
                  type="password"
                  class="form-control mb-3"
                  placeholder="Confirmar nueva contraseña"
                  @keyup.enter="changePassword"
                >
                <button
                  class="btn btn-primary w-100"
                  :disabled="changingPassword"
                  @click="changePassword"
                >
                  <span v-if="changingPassword">Actualizando...</span>
                  <span v-else>Actualizar contraseña</span>
                </button>
                <p v-if="passwordMessage" class="text-success small mt-2 mb-0">{{ passwordMessage }}</p>
                <p v-if="passwordError" class="text-danger small mt-2 mb-0">{{ passwordError }}</p>
              </div>
            </div>

            <!-- Mini Galería -->
            <div class="card shadow-sm">
              <div class="card-body">
                <h5 class="card-title mb-3">🖼️ Galería</h5>
                <div v-if="profile.posts.length" class="row g-2">
                  <div
                    v-for="post in profile.posts.slice(0, 6)"
                    :key="post.id"
                    class="col-4"
                  >
                    <div class="gallery-thumb ratio ratio-1x1">
                      <img :src="post.imagenes?.[0] || post.imagen" class="img-fluid rounded object-fit-cover" :alt="post.titulo || 'Publicación'">
                    </div>
                  </div>
                </div>
                <p v-else class="text-muted small mb-0">Sin publicaciones aún.</p>
              </div>
            </div>
          </div>

          <!-- Feed de publicaciones -->
          <div class="col-lg-8">
            <h5 class="mb-3">📝 Publicaciones</h5>
            <div v-if="!profile.posts.length" class="card shadow-sm">
              <div class="card-body text-center text-muted py-5">
                <p class="mb-0">Este usuario aún no tiene publicaciones.</p>
              </div>
            </div>

            <div v-for="post in profile.posts" :key="post.id" class="card mb-4 shadow-sm">
              <!-- Header -->
              <div class="card-header bg-white d-flex align-items-center gap-2">
                <Avatar
                  :src="profile.user.foto"
                  :name="profile.user.nombre"
                  :size="40"
                />
                <div>
                  <strong>{{ fullName }}</strong>
                  <br>
                  <small class="text-muted">{{ formatDate(post.createdAt) }}</small>
                </div>
              </div>

              <!-- IMAGEN / CARRUSEL -->
              <div v-if="post.imagenes?.length === 1" class="post-image-single">
                <img :src="post.imagenes[0]" class="img-fluid" loading="lazy" />
              </div>
              <div v-else-if="post.imagenes?.length > 1">
                <ImageCarousel :images="post.imagenes" />
              </div>

              <!-- Contenido -->
              <div class="card-body">
                <p v-if="post.userTags?.length" class="small text-primary fw-semibold">
                  🏷️ Con {{ formatTaggedUsers(post.userTags) }}
                </p>
                <h6 v-if="post.titulo">{{ post.titulo }}</h6>
                <p class="text-muted">{{ post.descripcion }}</p>

                <!-- Botones -->
                <div class="d-flex gap-2 mb-3">
                  <button
                    class="btn btn-sm"
                    :class="userLiked(post) ? 'btn-danger' : 'btn-light'"
                    @click="toggleLike(post)"
                    :disabled="loadingLikes[post.id]"
                  >
                    <span v-if="loadingLikes[post.id]" class="spinner-border spinner-border-sm me-1"></span>
                    ❤️ {{ post.likes?.length || 0 }} Me encanta
                  </button>
                  <button class="btn btn-light btn-sm">
                    💬 {{ countAllComments(post) }} Comentarios
                  </button>
                </div>

                <!-- Comentarios -->
                <div class="comments-section">
                  <div v-if="post.comments?.length" class="mb-3">
                    <div
                      v-for="comment in getVisibleComments(post)"
                      :key="comment.id"
                      class="mb-2"
                    >
                      <div class="d-flex gap-2">
                        <NuxtLink :to="`/biografia?id=${comment.user?.id}`">
                          <Avatar
                            :src="comment.user?.foto"
                            :name="comment.user?.nombre || '?'"
                            :size="32"
                          />
                        </NuxtLink>
                        <div class="flex-grow-1">
                          <div class="bg-light rounded p-2">
                            <div class="d-flex justify-content-between align-items-start">
                              <div>
                                <NuxtLink
                                  :to="`/biografia?id=${comment.user?.id}`"
                                  class="text-decoration-none text-dark"
                                >
                                  <strong class="d-block small">{{ comment.user?.nombre }} {{ comment.user?.apellido }}</strong>
                                </NuxtLink>
                                <span class="small text-muted">{{ comment.text }}</span>
                              </div>
                            </div>
                          </div>

                          <!-- Respuestas -->
                          <div v-if="comment.replies && comment.replies.length" class="mt-2 ms-4">
                            <div
                              v-for="reply in comment.replies"
                              :key="reply.id"
                              class="d-flex gap-2 mb-2"
                            >
                              <NuxtLink :to="`/biografia?id=${reply.user?.id}`">
                                <Avatar
                                  :src="reply.user?.foto"
                                  :name="reply.user?.nombre || '?'"
                                  :size="28"
                                />
                              </NuxtLink>
                              <div class="flex-grow-1">
                                <div class="bg-light rounded p-2">
                                  <NuxtLink
                                    :to="`/biografia?id=${reply.user?.id}`"
                                    class="text-decoration-none text-dark"
                                  >
                                    <strong class="d-block small">{{ reply.user?.nombre }} {{ reply.user?.apellido }}</strong>
                                  </NuxtLink>
                                  <span class="small text-muted">{{ reply.text }}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Ver más comentarios -->
                  <div v-if="(post.comments?.length || 0) > 2" class="mb-2 text-center">
                    <button
                      class="btn btn-link btn-sm text-muted text-decoration-none"
                      @click="toggleExpand(post.id)"
                    >
                      <span v-if="!isExpanded(post.id)">
                        Ver {{ getHiddenCommentsCount(post) }} comentarios más
                      </span>
                      <span v-else>Ver menos</span>
                    </button>
                  </div>

                  <!-- Input comentario -->
                  <div class="input-group input-group-sm">
                    <input
                      v-model="commentInputs[post.id]"
                      type="text"
                      class="form-control"
                      placeholder="Escribe un comentario..."
                      @keyup.enter="submitComment(post)"
                    >
                    <button
                      class="btn btn-primary"
                      type="button"
                      @click="submitComment(post)"
                      :disabled="loadingComments[post.id] || !commentInputs[post.id]?.trim()"
                    >
                      <span v-if="loadingComments[post.id]" class="spinner-border spinner-border-sm"></span>
                      <span v-else>Enviar</span>
                    </button>
                  </div>
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
const route = useRoute()
const { isLoggedIn, user, checkAuth } = useAuth()

const userId = computed(() => route.query.id)
const isOwnProfile = computed(() => Boolean(user.value?.id && userId.value === user.value.id))

const loading = ref(true)
const error = ref(false)
const profile = ref(null)

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const changingPassword = ref(false)
const passwordMessage = ref('')
const passwordError = ref('')

const commentInputs = ref({})
const loadingLikes = ref({})
const loadingComments = ref({})
const expandedPosts = ref(new Set())

const fullName = computed(() => {
  if (!profile.value?.user) return ''
  return `${profile.value.user.nombre} ${profile.value.user.apellido}`.trim()
})

const loadProfile = async () => {
  if (!userId.value) {
    error.value = true
    loading.value = false
    return
  }

  loading.value = true
  error.value = false
  profile.value = null

  try {
    const res = await $fetch(`/api/users/profile?id=${userId.value}`)
    profile.value = res
  } catch (err) {
    console.error('Error cargando perfil:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

watch(() => route.query.id, () => {
  loadProfile()
}, { immediate: true })

onMounted(() => {
  checkAuth()
})

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

const formatBirthDate = (date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatJoinDate = (date) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long'
  })
}

const formatTaggedUsers = (userTags) => {
  const names = userTags.map(ut => `${ut.user?.nombre} ${ut.user?.apellido}`.trim())
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  const last = names.pop()
  return `${names.join(', ')} y ${last}`
}

const countAllComments = (post) => {
  let count = 0
  for (const c of (post.comments || [])) {
    count++
    if (c.replies) count += c.replies.length
  }
  return count
}

const toggleExpand = (postId) => {
  const newSet = new Set(expandedPosts.value)
  if (newSet.has(postId)) {
    newSet.delete(postId)
  } else {
    newSet.add(postId)
  }
  expandedPosts.value = newSet
}

const isExpanded = (postId) => {
  return expandedPosts.value.has(postId)
}

const getVisibleComments = (post) => {
  if (isExpanded(post.id) || (post.comments?.length || 0) <= 2) {
    return post.comments || []
  }
  return post.comments.slice(0, 2)
}

const getHiddenCommentsCount = (post) => {
  return Math.max(0, (post.comments?.length || 0) - 2)
}

const userLiked = (post) => {
  if (!user.value) return false
  return post.likes?.some(like => like.userId === user.value.id) || false
}

const toggleLike = async (post) => {
  if (!isLoggedIn.value) {
    alert('Debes iniciar sesión para dar me encanta')
    navigateTo('/login')
    return
  }
  loadingLikes.value[post.id] = true
  try {
    const res = await $fetch('/api/posts/like', {
      method: 'POST',
      body: { postId: post.id }
    })
    if (res.liked) {
      post.likes.push({ userId: user.value.id })
    } else {
      const idx = post.likes.findIndex(l => l.userId === user.value.id)
      if (idx !== -1) post.likes.splice(idx, 1)
    }
  } catch (err) {
    if (err?.statusCode === 401) {
      alert('Debes iniciar sesión para dar me encanta')
      navigateTo('/login')
    } else {
      alert('Error al procesar me encanta')
    }
  } finally {
    loadingLikes.value[post.id] = false
  }
}

const submitComment = async (post) => {
  if (!isLoggedIn.value) {
    alert('Debes iniciar sesión para comentar')
    navigateTo('/login')
    return
  }
  const text = commentInputs.value[post.id]?.trim()
  if (!text) return
  loadingComments.value[post.id] = true
  try {
    const res = await $fetch('/api/posts/comment', {
      method: 'POST',
      body: { postId: post.id, text }
    })
    if (res.comment) {
      post.comments.push({ ...res.comment, user: user.value, replies: [] })
      commentInputs.value[post.id] = ''
    }
  } catch (err) {
    if (err?.statusCode === 401) {
      alert('Debes iniciar sesión para comentar')
      navigateTo('/login')
    } else {
      alert('Error al publicar comentario')
    }
  } finally {
    loadingComments.value[post.id] = false
  }
}

const changePassword = async () => {
  passwordMessage.value = ''
  passwordError.value = ''

  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    passwordError.value = 'Completa todos los campos'
    return
  }

  if (newPassword.value.length < 6) {
    passwordError.value = 'La nueva contraseña debe tener al menos 6 caracteres'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Las contraseñas no coinciden'
    return
  }

  changingPassword.value = true

  try {
    const res = await $fetch('/api/auth/change-password', {
      method: 'POST',
      body: {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value
      }
    })

    passwordMessage.value = res.message || 'Contraseña actualizada correctamente'
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    await checkAuth()
  } catch (err) {
    passwordError.value = err?.data?.statusMessage || 'No se pudo actualizar la contraseña'
  } finally {
    changingPassword.value = false
  }
}
</script>

<style scoped>
.biografia-page {
  background-color: #f0f2f5;
  min-height: 100vh;
}

.profile-header {
  position: relative;
  background: #fff;
  margin-bottom: 0;
}

.cover-photo {
  height: 250px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.cover-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 100%);
}

.profile-header-content {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1.5rem;
  padding-bottom: 1rem;
  margin-top: -80px;
  position: relative;
  z-index: 2;
}

.profile-avatar-wrapper {
  flex-shrink: 0;
}

.profile-avatar {
  border: 5px solid #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.profile-info {
  padding-bottom: 0.5rem;
}

.profile-name {
  font-size: 1.75rem;
  font-weight: 700;
}

.profile-bio {
  font-size: 0.95rem;
}

.profile-actions {
  margin-left: auto;
  padding-bottom: 0.5rem;
}

.profile-stats-bar {
  background: #fff;
}

.stat-value {
  font-size: 1.25rem;
}

.stat-label {
  font-size: 0.7rem;
  letter-spacing: 0.5px;
}

.gallery-thumb {
  overflow: hidden;
  cursor: pointer;
}

.gallery-thumb img {
  transition: transform 0.2s;
}

.gallery-thumb:hover img {
  transform: scale(1.05);
}

.object-fit-cover {
  object-fit: cover;
}

@media (max-width: 768px) {
  .cover-photo {
    height: 180px;
  }

  .profile-header-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-top: -60px;
  }

  .profile-actions {
    margin-left: 0;
    width: 100%;
    justify-content: center;
  }

  .profile-meta {
    justify-content: center;
  }
}
</style>
