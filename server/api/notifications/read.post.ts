import prisma from '../../utils/prisma'
import { getUserFromToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUserFromToken(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true }
  })

  return { success: true }
})
