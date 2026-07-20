export const useAuth = () => {
  const isLoggedIn = useState('isLoggedIn', () => false)
  const user = useState<any>('user', () => null)

  const checkAuth = async () => {
    try {
      const res = await $fetch('/api/auth/me')
      isLoggedIn.value = true
      user.value = res.user
    } catch {
      isLoggedIn.value = false
      user.value = null
    }
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST'
      })
      isLoggedIn.value = false
      user.value = null
      navigateTo('/login')
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
    }
  }

  return {
    isLoggedIn,
    user,
    checkAuth,
    logout
  }
}
