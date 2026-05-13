/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { authService } from '../api/auth'

const AuthContext = createContext()

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.detail ||
  error.message ||
  fallback

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const sessionTimerRef = useRef(null)

  useEffect(() => {
    const init = async () => {
      const storedUser = authService.getCurrentUser()
      const token = authService.getToken()

      if (storedUser && token) {
        // Nếu user cũ không có role → fetch lại từ /auth/me
        if (!storedUser.role) {
          try {
            const { default: authAPI } = await import('../api/auth')
            const res = await authAPI.get('/auth/me')
            const freshUser = { ...res.data, name: res.data.username || res.data.name || '' }
            authService.setUser(freshUser)
            setUser(freshUser)
          } catch {
            authService.logout()
            setIsLoading(false)
            return
          }
        } else {
          setUser(storedUser)
        }
        setIsAuthenticated(true)
      } else if (token || storedUser) {
        authService.logout()
      }
      setIsLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (sessionTimerRef.current) {
      window.clearTimeout(sessionTimerRef.current)
      sessionTimerRef.current = null
    }

    if (!isAuthenticated) {
      return undefined
    }

    const expiresAt = authService.getTokenExpiresAt?.()
    if (!expiresAt) {
      authService.logout()
      setUser(null)
      setIsAuthenticated(false)
      return undefined
    }

    const remainingMs = expiresAt - Date.now()
    if (remainingMs <= 0) {
      authService.logout()
      setUser(null)
      setIsAuthenticated(false)
      return undefined
    }

    sessionTimerRef.current = window.setTimeout(() => {
      authService.logout()
      setUser(null)
      setIsAuthenticated(false)
    }, remainingMs)

    return () => {
      if (sessionTimerRef.current) {
        window.clearTimeout(sessionTimerRef.current)
        sessionTimerRef.current = null
      }
    }
  }, [isAuthenticated])

  const login = async (email, password) => {
    setIsLoading(true)
    try {
      const response = await authService.login(email, password)
      const { user, token } = response.data
      authService.setToken(token)
      authService.setUser(user)
      setUser(user)
      setIsAuthenticated(true)
      return { success: true, data: user }
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, 'Đăng nhập thất bại'),
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name, email, password) => {
    setIsLoading(true)
    try {
      const response = await authService.signup(name, email, password)
      const { user, token } = response.data
      authService.setToken(token)
      authService.setUser(user)
      setUser(user)
      setIsAuthenticated(true)
      return { success: true, data: user }
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, 'Đăng ký thất bại'),
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    if (sessionTimerRef.current) {
      window.clearTimeout(sessionTimerRef.current)
      sessionTimerRef.current = null
    }
    setUser(null)
    setIsAuthenticated(false)
  }

  const updateProfile = async (updates) => {
    setIsLoading(true)
    try {
      const response = await authService.updateProfile(updates)
      const updatedUser = response.data.user
      authService.setUser(updatedUser)
      setUser(updatedUser)
      return { success: true, data: updatedUser }
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, 'Cập nhật hồ sơ thất bại'),
      }
    } finally {
      setIsLoading(false)
    }
  }

  const changePassword = async (payload) => {
    setIsLoading(true)
    try {
      const response = await authService.changePassword(payload)
      const updatedUser = response.data.user
      authService.setUser(updatedUser)
      setUser(updatedUser)
      return { success: true, data: updatedUser }
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, 'Đổi mật khẩu thất bại'),
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async (googleToken) => {
    setIsLoading(true)
    try {
      const response = await authService.loginWithGoogle(googleToken)
      const { user, token } = response.data
      authService.setToken(token)
      authService.setUser(user)
      setUser(user)
      setIsAuthenticated(true)
      return { success: true, data: user }
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, 'Đăng nhập Google thất bại'),
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signupWithGoogle = async (googleToken) => {
    setIsLoading(true)
    try {
      const response = await authService.signupWithGoogle(googleToken)
      const { user, token } = response.data
      authService.setToken(token)
      authService.setUser(user)
      setUser(user)
      setIsAuthenticated(true)
      return { success: true, data: user }
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, 'Đăng ký Google thất bại'),
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        signupWithGoogle,
        updateProfile,
        changePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
