import prisma from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/admin'
import { deleteCloudinaryUrl, isCloudinaryFolderUrl } from '../../../utils/cloudinaryDelete'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const notificationId = String(body?.notificationId || '')

  if (!notificationId) {
    throw createError({ statusCode: 400, statusMessage: 'notificationId requerido' })
  }

  const notification = await prisma.notification.findUnique({ where: { id: notificationId } })

  if (!notification) {
    throw createError({ statusCode: 404, statusMessage: 'Notificación no encontrada' })
  }

  if (isCloudinaryFolderUrl(notification.imageUrl, 'entrenos/notifications')) {
    try {
      await deleteCloudinaryUrl(notification.imageUrl)
    } catch (error) {
      console.error('Error eliminando imagen de notificación en Cloudinary:', error)
    }
  }

  await prisma.notification.delete({ where: { id: notification.id } })

  return { success: true }
})
