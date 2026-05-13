import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

/**
 * Hook để kiểm tra nếu user chưa đăng nhập, tự động chuyển hướng
 * Hữu ích cho protected pages
 */
export const useRequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  if (!isLoading && !isAuthenticated) {
    navigate('/login', { replace: true })
  }

  return { isLoading, isAuthenticated }
}

/**
 * Hook để lấy user hiện tại
 */
export const useCurrentUser = () => {
  const { user } = useAuth()
  return user
}

/**
 * Hook để logout
 */
export const useLogout = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return handleLogout
}

/**
 * Hook để kiểm tra nếu user đã đăng nhập
 */
export const useIsAuthenticated = () => {
  const { isAuthenticated, isLoading } = useAuth()
  return { isAuthenticated, isLoading }
}
