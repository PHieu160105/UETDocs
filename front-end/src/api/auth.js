import axios from 'axios'
import { mockAuthService } from './mockAuth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true'
const AUTH_PASSWORD_KEY = 'auth_password'
const TOKEN_KEY = 'token'
const USER_KEY = 'user'
const TOKEN_EXPIRES_AT_KEY = 'token_expires_at'
const TOKEN_TTL_MS = 20 * 60 * 1000

const normalizeUser = (user) => {
  if (!user) return null

  return {
    ...user,
    name: user.username || user.name || '',
  }
}

const getTokenExpiresAt = () => {
  const rawValue = localStorage.getItem(TOKEN_EXPIRES_AT_KEY)
  if (!rawValue) return null

  const value = Number(rawValue)
  return Number.isFinite(value) ? value : null
}

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(AUTH_PASSWORD_KEY)
  localStorage.removeItem(TOKEN_EXPIRES_AT_KEY)
}

const ensureValidToken = () => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) {
    clearSession()
    return null
  }

  const expiresAt = getTokenExpiresAt()
  if (!expiresAt || Date.now() >= expiresAt) {
    clearSession()
    return null
  }

  return token
}

const authAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

authAPI.interceptors.request.use(
  (config) => {
    const token = ensureValidToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

authAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

const persistSession = (token, user) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
    if (!localStorage.getItem(TOKEN_EXPIRES_AT_KEY)) {
      localStorage.setItem(
        TOKEN_EXPIRES_AT_KEY,
        String(Date.now() + TOKEN_TTL_MS)
      )
    }
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(normalizeUser(user)))
  }
}

const fetchCurrentUser = async () => {
  const response = await authAPI.get('/auth/me')
  return normalizeUser(response.data)
}

const realAuthService = {
  login: async (identifier, password) => {
    const payload = identifier?.includes('@')
      ? { email: identifier, password }
      : { username: identifier, password }

    const response = await authAPI.post('/auth/login', payload)
    const token = response.data?.access_token

    if (!token) {
      throw new Error('Backend did not return access_token')
    }

    persistSession(token)
    const user = await fetchCurrentUser()
    persistSession(token, user)
    localStorage.setItem(AUTH_PASSWORD_KEY, password)

    return {
      data: {
        user,
        token,
      },
    }
  },

  signup: async (name, email, password) => {
    await authAPI.post('/auth/signup', {
      username: name,
      email,
      password,
    })
    const response = await realAuthService.login(name, password)
    localStorage.setItem(AUTH_PASSWORD_KEY, password)
    return response
  },

  loginWithGoogle: (googleToken) =>
    authAPI.post('/auth/google', { token: googleToken }),

  signupWithGoogle: (googleToken) =>
    authAPI.post('/auth/google/signup', { token: googleToken }),

  logout: () => {
    clearSession()
  },

  getCurrentUser: () => {
    if (!ensureValidToken()) return null
    const user = localStorage.getItem(USER_KEY)
    return user ? normalizeUser(JSON.parse(user)) : null
  },

  setToken: (token) => {
    if (!token) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(TOKEN_EXPIRES_AT_KEY)
      return
    }

    persistSession(token)
  },

  setUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(normalizeUser(user)))
  },

  getToken: () => ensureValidToken(),

  getTokenExpiresAt: () => getTokenExpiresAt(),

  updateProfile: async ({ name }) => {
    const currentUser = realAuthService.getCurrentUser()
    if (!currentUser) {
      throw {
        response: {
          data: {
            message: 'Không tìm thấy tài khoản hiện tại',
          },
        },
      }
    }

    const updatedUser = { ...currentUser, name, username: currentUser.username || name }
    realAuthService.setUser(updatedUser)
    return {
      data: {
        user: updatedUser,
      },
    }
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    const storedPassword = localStorage.getItem(AUTH_PASSWORD_KEY)

    if (!storedPassword) {
      throw {
        response: {
          data: {
            message: 'Không có dữ liệu mật khẩu để xác minh trong chế độ này',
          },
        },
      }
    }

    if (storedPassword !== currentPassword) {
      throw {
        response: {
          data: {
            message: 'Mật khẩu hiện tại không đúng',
          },
        },
      }
    }

    localStorage.setItem(AUTH_PASSWORD_KEY, newPassword)
    return {
      data: {
        user: realAuthService.getCurrentUser(),
      },
    }
  },
}

export const authService = USE_MOCK_AUTH ? mockAuthService : realAuthService
export { USE_MOCK_AUTH }

export default authAPI
