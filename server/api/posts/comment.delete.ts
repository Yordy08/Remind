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

  const query = getQuery(event)
  const body = await readBody(event).catch(() => ({}))
  const commentId = body.commentId || query.commentId

  if (!commentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'commentId requerido'
    })
  }

  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId }
  })

  if (!existingComment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Comentario no encontrado'
    })
  }

  if (existingComment.userId !== user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'No tienes permiso para eliminar este comentario'
    })
  }

  // Eliminar replies primero
  await prisma.comment.deleteMany({
    where: { parentCommentId: commentId }
  })

  await prisma.comment.delete({
    where: { id: commentId }
  })

  return {
    success: true
  }
})
