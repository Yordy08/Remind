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
  const postId = body?.postId

  if (!postId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'postId requerido'
    })
  }

  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      userId: user.id
    }
  })

  if (!post) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Foto no encontrada en tu galería'
    })
  }

  const existingFavorite = await prisma.like.findFirst({
    where: {
      userId: user.id,
      postId
    }
  })

  if (existingFavorite) {
    await prisma.like.deleteMany({
      where: {
        userId: user.id,
        postId
      }
    })

    return {
      success: true,
      favorite: false
    }
  }

  await prisma.like.create({
    data: {
      userId: user.id,
      postId,
      type: 'FAVORITE'
    }
  })

  return {
    success: true,
    favorite: true
  }
})
