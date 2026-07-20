import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const userId = query.id as string

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID de usuario requerido'
      })
    }

    // 1. Buscar usuario (sin password)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        foto: true,
        bio: true,
        fechaNacimiento: true,
        estado: true,
        createdAt: true
      }
    })

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Usuario no encontrado'
      })
    }

    // 2. Traer publicaciones públicas del usuario con relaciones
    const posts = await prisma.post.findMany({
      where: {
        userId: userId,
        estado: 'PUBLICO'
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: true,
        likes: true,
        tags: true,
        userTags: {
          include: {
            user: true
          }
        },
        comments: {
          include: {
            user: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    // 3. Organizar comentarios en padres y respuestas
    const organizeComments = (comments: any[]): any[] => {
      const parents: any[] = []
      const repliesMap = new Map<string, any[]>()

      for (const comment of comments) {
        if (comment.parentCommentId) {
          const parentId = String(comment.parentCommentId)
          if (!repliesMap.has(parentId)) {
            repliesMap.set(parentId, [])
          }
          repliesMap.get(parentId)!.push(comment)
        } else {
          parents.push(comment)
        }
      }

      for (const parent of parents) {
        parent.replies = repliesMap.get(String(parent.id)) || []
      }

      return parents
    }

    const finalPosts = posts.map((post: any) => {
      // Normalizar imágenes: siempre devolver array `imagenes`
      const imagenes = (post.imagenes && post.imagenes.length > 0)
        ? post.imagenes
        : (post.imagen ? [post.imagen] : [])

      return {
        ...post,
        imagenes,
        comments: organizeComments(post.comments || [])
      }
    })

    // 4. Calcular estadísticas
    const postsCount = posts.length
    let likesReceived = 0
    let commentsReceived = 0

    for (const post of posts) {
      likesReceived += post.likes?.length || 0
      commentsReceived += post.comments?.length || 0
    }

    // 5. Serializar para eliminar objetos MongoDB no serializables
    const serializedUser = JSON.parse(JSON.stringify(user))
    const serializedPosts = JSON.parse(JSON.stringify(finalPosts))

    return {
      success: true,
      user: serializedUser,
      posts: serializedPosts,
      stats: {
        postsCount,
        likesReceived,
        commentsReceived
      }
    }
  } catch (error: any) {
    console.error('Error obteniendo perfil:', error)

    if (error?.statusCode === 404) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Error obteniendo perfil de usuario'
    })
  }
})
