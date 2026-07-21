import { getUserFromToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const tokenUser = getUserFromToken(event)

  if (!tokenUser) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  const { default: prisma } = await import('../../utils/prisma')

  const user = await prisma.user.findUnique({
    where: { id: tokenUser.id }
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Usuario no encontrado'
    })
  }

  if (user.estado !== 'ACTIVO') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Usuario desactivado'
    })
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      foto: user.foto,
      role: user.role,
      estado: user.estado,
      reviewRequired: user.reviewRequired,
      mustChangePassword: Boolean(user.tempPassword && user.tempPasswordExpires && user.tempPasswordExpires > new Date())
    }
  }
})
