import prisma from '../../utils/prisma'
import { getUserFromToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUserFromToken(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Notificación requerida' })
  }

  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId: user.id
    }
  })

  if (!notification) {
    throw createError({ statusCode: 404, statusMessage: 'Notificación no encontrada' })
  }

  let targetUser = null

  if (notification.actionType === 'SUBSCRIPTION_APPROVAL' && notification.targetUserId) {
    targetUser = await prisma.user.findUnique({
      where: { id: notification.targetUserId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        celular: true,
        estado: true,
        subscriptionStatus: true,
        paymentProofUrl: true
      }
    })
  }

  if (!notification.read) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: { read: true }
    })
  }

  return JSON.parse(JSON.stringify({
    success: true,
    notification: { ...notification, read: true, targetUser }
  }))
})
