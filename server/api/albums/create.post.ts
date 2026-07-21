import prisma from '../../utils/prisma'
import { getUserFromToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUserFromToken(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const body = await readBody(event)
  const name = String(body?.name || '').trim()

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Nombre de álbum requerido' })
  }

  if (name.toLowerCase() === 'favoritos') {
    throw createError({ statusCode: 400, statusMessage: 'Favoritos se crea automáticamente' })
  }

  const albums = await prisma.album.findMany({ where: { userId: user.id } })
  const existing = albums.find(album => album.name.toLowerCase() === name.toLowerCase())

  if (existing) {
    return { success: true, album: existing }
  }

  const album = await prisma.album.create({
    data: {
      userId: user.id,
      name
    }
  })

  return { success: true, album }
})
