import prisma from '../../utils/prisma'
import { getUserFromToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUserFromToken(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const body = await readBody(event)
  const postId = String(body?.postId || '')
  const album = String(body?.album || '').trim() || 'Recientes'

  if (!postId) {
    throw createError({ statusCode: 400, statusMessage: 'postId requerido' })
  }

  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      userId: user.id
    }
  })

  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Foto no encontrada en tu galería' })
  }

  if (album.toLowerCase() !== 'favoritos') {
    const albums = await prisma.album.findMany({ where: { userId: user.id } })
    const existing = albums.find(item => item.name.toLowerCase() === album.toLowerCase())

    if (!existing) {
      await prisma.album.create({
        data: {
          userId: user.id,
          name: album
        }
      })
    }
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { categoria: album }
  })

  return { success: true, photo: updated }
})
