import prisma from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody(event)
  const { userId, estado } = body || {}

  if (!userId || !['ACTIVO', 'INACTIVO'].includes(estado)) {
    throw createError({ statusCode: 400, statusMessage: 'Datos inválidos' })
  }

  if (userId === admin.id && estado === 'INACTIVO') {
    throw createError({ statusCode: 400, statusMessage: 'No puedes desactivar tu propio usuario admin' })
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      estado,
      subscriptionStatus: estado === 'ACTIVO' ? 'APPROVED' : 'PENDING'
    },
    select: { id: true, estado: true, subscriptionStatus: true }
  })

  return { success: true, user }
})
