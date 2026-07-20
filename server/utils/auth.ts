import jwt from 'jsonwebtoken'

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw createError({ statusCode: 500, statusMessage: 'JWT_SECRET no configurado' })
  }

  return secret
}

export const getUserFromToken = (event) => {

  const token = getCookie(event, 'token')

  if (!token) return null

  try {
    return jwt.verify(token, getJwtSecret())
  } catch (err) {
    return null
  }
}
