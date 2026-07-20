import prisma from '../../utils/prisma'
import { getUserFromToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUserFromToken(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const complaints = await prisma.complaint.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  })

  return JSON.parse(JSON.stringify({ success: true, complaints }))
})
