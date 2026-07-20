import prisma from '../../utils/prisma'
import { getUserFromToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUserFromToken(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20
  })

  return JSON.parse(JSON.stringify({
    success: true,
    notifications,
    unread: notifications.filter((notification) => !notification.read).length
  }))
})
