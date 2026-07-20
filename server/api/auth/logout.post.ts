export default defineEventHandler(async (event) => {
  // Eliminar la cookie del token
  deleteCookie(event, 'token')

  return {
    success: true,
    message: 'Sesión cerrada correctamente'
  }
})
