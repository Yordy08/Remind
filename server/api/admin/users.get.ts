import prisma from '../../utils/prisma'
import { requireAdmin } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      foto: true,
      estado: true,
      role: true,
      reviewRequired: true,
      paymentProofUrl: true,
      subscriptionStatus: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          reviews: true,
          notifications: true
        }
      }
    }
  })

  return JSON.parse(JSON.stringify({ success: true, users }))
})
