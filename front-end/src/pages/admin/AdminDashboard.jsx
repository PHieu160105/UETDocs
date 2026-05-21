import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { adminAPI } from '../../api/admin'
import { useToast, ToastList } from '../../components/admin/Modal'
import OverviewView  from './OverviewView'
import DocumentsView from './DocumentsView'
import UsersView     from './UsersView'
import '../../styles/admin.css'

/* ── Sidebar nav config ───────────────────────────────────── */
const NAV = [
  {
    id: 'overview',
    label: 'Tổng quan',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    id: 'documents',
    label: 'Tài liệu',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
  {
    id: 'users',
    label: 'Người dùng',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
]

const TAB_TITLES = {
  overview:  'Tổng quan',
  documents: 'Quản lý tài liệu',
  users:     'Quản lý người dùng',
}

/* ── Main layout ──────────────────────────────────────────── */
const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { toasts, push: toast } = useToast()

  const [activeTab, setActiveTab] = useState('overview')
  const [docs,  setDocs]  = useState([])
  const [users, setUsers] = useState([])
  const [loadingDocs,  setLoadingDocs]  = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)

  const pendingCount = docs.filter((d) => d.status === 'pending').length

  const fetchDocs = useCallback(async () => {
    setLoadingDocs(true)
    try {
      const res = await adminAPI.getDocuments({ limit: 100 })
      setDocs(res.data || [])
    } catch { toast('Không thể tải danh sách tài liệu', 'error') }
    finally { setLoadingDocs(false) }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true)
    try {
      const res = await adminAPI.getUsers({ limit: 100 })
      setUsers(res.data || [])
    } catch { toast('Không thể tải danh sách người dùng', 'error') }
    finally { setLoadingUsers(false) }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchDocs(); fetchUsers() }, [fetchDocs, fetchUsers])

  const handleLogout = () => { logout(); navigate('/login') }

  const initial = (user?.name || user?.email || 'A').charAt(0).toUpperCase()

  return (
    <div className="admin-page">
      <ToastList toasts={toasts} />

      <div className="admin-shell">
        {/* ── Sidebar ── */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar__brand">
            <div className="admin-sidebar__logo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 6.5C10.5 5 8.5 4 6 4C4.5 4 3.2 4.4 2.5 5V18.5C3.2 17.9 4.5 17.5 6 17.5C8.5 17.5 10.5 18.5 12 20"/>
                <path d="M12 6.5C13.5 5 15.5 4 18 4C19.5 4 20.8 4.4 21.5 5V18.5C20.8 17.9 19.5 17.5 18 17.5C15.5 17.5 13.5 18.5 12 20"/>
                <path d="M12 6.5V20"/>
              </svg>
            </div>
            <div>
              <div className="admin-sidebar__title">UETDocs</div>
              <span className="admin-sidebar__subtitle">Admin Panel</span>
            </div>
          </div>

          <nav className="admin-nav">
            <div className="admin-nav__label">Điều hướng</div>
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`admin-nav__item${activeTab === item.id ? ' admin-nav__item--active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="admin-nav__icon">{item.icon}</span>
                {item.label}
                {item.id === 'documents' && pendingCount > 0 && (
                  <span className="admin-nav__badge">{pendingCount}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="admin-sidebar__footer">
            <button className="admin-nav__item admin-logout-btn" style={{ width: '100%' }} onClick={handleLogout}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Đăng xuất
            </button>
          </div>
        </aside>

        {/* ── Content ── */}
        <div className="admin-content">
          <header className="admin-topbar">
            <h1 className="admin-topbar__title">{TAB_TITLES[activeTab]}</h1>
            <div className="admin-topbar__user">
              <span className="admin-topbar__role">ADMIN</span>
              <div className="admin-topbar__avatar">{initial}</div>
              <span className="admin-topbar__name">{user?.name || user?.email}</span>
            </div>
          </header>

          {(loadingDocs || loadingUsers) ? (
            <div className="admin-loading" style={{ flex: 1 }}>
              <div className="admin-spinner" /> Đang tải dữ liệu...
            </div>
          ) : (
            <>
              {activeTab === 'overview'  && <OverviewView  docs={docs} users={users} />}
              {activeTab === 'documents' && <DocumentsView docs={docs} onRefresh={fetchDocs}  toast={toast} />}
              {activeTab === 'users'     && <UsersView     users={users} onRefresh={fetchUsers} toast={toast} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
