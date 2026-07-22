import prisma from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const complaintId = String(body?.complaintId || '')

  if (!complaintId) {
    throw createError({ statusCode: 400, statusMessage: 'complaintId requerido' })
  }

  await prisma.complaint.delete({ where: { id: complaintId } })

  return { success: true }
})
