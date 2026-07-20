import prisma from '../../utils/prisma'
import { getUserFromToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUserFromToken(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Debes iniciar sesión para ver tu galería'
    })
  }

  const posts = await prisma.post.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      likes: {
        where: { userId: user.id }
      }
    }
  })

  const photos = posts.map((post: any) => {
    const imagenes = (post.imagenes && post.imagenes.length > 0)
      ? post.imagenes
      : (post.imagen ? [post.imagen] : [])

    return {
      ...post,
      categoria: post.categoria || 'General',
      imagenes,
      isFavorite: (post.likes || []).length > 0,
      likes: undefined
    }
  })

  const categories = Array.from(new Set(photos.map((post) => post.categoria || 'General'))).sort()
  const totalImages = photos.reduce((total, post) => total + post.imagenes.length, 0)
  const favorites = photos.filter((post) => post.isFavorite).length

  return JSON.parse(JSON.stringify({
    success: true,
    photos,
    categories,
    stats: {
      albums: categories.length,
      posts: photos.length,
      images: totalImages,
      favorites
    }
  }))
})
