import { useState, useEffect } from 'react'
import { adminAPI } from '../../api/admin'
import { fmtDate } from '../../utils/format'
import StatusBadge from '../../components/admin/StatusBadge'

const renderStars = (score) => {
  const full = Math.floor(score)
  const half = score % 1 >= 0.5
  return (
    <span className="ud-stars">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < full || (i === full && half) ? '#fbbf24' : '#334155' }}>
          {i < full ? '★' : (i === full && half ? '⭐' : '☆')}
        </span>
      ))}
      <span className="ud-stars__val">{score.toFixed(1)}</span>
    </span>
  )
}

const TABS = [
  { id: 'documents', label: 'Tài liệu đã tải', icon: '📄' },
  { id: 'ratings',   label: 'Đánh giá',        icon: '⭐' },
  { id: 'courses',   label: 'Khoá học',         icon: '📚' },
]

const UserDetailModal = ({ user, onClose }) => {
  const [tab, setTab] = useState('documents')
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    adminAPI.getUserActivity(user.id)
      .then((res) => setActivity(res.data))
      .catch(() => setError('Không thể tải dữ liệu hoạt động'))
      .finally(() => setLoading(false))
  }, [user.id])

  const countFor = (id) => {
    if (!activity) return null
    if (id === 'documents') return activity.documents.length
    if (id === 'ratings')   return activity.ratings.length
    return activity.courses.length
  }

  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal admin-modal--wide">

        {/* Header */}
        <div className="admin-modal__head">
          <div className="ud-header">
            <div className="ud-avatar">{(user.username || 'U').charAt(0).toUpperCase()}</div>
            <div>
              <h3 className="admin-modal__title">{user.username}</h3>
              <span className="ud-email">{user.email}</span>
            </div>
            <span className={`badge badge--${user.role}`} style={{ marginLeft: 'auto' }}>{user.role}</span>
            <span className={`badge ${user.is_active ? 'badge--active' : 'badge--locked'}`}>
              {user.is_active ? 'Hoạt động' : 'Bị khoá'}
            </span>
          </div>
          <button className="admin-modal__close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="ud-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`ud-tab${tab === t.id ? ' ud-tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon} {t.label}
              {!loading && activity && (
                <span className="ud-tab__count">{countFor(t.id)}</span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="admin-modal__body ud-body">
          {loading && <div className="admin-loading"><div className="admin-spinner" /> Đang tải...</div>}
          {error && (
            <div className="admin-empty">
              <div className="admin-empty__icon">⚠️</div>
              <div className="admin-empty__text">{error}</div>
            </div>
          )}

          {!loading && !error && activity && (
            <>
              {/* Documents tab */}
              {tab === 'documents' && (
                activity.documents.length === 0
                  ? <div className="admin-empty"><div className="admin-empty__icon">📂</div><div className="admin-empty__text">Chưa tải tài liệu nào</div></div>
                  : <table className="admin-table">
                      <thead>
                        <tr><th>Tiêu đề</th><th>Khoa / Môn</th><th>Trạng thái</th><th>Lượt tải</th><th>Đánh giá</th><th>Ngày tạo</th></tr>
                      </thead>
                      <tbody>
                        {activity.documents.map((d) => (
                          <tr key={d.id}>
                            <td><strong>{d.title}</strong></td>
                            <td>{d.department}<span className="sub">{d.subject}</span></td>
                            <td><StatusBadge status={d.status} /></td>
                            <td>{d.download_count}</td>
                            <td>
                              {d.rating_count > 0
                                ? <>{renderStars(d.rating_average)} <span className="sub">{d.rating_count} lượt</span></>
                                : <span style={{ color: '#475569' }}>—</span>}
                            </td>
                            <td>{fmtDate(d.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
              )}

              {/* Ratings tab */}
              {tab === 'ratings' && (
                activity.ratings.length === 0
                  ? <div className="admin-empty"><div className="admin-empty__icon">⭐</div><div className="admin-empty__text">Chưa đánh giá tài liệu nào</div></div>
                  : <table className="admin-table">
                      <thead>
                        <tr><th>Tài liệu</th><th>Điểm đánh giá</th><th>Ngày đánh giá</th></tr>
                      </thead>
                      <tbody>
                        {activity.ratings.map((r) => (
                          <tr key={r.id}>
                            <td><strong>{r.document_title}</strong></td>
                            <td>{renderStars(r.score)}</td>
                            <td>{fmtDate(r.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
              )}

              {/* Courses tab */}
              {tab === 'courses' && (
                activity.courses.length === 0
                  ? <div className="admin-empty"><div className="admin-empty__icon">📚</div><div className="admin-empty__text">Chưa tạo khoá học nào</div></div>
                  : <table className="admin-table">
                      <thead>
                        <tr><th>Tên khoá học</th><th>Mô tả</th><th>Ngày tạo</th></tr>
                      </thead>
                      <tbody>
                        {activity.courses.map((c) => (
                          <tr key={c.id}>
                            <td><strong>{c.name}</strong></td>
                            <td style={{ color: '#64748b', maxWidth: 260 }}>{c.description || '—'}</td>
                            <td>{fmtDate(c.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserDetailModal
