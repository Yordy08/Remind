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
  const { commentId, text } = body

  if (!commentId || !text || !text.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'commentId y text requeridos'
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
      statusMessage: 'No tienes permiso para editar este comentario'
    })
  }

  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: { text: text.trim() }
  })

  return {
    success: true,
    comment: updatedComment
  }
})
