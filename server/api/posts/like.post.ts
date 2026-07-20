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
  const { postId } = body

  if (!postId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'postId requerido'
    })
  }

  const existingLike = await prisma.like.findFirst({
    where: {
      userId: user.id,
      postId
    }
  })

  if (existingLike) {
    await prisma.like.delete({
      where: {
        id: existingLike.id
      }
    })

    return {
      success: true,
      liked: false
    }
  }

  await prisma.like.create({
    data: {
      userId: user.id,
      postId
    }
  })

  return {
    success: true,
    liked: true
  }
})
