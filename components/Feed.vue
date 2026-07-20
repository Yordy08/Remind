<template>
<div>

  <div v-if="!posts.length" class="text-center text-muted py-5">
    <p>No hay publicaciones para mostrar.</p>
  </div>

  <div v-for="post in visiblePosts" :key="post.id" class="card mb-4 shadow-sm">

    <!-- HEADER USUARIO -->
    <div class="card-header bg-white d-flex align-items-center gap-2">
      <NuxtLink :to="`/biografia?id=${post.user?.id}`">
        <Avatar
          :src="post.user?.foto"
          :name="post.user?.nombre || '?'"
          :size="40"
        />
      </NuxtLink>
      <div>
        <NuxtLink :to="`/biografia?id=${post.user?.id}`" class="text-decoration-none text-dark">
          <strong v-if="post.user?.nombre">{{ post.user.nombre }} {{ post.user.apellido }}</strong>
          <strong v-else class="text-muted">Usuario desconocido</strong>
        </NuxtLink>
        <br>
        <small class="text-muted">{{ formatDate(post.createdAt) }}</small>
      </div>
    </div>

    <!-- IMAGEN / CARRUSEL -->
    <div v-if="post.imagenes?.length === 1" class="post-image-single">
      <img :src="optimizeImage(post.imagenes[0])" class="img-fluid" loading="lazy" />
    </div>
    <div v-else-if="post.imagenes?.length > 1">
      <ImageCarousel :images="post.imagenes" />
    </div>

    <!-- CONTENIDO -->
    <div class="card-body">
      <p v-if="post.userTags?.length" class="small text-primary fw-semibold">
        🏷️ Con {{ formatTaggedUsers(post.userTags) }}
      </p>
      <h6 v-if="post.titulo">{{ post.titulo }}</h6>
      <p class="text-muted">{{ post.descripcion }}</p>

      <!-- ETIQUETAS -->

      <!-- BOTONES -->
      <div class="d-flex gap-2 mb-3">
        <button
          class="btn btn-sm"
          :class="userLiked(post) ? 'btn-danger' : 'btn-light'"
          @click="toggleLike(post)"
          :disabled="loadingLikes[post.id]"
        >
          <span v-if="loadingLikes[post.id]" class="spinner-border spinner-border-sm me-1"></span>
          💖 {{ post.likes?.length || 0 }} Me encanta
        </button>
        <button class="btn btn-light btn-sm">
          💬 {{ countAllComments(post) }} Comentarios
        </button>
      </div>

      <!-- COMENTARIOS -->
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
                <!-- Modo edición -->
                <div v-if="editingCommentId === comment.id" class="input-group input-group-sm">
                  <input
                    v-model="editInputs[comment.id]"
                    type="text"
                    class="form-control"
                    @keyup.enter="saveEdit(comment)"
                  >
                  <button class="btn btn-primary" @click="saveEdit(comment)">Guardar</button>
                  <button class="btn btn-secondary" @click="cancelEdit">Cancelar</button>
                </div>

                <!-- Modo normal -->
                <div v-else class="bg-light rounded p-2">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <NuxtLink :to="`/biografia?id=${comment.user?.id}`" class="text-decoration-none text-dark">
                        <strong class="d-block small">{{ comment.user?.nombre }} {{ comment.user?.apellido }}</strong>
                      </NuxtLink>
                      <span class="small text-muted">{{ comment.text }}</span>
                    </div>

                    <!-- Menú personalizado (solo dueño) -->
                    <div v-if="user && comment.userId === user.id" class="position-relative">
                      <button
                        class="btn btn-link btn-sm text-muted p-0"
                        @click.stop="toggleMenu(comment.id)"
                      >
                        ⋯
                      </button>
                      <div
                        v-if="showMenuFor === comment.id"
                        class="dropdown-menu show dropdown-menu-end"
                        style="position: absolute; right: 0; top: 100%; z-index: 1000; display: block;"
                      >
                        <button class="dropdown-item small" @click="startEdit(comment); closeMenu()">✏️ Editar</button>
                        <button class="dropdown-item small text-danger" @click="deleteComment(post, comment); closeMenu()">🗑️ Eliminar</button>
                      </div>
                    </div>
                  </div>

                  <div class="mt-1">
                    <button class="btn btn-link btn-sm text-muted p-0 me-2" @click="toggleReply(comment.id)">Responder</button>
                  </div>
                </div>

                <!-- Input para responder -->
                <div v-if="replyingTo === comment.id" class="input-group input-group-sm mt-2">
                  <input
                    v-model="replyInputs[comment.id]"
                    type="text"
                    class="form-control"
                    placeholder="Escribe una respuesta..."
                    @keyup.enter="submitReply(post, comment)"
                  >
                  <button
                    class="btn btn-primary"
                    type="button"
                    @click="submitReply(post, comment)"
                    :disabled="loadingReplies[comment.id] || !replyInputs[comment.id]?.trim()"
                  >
                    <span v-if="loadingReplies[comment.id]" class="spinner-border spinner-border-sm"></span>
                    <span v-else>Responder</span>
                  </button>
                  <button class="btn btn-secondary" @click="cancelReply">Cancelar</button>
                </div>

                <!-- Respuestas (replies) -->
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
                      <!-- Modo edición reply -->
                      <div v-if="editingCommentId === reply.id" class="input-group input-group-sm">
                        <input
                          v-model="editInputs[reply.id]"
                          type="text"
                          class="form-control"
                          @keyup.enter="saveEdit(reply)"
                        >
                        <button class="btn btn-primary" @click="saveEdit(reply)">Guardar</button>
                        <button class="btn btn-secondary" @click="cancelEdit">Cancelar</button>
                      </div>

                      <!-- Modo normal reply -->
                      <div v-else class="bg-light rounded p-2">
                        <div class="d-flex justify-content-between align-items-start">
                          <div>
                            <NuxtLink :to="`/biografia?id=${reply.user?.id}`" class="text-decoration-none text-dark">
                              <strong class="d-block small">{{ reply.user?.nombre }} {{ reply.user?.apellido }}</strong>
                            </NuxtLink>
                            <span class="small text-muted">{{ reply.text }}</span>
                          </div>

                          <!-- Menú personalizado reply (solo dueño) -->
                          <div v-if="user && reply.userId === user.id" class="position-relative">
                            <button
                              class="btn btn-link btn-sm text-muted p-0"
                              @click.stop="toggleMenu(reply.id)"
                            >
                              ⋯
                            </button>
                            <div
                              v-if="showMenuFor === reply.id"
                              class="dropdown-menu show dropdown-menu-end"
                              style="position: absolute; right: 0; top: 100%; z-index: 1000; display: block;"
                            >
                              <button class="dropdown-item small" @click="startEdit(reply); closeMenu()">✏️ Editar</button>
                              <button class="dropdown-item small text-danger" @click="deleteComment(post, reply, comment); closeMenu()">🗑️ Eliminar</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Botón ver más/menos comentarios -->
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

        <!-- Input principal para comentar -->
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
</template>

