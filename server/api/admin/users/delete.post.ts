import prisma from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/admin'
import { deleteCloudinaryUrls, isCloudinaryFolderUrl } from '../../../utils/cloudinaryDelete'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const body = await readBody(event)
  const userId = String(body?.userId || '')

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'userId requerido' })
  }

  if (userId === admin.id) {
    throw createError({ statusCode: 400, statusMessage: 'No puedes eliminar tu propio usuario administrador' })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado' })
  }

  const [posts, notifications] = await Promise.all([
    prisma.post.findMany({ where: { userId } }),
    prisma.notification.findMany({
      where: {
        OR: [
          { userId },
          { targetUserId: userId }
        ]
      }
    })
  ])

  const postIds = posts.map(post => post.id)
  const postImages = posts.flatMap(post => [
    post.imagen,
    post.imagenBackup,
    ...(post.imagenes || []),
    ...(post.imagenesBackup || [])
  ])
  const notificationImages = notifications
    .map(notification => notification.imageUrl)
    .filter(url => isCloudinaryFolderUrl(url, 'entrenos/notifications'))

  const cloudinaryResult = await deleteCloudinaryUrls([
    user.foto,
    user.paymentProofUrl,
    ...postImages,
    ...notificationImages
  ])

  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { OR: [{ userId }, ...(postIds.length ? [{ postId: { in: postIds } }] : [])] } }),
    prisma.like.deleteMany({ where: { OR: [{ userId }, ...(postIds.length ? [{ postId: { in: postIds } }] : [])] } }),
    prisma.tag.deleteMany({ where: postIds.length ? { postId: { in: postIds } } : { id: { in: [] } } }),
    prisma.userTag.deleteMany({ where: { OR: [{ userId }, ...(postIds.length ? [{ postId: { in: postIds } }] : [])] } }),
    prisma.notification.deleteMany({ where: { OR: [{ userId }, { targetUserId: userId }] } }),
    prisma.review.deleteMany({ where: { userId } }),
    prisma.complaint.deleteMany({ where: { userId } }),
    prisma.album.deleteMany({ where: { userId } }),
    prisma.dailyPhraseInteraction.deleteMany({ where: { userId } }),
    prisma.post.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } })
  ])

  return {
    success: true,
    cloudinary: cloudinaryResult
  }
})
