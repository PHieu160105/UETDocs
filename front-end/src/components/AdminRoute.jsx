import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#0f1117',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-block', width: '40px', height: '40px',
            border: '3px solid rgba(99,102,241,0.2)', borderRadius: '50%',
            borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ marginTop: '16px', color: '#8b92a5', fontSize: '14px' }}>Đang xác thực...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/home" replace />
  }

  return children
}

export default AdminRoute
