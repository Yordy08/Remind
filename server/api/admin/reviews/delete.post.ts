import prisma from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const reviewId = String(body?.reviewId || '')

  if (!reviewId) {
    throw createError({ statusCode: 400, statusMessage: 'reviewId requerido' })
  }

  await prisma.review.delete({ where: { id: reviewId } })

  return { success: true }
})
