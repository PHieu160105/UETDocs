const MOCK_USERS_KEY = 'mock_auth_users'
const MOCK_CURRENT_USER_KEY = 'mock_auth_current_user'
const MOCK_TOKEN_KEY = 'mock_auth_token'
const MOCK_TOKEN_EXPIRES_AT_KEY = 'mock_auth_token_expires_at'
const MOCK_SEED_VERSION_KEY = 'mock_auth_seed_version'
const SEED_VERSION = '2' // tăng số này khi thay đổi seedUsers
const TOKEN_TTL_MS = 20 * 60 * 1000

const seedUsers = [
  {
    id: 'demo-1',
    name: 'Demo User',
    username: 'Demo User',
    email: 'demo@uetdocs.local',
    password: 'password123',
    role: 'user',
    is_active: true,
  },
  {
    id: 'demo-2',
    name: 'Test Student',
    username: 'Test Student',
    email: 'test@example.com',
    password: 'password123',
    role: 'user',
    is_active: true,
  },
  {
    id: 'admin-1',
    name: 'Admin',
    username: 'admin',
    email: 'admin@uetdocs.local',
    password: 'admin123',
    role: 'admin',
    is_active: true,
  },
]

const readUsers = () => {
  // Reset dữ liệu cũ nếu seed version thay đổi
  const savedVersion = localStorage.getItem(MOCK_SEED_VERSION_KEY)
  if (savedVersion !== SEED_VERSION) {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(seedUsers))
    localStorage.setItem(MOCK_SEED_VERSION_KEY, SEED_VERSION)
    // Xoá session cũ để buộc đăng nhập lại
    localStorage.removeItem(MOCK_CURRENT_USER_KEY)
    localStorage.removeItem(MOCK_TOKEN_KEY)
    localStorage.removeItem(MOCK_TOKEN_EXPIRES_AT_KEY)
    return seedUsers
  }

  const raw = localStorage.getItem(MOCK_USERS_KEY)
  if (!raw) {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(seedUsers))
    return seedUsers
  }

  try {
    const users = JSON.parse(raw)
    return Array.isArray(users) && users.length > 0 ? users : seedUsers
  } catch {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(seedUsers))
    return seedUsers
  }
}

const writeUsers = (users) => {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users))
}

const makeToken = (user) => `mock-token-${user.id}`

const getTokenExpiresAt = () => {
  const rawValue = localStorage.getItem(MOCK_TOKEN_EXPIRES_AT_KEY)
  if (!rawValue) return null

  const value = Number(rawValue)
  return Number.isFinite(value) ? value : null
}

const clearSession = () => {
  localStorage.removeItem(MOCK_CURRENT_USER_KEY)
  localStorage.removeItem(MOCK_TOKEN_KEY)
  localStorage.removeItem(MOCK_TOKEN_EXPIRES_AT_KEY)
}

const ensureValidToken = () => {
  const token = localStorage.getItem(MOCK_TOKEN_KEY)
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

const normalizeUser = (user) => {
  const safeUser = { ...user }
  delete safeUser.password
  return safeUser
}

const getCurrentUser = () => {
  const user = localStorage.getItem(MOCK_CURRENT_USER_KEY)
  return user ? JSON.parse(user) : null
}

const getStoredUserRecord = () => {
  const currentUser = getCurrentUser()
  if (!currentUser) return null

  const users = readUsers()
  return (
    users.find(
      (item) =>
        item.id === currentUser.id ||
        item.email.toLowerCase() === currentUser.email.toLowerCase()
    ) || null
  )
}

const successResponse = (user) => ({
  data: {
    user: normalizeUser(user),
    token: makeToken(user),
  },
})

const fail = (message) => {
  throw {
    response: {
      data: {
        message,
      },
    },
  }
}

export const mockAuthService = {
  login: async (email, password) => {
    const users = readUsers()
    const user = users.find(
      (item) => item.email.toLowerCase() === email.toLowerCase()
    )

    if (!user || user.password !== password) {
      fail('Email hoặc mật khẩu không đúng')
    }

    return successResponse(user)
  },

  signup: async (name, email, password) => {
    const users = readUsers()
    const existingUser = users.find(
      (item) => item.email.toLowerCase() === email.toLowerCase()
    )

    if (existingUser) {
      fail('Email này đã được sử dụng trong mock data')
    }

    const newUser = {
      id: `mock-${Date.now()}`,
      name,
      email,
      password,
    }

    const nextUsers = [...users, newUser]
    writeUsers(nextUsers)

    return successResponse(newUser)
  },

  loginWithGoogle: async () => {
    fail('Google login đang tắt trong mock mode')
  },

  signupWithGoogle: async () => {
    fail('Google signup đang tắt trong mock mode')
  },

  logout: () => {
    clearSession()
  },

  getCurrentUser: () => {
    if (!ensureValidToken()) return null
    return getCurrentUser()
  },

  setToken: (token) => {
    if (!token) {
      localStorage.removeItem(MOCK_TOKEN_KEY)
      localStorage.removeItem(MOCK_TOKEN_EXPIRES_AT_KEY)
      return
    }

    localStorage.setItem(MOCK_TOKEN_KEY, token)
    if (!localStorage.getItem(MOCK_TOKEN_EXPIRES_AT_KEY)) {
      localStorage.setItem(
        MOCK_TOKEN_EXPIRES_AT_KEY,
        String(Date.now() + TOKEN_TTL_MS)
      )
    }
  },

  setUser: (user) => {
    localStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify(user))
  },

  getToken: () => ensureValidToken(),

  getTokenExpiresAt: () => getTokenExpiresAt(),

  updateProfile: async ({ name }) => {
    const currentUser = getCurrentUser()
    const existingUser = getStoredUserRecord()

    if (!currentUser || !existingUser) {
      fail('Không tìm thấy tài khoản hiện tại')
    }

    const nextUser = {
      ...existingUser,
      name,
    }

    const users = readUsers()
    const nextUsers = users.map((item) =>
      item.id === nextUser.id ? nextUser : item
    )

    writeUsers(nextUsers)
    localStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify(normalizeUser(nextUser)))

    return {
      data: {
        user: normalizeUser(nextUser),
      },
    }
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    const currentUser = getCurrentUser()
    const existingUser = getStoredUserRecord()

    if (!currentUser || !existingUser) {
      fail('Không tìm thấy tài khoản hiện tại')
    }

    if (existingUser.password !== currentPassword) {
      fail('Mật khẩu hiện tại không đúng')
    }

    const nextUser = {
      ...existingUser,
      password: newPassword,
    }

    const users = readUsers()
    const nextUsers = users.map((item) =>
      item.id === nextUser.id ? nextUser : item
    )

    writeUsers(nextUsers)
    localStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify(normalizeUser(nextUser)))

    return {
      data: {
        user: normalizeUser(nextUser),
      },
    }
  },
}
