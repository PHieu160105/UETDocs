// Validation helpers
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password) => {
  return password.length >= 6
}

export const validateName = (name) => {
  return name.trim().length >= 3
}

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const formatApiError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.message) {
    return error.message
  }
  return 'An error occurred. Please try again.'
}

const TOKEN_TTL_MS = 20 * 60 * 1000

export const saveToken = (token) => {
  if (!token) {
    localStorage.removeItem('token')
    localStorage.removeItem('token_expires_at')
    return
  }

  localStorage.setItem('token', token)
  if (!localStorage.getItem('token_expires_at')) {
    localStorage.setItem('token_expires_at', String(Date.now() + TOKEN_TTL_MS))
  }
}

export const getToken = () => {
  const token = localStorage.getItem('token')
  const expiresAt = Number(localStorage.getItem('token_expires_at'))

  if (!token) {
    localStorage.removeItem('token_expires_at')
    return null
  }

  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
    localStorage.removeItem('token')
    localStorage.removeItem('token_expires_at')
    localStorage.removeItem('user')
    return null
  }

  return token
}

export const removeToken = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('token_expires_at')
}

export const saveUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user))
}

export const getUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export const removeUser = () => {
  localStorage.removeItem('user')
}

export const clearAuthData = () => {
  removeToken()
  removeUser()
}
