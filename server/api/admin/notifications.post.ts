import prisma from '../../utils/prisma'
import { requireAdmin } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const { userId, title, message } = body || {}

  if (!userId || !title?.trim() || !message?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Usuario, título y mensaje son requeridos' })
  }

  const notification = await prisma.notification.create({
    data: {
      userId,
      title: title.trim(),
      message: message.trim()
    }
  })

  return JSON.parse(JSON.stringify({ success: true, notification }))
})
