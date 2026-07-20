import prisma from '../../utils/prisma'
import { getUserFromToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUserFromToken(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  const body = await readBody(event)
  const { postId, text, parentCommentId } = body

  if (!postId || !text || !text.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'postId y text requeridos'
    })
  }

  const comment = await prisma.comment.create({
    data: {
      userId: user.id,
      postId,
      text: text.trim(),
      parentCommentId: parentCommentId || null
    }
  })

  return {
    success: true,
    comment
  }
})
