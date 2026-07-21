import prisma from '../../utils/prisma'
import { getUserFromToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUserFromToken(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const body = await readBody(event)
  const postId = String(body?.postId || '')
  const imageUrl = String(body?.imageUrl || '')
  const imageIndex = Number(body?.imageIndex ?? -1)

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

  const images = post.imagenes?.length ? post.imagenes : (post.imagen ? [post.imagen] : [])

  if (images.length > 1) {
    const indexToDelete = imageIndex >= 0 && images[imageIndex] === imageUrl
      ? imageIndex
      : images.findIndex((url) => url === imageUrl)

    if (indexToDelete === -1) {
      throw createError({ statusCode: 404, statusMessage: 'Imagen no encontrada' })
    }

    const nextImages = images.filter((_, index) => index !== indexToDelete)

    await prisma.post.update({
      where: { id: post.id },
      data: {
        imagen: nextImages[0] || null,
        imagenes: nextImages
      }
    })

    return { success: true }
  }

  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { postId: post.id } }),
    prisma.like.deleteMany({ where: { postId: post.id } }),
    prisma.tag.deleteMany({ where: { postId: post.id } }),
    prisma.userTag.deleteMany({ where: { postId: post.id } }),
    prisma.post.delete({ where: { id: post.id } })
  ])

  return { success: true }
})
