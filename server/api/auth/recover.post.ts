import prisma from '../../utils/prisma'
import bcrypt from 'bcryptjs'

const generateTemporaryPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let password = ''

  for (let i = 0; i < 10; i++) {
    password += alphabet[Math.floor(Math.random() * alphabet.length)]
  }

  return password
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const identifier = body?.identifier?.trim()
  const normalizedIdentifier = identifier?.toLowerCase()

  if (!identifier) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Correo o usuario requerido'
    })
  }

  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalizedIdentifier },
        { nombre: { equals: identifier, mode: 'insensitive' } },
        { apellido: { equals: identifier, mode: 'insensitive' } }
      ]
    }
  })

  if (!user && identifier.includes(' ')) {
    const [nombre, ...apellidoParts] = identifier.split(/\s+/)
    const apellido = apellidoParts.join(' ')

    if (nombre && apellido) {
      user = await prisma.user.findFirst({
        where: {
          nombre: { equals: nombre, mode: 'insensitive' },
          apellido: { equals: apellido, mode: 'insensitive' }
        }
      })
    }
  }

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No se encontró un usuario con esos datos'
    })
  }

  const temporaryPassword = generateTemporaryPassword()
  const tempPassword = await bcrypt.hash(temporaryPassword, 10)
  const tempPasswordExpires = new Date(Date.now() + 10 * 60 * 1000)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      tempPassword,
      tempPasswordExpires
    }
  })

  return {
    success: true,
    temporaryPassword,
    expiresAt: tempPasswordExpires,
    message: 'Contraseña temporal generada. Tiene una duración de 10 minutos.'
  }
})
