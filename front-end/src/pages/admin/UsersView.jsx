import { useState } from 'react'
import { adminAPI } from '../../api/admin'
import { fmt, fmtDate } from '../../utils/format'
import UserDetailModal from './UserDetailModal'

const UsersView = ({ users, onRefresh, toast }) => {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState(null)
  const PER_PAGE = 15

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const q = search.toLowerCase()
    const matchSearch = !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    return matchRole && matchSearch
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleLock = async (u) => {
    if (!window.confirm(`${u.is_active ? 'Khoá' : 'Mở khoá'} tài khoản "${u.username}"?`)) return
    try {
      u.is_active ? await adminAPI.lockUser(u.id) : await adminAPI.unlockUser(u.id)
      toast(u.is_active ? 'Đã khoá tài khoản' : 'Đã mở khoá tài khoản')
      onRefresh()
    } catch { toast('Thao tác thất bại', 'error') }
  }

  const handleDelete = async (u) => {
    if (!window.confirm(`Xoá tài khoản "${u.username}"? Không thể hoàn tác.`)) return
    try {
      await adminAPI.deleteUser(u.id)
      toast('Đã xoá tài khoản')
      onRefresh()
    } catch { toast('Xoá thất bại', 'error') }
  }

  return (
    <div className="admin-view">
      {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />}

      <div className="admin-panel">
        <div className="admin-panel__head">
          <h2 className="admin-panel__title">Người dùng ({fmt(filtered.length)})</h2>
          <div className="admin-filters">
            <div className="admin-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                placeholder="Tìm username, email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <select className="admin-select" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}>
              <option value="all">Tất cả role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Người dùng</th><th>Email</th><th>Role</th>
              <th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.username}</strong></td>
                <td>{u.email}</td>
                <td><span className={`badge badge--${u.role}`}>{u.role}</span></td>
                <td>
                  <span className={`badge ${u.is_active ? 'badge--active' : 'badge--locked'}`}>
                    {u.is_active ? 'Hoạt động' : 'Bị khoá'}
                  </span>
                </td>
                <td>{fmtDate(u.created_at)}</td>
                <td>
                  <div className="admin-actions">
                    <button className="btn btn--view" onClick={() => setSelectedUser(u)}>👁 Xem</button>
                    <button className={`btn ${u.is_active ? 'btn--lock' : 'btn--unlock'}`} onClick={() => handleLock(u)}>
                      {u.is_active ? '🔒 Khoá' : '🔓 Mở khoá'}
                    </button>
                    {u.role !== 'admin' && (
                      <button className="btn btn--delete" onClick={() => handleDelete(u)}>🗑</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={6}>
                <div className="admin-empty">
                  <div className="admin-empty__icon">👥</div>
                  <div className="admin-empty__text">Không tìm thấy người dùng</div>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>

        <div className="admin-pagination">
          <span className="admin-pagination__info">Trang {page}/{totalPages} · {filtered.length} kết quả</span>
          <div className="admin-pagination__btns">
            <button className="admin-page-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`admin-page-btn${page === p ? ' admin-page-btn--active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="admin-page-btn" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>›</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UsersView
