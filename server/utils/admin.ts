import prisma from './prisma'
import { getUserFromToken } from './auth'

export const requireAdmin = async (event) => {
  const tokenUser = getUserFromToken(event)

  if (!tokenUser) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const user = await prisma.user.findUnique({
    where: { id: tokenUser.id }
  })

  if (!user || user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Acceso solo para administrador' })
  }

  return user
}
