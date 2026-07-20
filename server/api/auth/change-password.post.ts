import prisma from '../../utils/prisma'
import { getUserFromToken } from '../../utils/auth'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const tokenUser = getUserFromToken(event)

  if (!tokenUser) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado'
    })
  }

  const body = await readBody(event)
  const currentPassword = body?.currentPassword
  const newPassword = body?.newPassword

  if (!currentPassword || !newPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Contraseña actual y nueva contraseña requeridas'
    })
  }

  if (newPassword.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: 'La nueva contraseña debe tener al menos 6 caracteres'
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: tokenUser.id }
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Usuario no encontrado'
    })
  }

  const validPassword = await bcrypt.compare(currentPassword, user.password)
  const tempPasswordIsActive = Boolean(user.tempPassword && user.tempPasswordExpires && user.tempPasswordExpires > new Date())
  const validTempPassword = tempPasswordIsActive && user.tempPassword
    ? await bcrypt.compare(currentPassword, user.tempPassword)
    : false

  if (!validPassword && !validTempPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'La contraseña actual no es válida'
    })
  }

  const password = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password,
      tempPassword: null,
      tempPasswordExpires: null
    }
  })

  return {
    success: true,
    message: 'Contraseña actualizada correctamente'
  }
})
