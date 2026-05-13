import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  downloadedDocuments,
  reviewedDocuments,
  uploadedDocuments,
} from '../data/userDocuments'
import Topbar from '../components/Topbar'
import '../styles/documents.css'

const statusMap = {
  approved: { label: 'Đã duyệt', className: 'is-approved' },
  pending: { label: 'Chờ duyệt', className: 'is-pending' },
  rejected: { label: 'Từ chối', className: 'is-rejected' },
}

const NAV_ITEMS = [
  {
    id: 'overview',
    label: 'Tổng quan',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
    ),
  },
  {
    id: 'uploaded',
    label: 'Đã tải lên',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    ),
  },
  {
    id: 'downloaded',
    label: 'Đã tải xuống',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    ),
  },
  {
    id: 'reviewed',
    label: 'Đánh giá',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    ),
  },
]

const renderStars = (rating) =>
  Array.from({ length: 5 }, (_, index) => (
    <span key={index} className={index < rating ? 'star star--on' : 'star'}>
      ★
    </span>
  ))

/* ─── Sub-views ─────────────────────────────────────────────────────────── */

const OverviewView = ({ uploaded, downloaded, reviewed, user, onNavigate }) => {
  const approvedCount = uploaded.filter((d) => d.status === 'approved').length
  const pendingCount = uploaded.filter((d) => d.status === 'pending').length

  return (
    <div className="view-overview">
      {/* Greeting banner */}
      <div className="overview-banner">
        <div className="overview-banner__left">
          <p className="overview-banner__greeting">Chào mừng trở lại 👋</p>
          <h2 className="overview-banner__name">{user?.name || 'Người dùng'}</h2>
          <p className="overview-banner__sub">
            Bạn có <strong>{pendingCount} tài liệu</strong> đang chờ duyệt và{' '}
            <strong>{approvedCount} tài liệu</strong> đã được phê duyệt.
          </p>
          <div className="overview-banner__actions">
            <button type="button" className="ov-btn ov-btn--primary" onClick={() => onNavigate('uploaded')}>
              <span>↑</span> Xem tài liệu đã tải
            </button>
            <button type="button" className="ov-btn ov-btn--ghost" onClick={() => onNavigate('downloaded')}>
              <span>↓</span> Lịch sử tải xuống
            </button>
          </div>
        </div>
        <div className="overview-banner__illustration" aria-hidden="true">
          <div className="ov-illo">
            <div className="ov-illo__circle" />
            <div className="ov-illo__doc ov-illo__doc--1">📄</div>
            <div className="ov-illo__doc ov-illo__doc--2">📊</div>
            <div className="ov-illo__doc ov-illo__doc--3">📝</div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="overview-stats">
        <div className="overview-stat overview-stat--blue">
          <div className="overview-stat__header">
            <span className="overview-stat__icon">↑</span>
            <span className="overview-stat__trend">+2 tuần này</span>
          </div>
          <span className="overview-stat__value">{uploaded.length}</span>
          <span className="overview-stat__label">Tài liệu đã tải lên</span>
          <div className="overview-stat__bar"><span /></div>
        </div>
        <div className="overview-stat overview-stat--sky">
          <div className="overview-stat__header">
            <span className="overview-stat__icon">↓</span>
            <span className="overview-stat__trend">+1 tuần này</span>
          </div>
          <span className="overview-stat__value">{downloaded.length}</span>
          <span className="overview-stat__label">Tài liệu đã tải xuống</span>
          <div className="overview-stat__bar"><span /></div>
        </div>
        <div className="overview-stat overview-stat--mint">
          <div className="overview-stat__header">
            <span className="overview-stat__icon">★</span>
            <span className="overview-stat__trend">+1 tuần này</span>
          </div>
          <span className="overview-stat__value">{reviewed.length}</span>
          <span className="overview-stat__label">Tài liệu đã đánh giá</span>
          <div className="overview-stat__bar"><span /></div>
        </div>
        <div className="overview-stat overview-stat--amber">
          <div className="overview-stat__header">
            <span className="overview-stat__icon">⏳</span>
            <span className="overview-stat__trend">Đang xử lý</span>
          </div>
          <span className="overview-stat__value">{pendingCount}</span>
          <span className="overview-stat__label">Chờ phê duyệt</span>
          <div className="overview-stat__bar"><span /></div>
        </div>
      </div>

      {/* 2-column recent activity */}
      <div className="overview-grid">
        {/* Recent uploads */}
        <div className="overview-recent">
          <div className="overview-recent__head">
            <div>
              <p className="view-kicker">Tải lên gần đây</p>
              <h3 className="overview-recent__title">Tài liệu của bạn</h3>
            </div>
            <button type="button" className="ov-see-all" onClick={() => onNavigate('uploaded')}>
              Xem tất cả →
            </button>
          </div>
          <div className="overview-list">
            {uploaded.slice(0, 4).map((doc) => {
              const st = statusMap[doc.status]
              return (
                <div key={doc.id} className="overview-row">
                  <div className="overview-row__icon-wrap">
                    <span className="overview-row__icon">📄</span>
                  </div>
                  <div className="overview-row__info">
                    <strong>{doc.title}</strong>
                    <span>{doc.subject}</span>
                  </div>
                  <div className="overview-row__meta">
                    <span className={`status-badge ${st.className}`}>{st.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column: downloaded + reviewed previews */}
        <div className="overview-side">
          {/* Downloaded preview */}
          <div className="overview-mini-panel">
            <div className="overview-recent__head">
              <div>
                <p className="view-kicker" style={{ color: '#0891b2' }}>Tải xuống</p>
                <h3 className="overview-recent__title">Đã truy cập</h3>
              </div>
              <button type="button" className="ov-see-all" onClick={() => onNavigate('downloaded')}>
                Xem tất cả →
              </button>
            </div>
            <div className="overview-mini-list">
              {downloaded.slice(0, 3).map((doc) => (
                <div key={doc.id} className="overview-mini-row">
                  <span className="overview-mini-icon">📥</span>
                  <div className="overview-mini-info">
                    <strong>{doc.title}</strong>
                    <span>{doc.size} · {doc.downloadedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reviewed preview */}
          <div className="overview-mini-panel">
            <div className="overview-recent__head">
              <div>
                <p className="view-kicker" style={{ color: '#059669' }}>Đánh giá</p>
                <h3 className="overview-recent__title">Đã nhận xét</h3>
              </div>
              <button type="button" className="ov-see-all" onClick={() => onNavigate('reviewed')}>
                Xem tất cả →
              </button>
            </div>
            <div className="overview-mini-list">
              {reviewed.slice(0, 2).map((doc) => (
                <div key={doc.id} className="overview-mini-row">
                  <span className="overview-mini-icon">⭐</span>
                  <div className="overview-mini-info">
                    <strong>{doc.title}</strong>
                    <span>{doc.rating}/5 · {doc.reviewedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const UploadedView = () => {
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedRejectId, setExpandedRejectId] = useState(null)

  const visible = useMemo(
    () =>
      uploadedDocuments.filter(
        (doc) => statusFilter === 'all' || doc.status === statusFilter,
      ),
    [statusFilter],
  )

  return (
    <div className="view-section">
      <div className="view-head">
        <div>
          <p className="view-kicker">Tài liệu đã tải lên</p>
          <h2 className="view-title">Giao dịch tài liệu gần đây</h2>
        </div>
        <div className="view-filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="approved">Đã duyệt</option>
            <option value="pending">Chờ duyệt</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>
      </div>

      <div className="documents-table">
        <div className="documents-table__head">
          <span>ID</span>
          <span>Tài liệu</span>
          <span>Môn / nhóm</span>
          <span>Dung lượng</span>
          <span>Thời gian</span>
          <span>Trạng thái</span>
        </div>
        <div className="documents-table__body">
          {visible.map((doc) => {
            const status = statusMap[doc.status]
            const isExpanded = expandedRejectId === doc.id
            return (
              <div key={doc.id} className="documents-row-wrap">
                <article className="documents-row">
                  <span className="documents-row__id">#{doc.id.slice(-3)}</span>
                  <div className="documents-row__title">
                    <strong>{doc.title}</strong>
                    <span>{doc.subject}</span>
                  </div>
                  <span className="documents-row__cell">{doc.subject}</span>
                  <span className="documents-row__cell">{doc.size}</span>
                  <span className="documents-row__cell">{doc.uploadedAt}</span>
                  <div className="documents-row__status">
                    <span className={`status-badge ${status.className}`}>
                      {status.label}
                    </span>
                    {doc.status === 'rejected' && (
                      <button
                        type="button"
                        className="documents-link"
                        onClick={() =>
                          setExpandedRejectId((cur) =>
                            cur === doc.id ? null : doc.id,
                          )
                        }
                      >
                        {isExpanded ? 'Ẩn lý do' : 'Xem lý do'}
                      </button>
                    )}
                  </div>
                </article>
                {doc.status === 'rejected' && isExpanded && (
                  <div className="documents-reason">
                    <p className="documents-reason__label">Lý do từ chối</p>
                    <p>{doc.rejectReason}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const DownloadedView = () => (
  <div className="view-section">
    <div className="view-head">
      <div>
        <p className="view-kicker">Tài liệu đã tải xuống</p>
        <h2 className="view-title">Lịch sử truy cập</h2>
      </div>
      <span className="view-count">{downloadedDocuments.length} mục</span>
    </div>
    <div className="documents-cardlist">
      {downloadedDocuments.map((doc) => (
        <article key={doc.id} className="documents-card">
          <strong>{doc.title}</strong>
          <span>{doc.subject}</span>
          <div className="documents-card__meta">
            <span>{doc.size}</span>
            <span>Đã tải {doc.downloadedAt}</span>
          </div>
        </article>
      ))}
    </div>
  </div>
)

const ReviewedView = () => (
  <div className="view-section">
    <div className="view-head">
      <div>
        <p className="view-kicker">Đánh giá</p>
        <h2 className="view-title">Tài liệu đã đánh giá</h2>
      </div>
      <span className="view-count">{reviewedDocuments.length} mục</span>
    </div>
    <div className="documents-reviewlist">
      {reviewedDocuments.map((doc) => (
        <article key={doc.id} className="documents-review">
          <div className="documents-review__top">
            <div>
              <strong>{doc.title}</strong>
              <span>{doc.subject}</span>
            </div>
            <div className="documents-stars" aria-label={`${doc.rating} sao`}>
              {renderStars(doc.rating)}
            </div>
          </div>
          <p>{doc.note}</p>
          <span className="documents-review__date">Đánh giá ngày {doc.reviewedAt}</span>
        </article>
      ))}
    </div>
  </div>
)

/* ─── Main page ──────────────────────────────────────────────────────────── */

const MyDocuments = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [libExpanded, setLibExpanded] = useState(true)
  const initial = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase()

  const SUBJECTS = ['CTDL & GT', 'Toán cao cấp', 'Hệ điều hành', 'Trí tuệ nhân tạo', 'Cơ sở dữ liệu']

  const renderContent = () => {
    switch (activeTab) {
      case 'uploaded':
        return <UploadedView />
      case 'downloaded':
        return <DownloadedView />
      case 'reviewed':
        return <ReviewedView />
      default:
        return (
          <OverviewView
            uploaded={uploadedDocuments}
            downloaded={downloadedDocuments}
            reviewed={reviewedDocuments}
            user={user}
            onNavigate={setActiveTab}
          />
        )
    }
  }

  return (
    <div className="documents-page">
      <Topbar />

      <main className="documents-shell">
        {/* ─── Sidebar ─── */}
        <aside className="documents-sidebar">

          {/* Profile — circular avatar + name + school */}
          <div className="sb-profile">
            <div className="sb-avatar">{initial}</div>
            <div className="sb-profile__info">
              <strong className="sb-name">{user?.name || 'Người dùng'}</strong>
              <span className="sb-school">UET — ĐHQG Hà Nội</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="sb-stats">
            <div className="sb-stat">
              <strong>{uploadedDocuments.length}</strong>
              <span>Tải lên</span>
            </div>
            <div className="sb-stat">
              <strong>{downloadedDocuments.length}</strong>
              <span>Tải xuống</span>
            </div>
            <div className="sb-stat">
              <strong>{reviewedDocuments.length}</strong>
              <span>Đánh giá</span>
            </div>
          </div>

          {/* Upload CTA — pill style like Studocu */}
          <button
            type="button"
            className="sb-new-btn"
            onClick={() => navigate('/upload')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tải tài liệu lên
          </button>

          {/* Main nav */}
          <nav className="sb-nav" aria-label="Điều hướng tài liệu">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`sb-nav__item${activeTab === item.id ? ' sb-nav__item--active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="sb-nav__icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Library section — collapsible like Studocu */}
          <div className="sb-section">
            <button
              type="button"
              className="sb-section__header"
              onClick={() => setLibExpanded((v) => !v)}
              aria-expanded={libExpanded}
            >
              <span>Thư viện của tôi</span>
              <svg
                className={`sb-section__chevron${libExpanded ? ' sb-section__chevron--open' : ''}`}
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {libExpanded && (
              <div className="sb-section__body">
                {SUBJECTS.map((sub) => (
                  <button key={sub} type="button" className="sb-nav__item sb-nav__item--sub">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    <span>{sub}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

        </aside>

        {/* ─── Content area ─── */}
        <section className="documents-content">
          <div className="documents-panel">
            {renderContent()}
          </div>
        </section>
      </main>
    </div>
  )
}

export default MyDocuments