<script setup>
const { isLoggedIn, user, checkAuth } = useAuth()

const posts = ref([])

const visiblePosts = computed(() => {
  return posts.value.filter(post => post.estado !== 'PRIVADO')
})

const commentInputs = ref({})
const replyInputs = ref({})
const editInputs = ref({})
const loadingLikes = ref({})
const loadingComments = ref({})
const loadingReplies = ref({})
const replyingTo = ref(null)
const editingCommentId = ref(null)
const showMenuFor = ref(null)
const expandedPosts = ref(new Set())

const loadPosts = async () => {
  try {
    const res = await $fetch('/api/posts/get')
    console.log('Posts cargados:', res.posts?.length, res.posts)
    posts.value = res.posts || []
  } catch (err) {
    console.error('Error cargando posts:', err)
    posts.value = []
  }
}

onMounted(() => {
  loadPosts()
  checkAuth()
  document.addEventListener('click', () => { showMenuFor.value = null })
})

onUnmounted(() => {
  document.removeEventListener('click', () => { showMenuFor.value = null })
})

const toggleMenu = (commentId) => {
  showMenuFor.value = showMenuFor.value === commentId ? null : commentId
}

const closeMenu = () => {
  showMenuFor.value = null
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

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

// Optimizar URLs de Cloudinary para compresión automática
const optimizeImage = (url) => {
  if (typeof url !== 'string') return url
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/w_1200,q_auto,f_auto/')
  }
  return url
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

const toggleReply = (commentId) => {
  if (!isLoggedIn.value) {
    alert('Debes iniciar sesión para responder')
    navigateTo('/login')
    return
  }
  replyingTo.value = replyingTo.value === commentId ? null : commentId
}

const cancelReply = () => {
  replyingTo.value = null
}

const submitReply = async (post, parentComment) => {
  if (!isLoggedIn.value) {
    alert('Debes iniciar sesión para responder')
    navigateTo('/login')
    return
  }
  const text = replyInputs.value[parentComment.id]?.trim()
  if (!text) return
  loadingReplies.value[parentComment.id] = true
  try {
    const res = await $fetch('/api/posts/comment', {
      method: 'POST',
      body: { postId: post.id, text, parentCommentId: parentComment.id }
    })
    if (res.comment) {
      if (!parentComment.replies) parentComment.replies = []
      parentComment.replies.push({ ...res.comment, user: user.value })
      replyInputs.value[parentComment.id] = ''
      replyingTo.value = null
    }
  } catch (err) {
    if (err?.statusCode === 401) {
      alert('Debes iniciar sesión para responder')
      navigateTo('/login')
    } else {
      alert('Error al publicar respuesta')
    }
  } finally {
    loadingReplies.value[parentComment.id] = false
  }
}

const startEdit = (comment) => {
  editingCommentId.value = comment.id
  editInputs.value[comment.id] = comment.text
}

const cancelEdit = () => {
  editingCommentId.value = null
}

const saveEdit = async (comment) => {
  const text = editInputs.value[comment.id]?.trim()
  if (!text) return
  try {
    const res = await $fetch('/api/posts/comment', {
      method: 'PATCH',
      body: { commentId: comment.id, text }
    })
    if (res.success) {
      comment.text = text
      editingCommentId.value = null
    }
  } catch (err) {
    alert('Error al editar comentario')
  }
}

const deleteComment = async (post, comment, parentComment = null) => {
  if (!confirm('¿Eliminar este comentario?')) return
  try {
    await $fetch('/api/posts/comment', {
      method: 'DELETE',
      body: { commentId: comment.id }
    })
    if (parentComment && parentComment.replies) {
      const idx = parentComment.replies.findIndex(r => r.id === comment.id)
      if (idx !== -1) parentComment.replies.splice(idx, 1)
    } else {
      const idx = post.comments.findIndex(c => c.id === comment.id)
      if (idx !== -1) post.comments.splice(idx, 1)
    }
  } catch (err) {
    alert('Error al eliminar comentario')
  }
}
</script>
