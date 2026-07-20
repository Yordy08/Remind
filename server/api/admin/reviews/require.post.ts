import prisma from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const { userId } = body || {}

  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'userId requerido' })
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { reviewRequired: true },
    select: { id: true, reviewRequired: true }
  })

  await prisma.notification.create({
    data: {
      userId,
      title: 'Reseña requerida',
      message: 'El administrador te solicitó dejar una reseña sobre tu experiencia.'
    }
  })

  return { success: true, user }
})
