import prisma from '../../utils/prisma'
import { getUserFromToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUserFromToken(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const body = await readBody(event)
  const rating = Number(body?.rating)
  const text = body?.text?.trim()

  if (!rating || rating < 1 || rating > 5 || !text) {
    throw createError({ statusCode: 400, statusMessage: 'Calificación y reseña son requeridas' })
  }

  const review = await prisma.review.create({
    data: {
      userId: user.id,
      rating,
      text
    }
  })

  await prisma.user.update({
    where: { id: user.id },
    data: { reviewRequired: false }
  })

  return JSON.parse(JSON.stringify({ success: true, review }))
})
