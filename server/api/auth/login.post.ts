import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getJwtSecret } from '../../utils/auth'

export default defineEventHandler(async (event) => {

  const body = await readBody(event)

  const { email, password } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Campos obligatorios'
    })
  }

  const { default: prisma } = await import('../../utils/prisma')

  // 🔎 buscar usuario
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Usuario no encontrado'
    })
  }

  // 🔑 validar contraseña real o temporal vigente
  const valid = await bcrypt.compare(password, user.password)
  const tempPasswordIsActive = Boolean(user.tempPassword && user.tempPasswordExpires && user.tempPasswordExpires > new Date())
  const validTempPassword = tempPasswordIsActive && user.tempPassword
    ? await bcrypt.compare(password, user.tempPassword)
    : false

  if (!valid && !validTempPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: user.tempPassword && !tempPasswordIsActive
        ? 'La contraseña temporal venció. Genera una nueva.'
        : 'Contraseña incorrecta'
    })
  }

  if (user.estado !== 'ACTIVO') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Tu cuenta está desactivada. Contacta al administrador.'
    })
  }

  // 🔐 crear token
  const token = jwt.sign(
    { id: user.id, email: user.email, nombre: user.nombre, apellido: user.apellido, foto: user.foto, role: user.role },
    getJwtSecret(),
    { expiresIn: '7d' }
  )

  // 🍪 guardar cookie
  setCookie(event, 'token', token, {
    httpOnly: true,
    secure: false
  })

  return {
    success: true,
    user: {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      foto: user.foto,
      role: user.role,
      reviewRequired: user.reviewRequired,
      mustChangePassword: validTempPassword
    },
    mustChangePassword: validTempPassword
  }
})
