import prisma from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const complaintId = body?.complaintId
  const response = body?.response?.trim()
  const status = body?.status || 'ANSWERED'

  if (!complaintId) {
    throw createError({ statusCode: 400, statusMessage: 'complaintId requerido' })
  }

  if (!['PENDING', 'REVIEWED', 'ANSWERED'].includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Estado inválido' })
  }

  const complaint = await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      status,
      response: response || undefined
    },
    include: {
      user: true
    }
  })

  if (response) {
    await prisma.notification.create({
      data: {
        userId: complaint.userId,
        title: 'Respuesta a tu queja o reclamo',
        message: response
      }
    })
  }

  return JSON.parse(JSON.stringify({ success: true, complaint }))
})
