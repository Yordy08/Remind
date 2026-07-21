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

  const [posts, savedAlbums] = await Promise.all([
    prisma.post.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        likes: {
          where: { userId: user.id }
        }
      }
    }),
    prisma.album.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' }
    })
  ])

  const photos = posts.map((post: any) => {
    const imagenes = (post.imagenes && post.imagenes.length > 0)
      ? post.imagenes
      : (post.imagen ? [post.imagen] : [])

    return {
      ...post,
      categoria: post.categoria || 'Recientes',
      imagenes,
      isFavorite: (post.likes || []).length > 0,
      likes: undefined
    }
  })

  const albumNames = Array.from(new Set([
    'Recientes',
    ...savedAlbums.map(album => album.name),
    ...photos.map((post) => post.categoria || 'Recientes')
  ])).sort((a, b) => a === 'Recientes' ? -1 : b === 'Recientes' ? 1 : a.localeCompare(b))

  const favorites = photos.filter((post) => post.isFavorite).length
  const albums = albumNames.map((name) => ({
    id: name,
    name,
    count: photos.filter((post) => (post.categoria || 'Recientes') === name).length,
    automatic: name === 'Recientes'
  }))

  if (favorites) {
    albums.unshift({ id: 'Favoritos', name: 'Favoritos', count: favorites, automatic: true })
  }

  const categories = albumNames
  const totalImages = photos.reduce((total, post) => total + post.imagenes.length, 0)

  return JSON.parse(JSON.stringify({
    success: true,
    photos,
    albums,
    categories,
    stats: {
      albums: categories.length,
      posts: photos.length,
      images: totalImages,
      favorites
    }
  }))
})
