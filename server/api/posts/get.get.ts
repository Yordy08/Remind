import prisma from '../../utils/prisma'

export default defineEventHandler(async () => {
  try {
    // 1. Traer posts públicos con todas sus relaciones incluidas
    const posts = await prisma.post.findMany({
      where: {
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

    // 2. Organizar comentarios en padres y respuestas (replies)
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

    // 3. Adjuntar comentarios organizados a cada post + normalizar imágenes
    const finalPosts = posts.map((post: any) => {
      // Normalizar imágenes: siempre devolver array `imagenes`
      // Posts nuevos usan `imagenes`, posts legacy usan `imagen`
      const imagenes = (post.imagenes && post.imagenes.length > 0)
        ? post.imagenes
        : (post.imagen ? [post.imagen] : [])

      return {
        ...post,
        imagenes,
        comments: organizeComments(post.comments || [])
      }
    })

    // 4. Serializar para eliminar objetos MongoDB no serializables (ObjectId, Date, etc.)
    const serializedPosts = JSON.parse(JSON.stringify(finalPosts))

    return {
      success: true,
      posts: serializedPosts
    }
  } catch (error: any) {
    console.error('Error obteniendo posts:', error)

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Error obteniendo publicaciones'
    })
  }
})
