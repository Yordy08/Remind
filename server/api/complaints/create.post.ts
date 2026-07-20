import prisma from '../../utils/prisma'
import { getUserFromToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUserFromToken(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const body = await readBody(event)
  const subject = body?.subject?.trim()
  const message = body?.message?.trim()

  if (!subject || !message) {
    throw createError({ statusCode: 400, statusMessage: 'Asunto y mensaje son requeridos' })
  }

  const complaint = await prisma.complaint.create({
    data: {
      userId: user.id,
      subject,
      message
    }
  })

  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', estado: 'ACTIVO' },
    select: { id: true }
  })

  await Promise.all(admins.map(admin => prisma.notification.create({
    data: {
      userId: admin.id,
      title: 'Nueva queja o reclamo',
      message: `${user.nombre || 'Un usuario'} envió un reclamo: ${subject}`
    }
  })))

  return JSON.parse(JSON.stringify({ success: true, complaint }))
})
