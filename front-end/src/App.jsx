import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './pages/Home'
import AuthScreen from './pages/AuthScreen'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import MyDocuments from './pages/MyDocuments'
import Account from './pages/Account'
import Upload from './pages/Upload'
import DocumentsCatalog from './pages/DocumentsCatalog'
import DocumentDetail from './pages/DocumentDetail'
import AdminDashboard from './pages/admin/AdminDashboard'

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthScreen />} />
          <Route path="/signup" element={<AuthScreen />} />
          <Route
            path="/home"
            element={<Home />}
          />
          <Route
            path="/my-documents"
            element={
              <ProtectedRoute>
                <MyDocuments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            }
          />
          <Route path="/documents" element={<DocumentsCatalog />} />
          <Route path="/documents/:id" element={<DocumentDetail />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
