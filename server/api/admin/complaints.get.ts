import prisma from '../../utils/prisma'
import { requireAdmin } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const complaints = await prisma.complaint.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          celular: true,
          foto: true
        }
      }
    }
  })

  return JSON.parse(JSON.stringify({ success: true, complaints }))
})
