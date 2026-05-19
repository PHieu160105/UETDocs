import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Topbar from '../components/Topbar'
import { useAuth } from '../context/AuthContext'
import { documentAPI } from '../api/documents'
import { buildDocumentSummary } from '../utils/documentPresentation'
import { fmt, fmtRelativeDate, fmtSize } from '../utils/format'
import '../styles/documents.css'

const TAB_ITEMS = [
  { id: 'overview', label: 'Tong quan', icon: '◦' },
  { id: 'uploaded', label: 'Da tai len', icon: '↑' },
  { id: 'downloaded', label: 'Da tai xuong', icon: '↓' },
  { id: 'bookmarks', label: 'Bookmark', icon: '⌑' },
  { id: 'folders', label: 'Thu muc', icon: '□' },
  { id: 'liked', label: 'Da thich', icon: '♡' },
]

const VALID_TABS = new Set(TAB_ITEMS.map((item) => item.id))

const EMPTY_MESSAGES = {
  uploaded: 'Ban chua tai len tai lieu nao',
  downloaded: 'Ban chua tai xuong tai lieu nao',
  bookmarks: 'Ban chua luu bookmark nao',
  folders: 'Ban chua co thu muc nao',
  liked: 'Ban chua thich tai lieu nao',
}

const STATUS_LABELS = {
  approved: 'Da duyet',
  pending: 'Cho duyet',
  rejected: 'Tu choi',
}

const ACTIVITY_ICONS = {
  uploaded: '↑',
  downloaded: '↓',
  bookmarks: '⌑',
  liked: '♡',
}

const sanitizeTab = (value) => (VALID_TABS.has(value) ? value : 'overview')

const EmptyState = ({ title, message, actionLabel, onAction }) => (
  <div className="docs-empty">
    <h3>{title}</h3>
    <p>{message}</p>
    {actionLabel && onAction ? (
      <button type="button" className="docs-primary-btn" onClick={onAction}>
        {actionLabel}
      </button>
    ) : null}
  </div>
)

const MyDocuments = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = sanitizeTab(searchParams.get('tab'))

  const [uploads, setUploads] = useState([])
  const [downloads, setDownloads] = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [courses, setCourses] = useState([])
  const [liked, setLiked] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedCourseDetail, setSelectedCourseDetail] = useState(null)
  const [courseName, setCourseName] = useState('')
  const [courseDescription, setCourseDescription] = useState('')
  const [showCreateCourse, setShowCreateCourse] = useState(false)
  const [uploadStatusFilter, setUploadStatusFilter] = useState('all')
  const [searchValue, setSearchValue] = useState('')
  const [expandedRejectId, setExpandedRejectId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCourseDetailLoading, setIsCourseDetailLoading] = useState(false)
  const [error, setError] = useState('')

  const openDocumentDetail = (documentId) => {
    if (!documentId) return
    navigate(`/documents/${documentId}`)
  }

  const changeTab = (tabId) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', tabId)
    setSearchParams(nextParams)
    setSearchValue('')
  }

  const loadAllData = async () => {
    setIsLoading(true)
    setError('')
    try {
      const [uploadsRes, downloadsRes, bookmarksRes, coursesRes, likedRes] = await Promise.all([
        documentAPI.getMyUploads({ limit: 100 }),
        documentAPI.getMyDownloads({ limit: 100 }),
        documentAPI.getMyBookmarks({ limit: 100 }),
        documentAPI.getMyCourses({ limit: 100 }),
        documentAPI.getMyVotes({ limit: 100, vote: 'like' }),
      ])

      const nextUploads = (uploadsRes.data || []).map(buildDocumentSummary)
      const nextDownloads = (downloadsRes.data || []).map((item) => ({
        ...item,
        document: buildDocumentSummary(item.document),
      }))
      const nextBookmarks = (bookmarksRes.data || []).map((item) => ({
        ...item,
        document: buildDocumentSummary(item.document),
      }))
      const nextCourses = coursesRes.data || []
      const nextLiked = (likedRes.data || []).map((item) => ({
        ...item,
        document: buildDocumentSummary(item.document),
      }))

      setUploads(nextUploads)
      setDownloads(nextDownloads)
      setBookmarks(nextBookmarks)
      setCourses(nextCourses)
      setLiked(nextLiked)
      setSelectedCourseId((current) => (
        nextCourses.some((course) => course.id === current) ? current : (nextCourses[0]?.id || '')
      ))
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
        requestError.message ||
        'Khong the tai du lieu tai lieu cua ban.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!searchParams.get('tab')) {
      const next = new URLSearchParams(searchParams)
      next.set('tab', 'overview')
      setSearchParams(next, { replace: true })
    }
    loadAllData()
  }, [])

  useEffect(() => {
    if (!selectedCourseId) {
      setSelectedCourseDetail(null)
      return undefined
    }

    let ignore = false
    setIsCourseDetailLoading(true)

    documentAPI.getCourseDetail(selectedCourseId)
      .then((response) => {
        if (ignore) return
        setSelectedCourseDetail({
          ...response.data,
          documents: (response.data.documents || []).map((item) => ({
            ...item,
            document: buildDocumentSummary(item.document),
          })),
        })
      })
      .catch(() => {
        if (!ignore) setSelectedCourseDetail(null)
      })
      .finally(() => {
        if (!ignore) setIsCourseDetailLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [selectedCourseId, courses])

  const normalizedSearch = searchValue.trim().toLowerCase()

  const uploadStats = useMemo(() => {
    const approved = uploads.filter((item) => item.status === 'approved').length
    const pending = uploads.filter((item) => item.status === 'pending').length
    const rejected = uploads.filter((item) => item.status === 'rejected').length
    const totalViews = uploads.reduce((sum, item) => sum + (item.download_count || 0), 0)
    return { approved, pending, rejected, totalViews }
  }, [uploads])

  const recentActivity = useMemo(() => {
    const items = [
      ...uploads.slice(0, 8).map((item) => ({
        id: `upload:${item.id}`,
        type: 'uploaded',
        documentId: item.id,
        title: item.title,
        detail: STATUS_LABELS[item.status] || item.status,
        time: item.created_at,
      })),
      ...downloads.slice(0, 8).map((item) => ({
        id: `download:${item.document.id}`,
        type: 'downloaded',
        documentId: item.document.id,
        title: item.document.title,
        detail: item.document.subject,
        time: item.last_downloaded_at,
      })),
      ...bookmarks.slice(0, 8).map((item) => ({
        id: `bookmark:${item.document.id}`,
        type: 'bookmarks',
        documentId: item.document.id,
        title: item.document.title,
        detail: item.document.subject,
        time: item.bookmarked_at,
      })),
      ...liked.slice(0, 8).map((item) => ({
        id: `liked:${item.document.id}`,
        type: 'liked',
        documentId: item.document.id,
        title: item.document.title,
        detail: item.document.subject,
        time: item.updated_at,
      })),
    ]

    return items
      .sort((left, right) => new Date(right.time).getTime() - new Date(left.time).getTime())
      .slice(0, 8)
  }, [uploads, downloads, bookmarks, liked])

  const matchesSearch = (document) => {
    if (!normalizedSearch) return true
    return [
      document.title,
      document.subject,
      document.department,
      document.original_name,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch))
  }

  const visibleUploads = uploads.filter((item) => (
    matchesSearch(item) &&
    (uploadStatusFilter === 'all' || item.status === uploadStatusFilter)
  ))
  const visibleDownloads = downloads.filter((item) => matchesSearch(item.document))
  const visibleBookmarks = bookmarks.filter((item) => matchesSearch(item.document))
  const visibleLiked = liked.filter((item) => matchesSearch(item.document))
  const visibleCourses = courses.filter((course) => (
    !normalizedSearch ||
    String(course.name || '').toLowerCase().includes(normalizedSearch) ||
    String(course.description || '').toLowerCase().includes(normalizedSearch)
  ))
  const activeCourse = courses.find((item) => item.id === selectedCourseId) || null

  const renderDocumentRow = (document, meta, options = {}) => (
    <article key={`${meta.kind}:${document.id}`} className="docs-row">
      <div className="docs-row__main">
        <button
          type="button"
          className="docs-row__summary"
          onClick={() => openDocumentDetail(document.id)}
        >
          <div className="docs-row__file">{document.fileTypeLabel}</div>
          <div className="docs-row__body">
            <div className="docs-row__title-line">
              <strong>{document.title}</strong>
              {options.status ? (
                <span className={`docs-status docs-status--${document.status}`}>
                  {STATUS_LABELS[document.status] || document.status}
                </span>
              ) : null}
            </div>
            <p>{document.subject} · {document.departmentLabel} · {fmtSize(document.file_size)}</p>
            <div className="docs-row__meta">
              <span>{fmt(document.download_count)} luot tai</span>
              <span>{fmt(document.like_count)} luot thich</span>
              <span>{meta.label}</span>
            </div>
          </div>
        </button>
        {options.status && document.status === 'rejected' && document.reject_reason ? (
          <>
            <button
              type="button"
              className="docs-inline-link"
              onClick={() => setExpandedRejectId((current) => (current === document.id ? '' : document.id))}
            >
              {expandedRejectId === document.id ? 'An ly do tu choi' : 'Xem ly do tu choi'}
            </button>
            {expandedRejectId === document.id ? (
              <div className="docs-reject-box">
                <span>Ly do tu choi</span>
                <p>{document.reject_reason}</p>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
      {options.action ? <div className="docs-row__action">{options.action}</div> : null}
    </article>
  )

  const renderTabSearch = (placeholder) => (
    <div className="docs-toolbar">
      <input
        className="docs-search"
        type="search"
        placeholder={placeholder}
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
      />
    </div>
  )

  const createCourse = async (event) => {
    event.preventDefault()
    if (!courseName.trim()) return

    try {
      const created = await documentAPI.createCourse({
        name: courseName.trim(),
        description: courseDescription.trim() || null,
      })
      setCourseName('')
      setCourseDescription('')
      setShowCreateCourse(false)
      setSelectedCourseId(created.data.id)
      await loadAllData()
    } catch (requestError) {
      window.alert(requestError.response?.data?.detail || 'Khong the tao thu muc.')
    }
  }

  const removeCourseDocument = async (documentId) => {
    if (!selectedCourseId) return
    try {
      await documentAPI.removeDocumentFromCourse(selectedCourseId, documentId)
      await loadAllData()
    } catch (requestError) {
      window.alert(requestError.response?.data?.detail || 'Khong the go tai lieu khoi thu muc.')
    }
  }

  const renderOverview = () => (
    <div className="docs-panel-section">
      <section className="docs-stats-grid">
        <article className="docs-stat-card"><strong>{fmt(uploads.length)}</strong><span>Tai len</span></article>
        <article className="docs-stat-card"><strong>{fmt(downloads.length)}</strong><span>Tai xuong</span></article>
        <article className="docs-stat-card"><strong>{fmt(bookmarks.length)}</strong><span>Bookmark</span></article>
        <article className="docs-stat-card"><strong>{fmt(courses.length)}</strong><span>Thu muc</span></article>
        <article className="docs-stat-card"><strong>{fmt(liked.length)}</strong><span>Da thich</span></article>
        <article className="docs-stat-card"><strong>{fmt(uploadStats.totalViews)}</strong><span>Luot tai tai lieu cua ban</span></article>
      </section>

      <section className="docs-section-card">
        <div className="docs-section-head">
          <div>
            <h2>Hoat dong gan day</h2>
            <p>Tong hop cac tai lieu ban vua tai len, tai xuong, luu hoac thich.</p>
          </div>
        </div>
        {recentActivity.length === 0 ? (
          <EmptyState
            title="Ban chua co hoat dong nao"
            message="Hay tai tai lieu dau tien hoac luu mot tai lieu de bat dau."
            actionLabel="Tai tai lieu len"
            onAction={() => navigate('/upload')}
          />
        ) : (
          <div className="docs-activity-list">
            {recentActivity.map((item) => (
              <button
                key={item.id}
                type="button"
                className="docs-activity-row docs-activity-row--button"
                onClick={() => openDocumentDetail(item.documentId)}
              >
                <span className="docs-activity-row__icon">{ACTIVITY_ICONS[item.type] || '•'}</span>
                <div className="docs-activity-row__body">
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <span className="docs-activity-row__time">{fmtRelativeDate(item.time)}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )

  const renderUploads = () => (
    <section className="docs-section-card">
      <div className="docs-section-head">
        <div>
          <h2>Tai lieu da tai len</h2>
          <p>{uploadStats.approved} da duyet · {uploadStats.pending} cho duyet · {uploadStats.rejected} bi tu choi</p>
        </div>
        <button type="button" className="docs-primary-btn" onClick={() => navigate('/upload')}>
          Tai len moi
        </button>
      </div>

      {renderTabSearch('Tim tai lieu da tai len...')}

      <div className="docs-filter-row">
        {['all', 'approved', 'pending', 'rejected'].map((status) => (
          <button
            key={status}
            type="button"
            className={`docs-chip${uploadStatusFilter === status ? ' is-active' : ''}`}
            onClick={() => setUploadStatusFilter(status)}
          >
            {status === 'all' ? 'Tat ca' : STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {visibleUploads.length === 0 ? (
        <EmptyState
          title={normalizedSearch ? 'Khong tim thay tai lieu phu hop' : EMPTY_MESSAGES.uploaded}
          message={normalizedSearch ? 'Hay thu thay doi tu khoa hoac bo loc.' : 'Khi ban tai tai lieu len, trang thai duyet se hien thi tai day.'}
          actionLabel={normalizedSearch ? '' : 'Tai tai lieu len'}
          onAction={normalizedSearch ? null : () => navigate('/upload')}
        />
      ) : (
        <div className="docs-list">
          {visibleUploads.map((document) => renderDocumentRow(
            document,
            { kind: 'upload', label: fmtRelativeDate(document.created_at) },
            { status: true },
          ))}
        </div>
      )}
    </section>
  )

  const renderDownloads = () => (
    <section className="docs-section-card">
      <div className="docs-section-head">
        <div>
          <h2>Tai lieu da tai xuong</h2>
          <p>Lich su tai xuong cua ban.</p>
        </div>
      </div>
      {renderTabSearch('Tim trong lich su tai xuong...')}
      {visibleDownloads.length === 0 ? (
        <EmptyState
          title={normalizedSearch ? 'Khong tim thay tai lieu phu hop' : EMPTY_MESSAGES.downloaded}
          message={normalizedSearch ? 'Hay thu thay doi tu khoa.' : 'Nhung tai lieu ban tai xuong se xuat hien tai day.'}
          actionLabel={normalizedSearch ? '' : 'Kham pha tai lieu'}
          onAction={normalizedSearch ? null : () => navigate('/documents')}
        />
      ) : (
        <div className="docs-list">
          {visibleDownloads.map((item) => renderDocumentRow(
            item.document,
            { kind: 'download', label: fmtRelativeDate(item.last_downloaded_at) },
          ))}
        </div>
      )}
    </section>
  )

  const renderBookmarks = () => (
    <section className="docs-section-card">
      <div className="docs-section-head">
        <div>
          <h2>Bookmark</h2>
          <p>Cac tai lieu ban da luu de xem lai sau.</p>
        </div>
      </div>
      {renderTabSearch('Tim bookmark...')}
      {visibleBookmarks.length === 0 ? (
        <EmptyState
          title={normalizedSearch ? 'Khong tim thay tai lieu phu hop' : EMPTY_MESSAGES.bookmarks}
          message={normalizedSearch ? 'Hay thu thay doi tu khoa.' : 'Khi luu mot tai lieu, ban se thay no o day.'}
          actionLabel={normalizedSearch ? '' : 'Kham pha tai lieu'}
          onAction={normalizedSearch ? null : () => navigate('/documents')}
        />
      ) : (
        <div className="docs-list">
          {visibleBookmarks.map((item) => renderDocumentRow(
            item.document,
            { kind: 'bookmark', label: fmtRelativeDate(item.bookmarked_at) },
          ))}
        </div>
      )}
    </section>
  )

  const renderLiked = () => (
    <section className="docs-section-card">
      <div className="docs-section-head">
        <div>
          <h2>Da thich</h2>
          <p>Cac tai lieu ban da danh dau thich.</p>
        </div>
      </div>
      {renderTabSearch('Tim tai lieu da thich...')}
      {visibleLiked.length === 0 ? (
        <EmptyState
          title={normalizedSearch ? 'Khong tim thay tai lieu phu hop' : EMPTY_MESSAGES.liked}
          message={normalizedSearch ? 'Hay thu thay doi tu khoa.' : 'Khi thich mot tai lieu, ban se thay no o day.'}
          actionLabel={normalizedSearch ? '' : 'Kham pha tai lieu'}
          onAction={normalizedSearch ? null : () => navigate('/documents')}
        />
      ) : (
        <div className="docs-list">
          {visibleLiked.map((item) => renderDocumentRow(
            item.document,
            { kind: 'liked', label: fmtRelativeDate(item.updated_at) },
          ))}
        </div>
      )}
    </section>
  )

  const renderFolders = () => (
    <section className="docs-section-card">
      <div className="docs-section-head">
        <div>
          <h2>Thu muc</h2>
          <p>Quan ly cac thu muc tai lieu ca nhan cua ban.</p>
        </div>
        <button type="button" className="docs-primary-btn" onClick={() => setShowCreateCourse((current) => !current)}>
          {showCreateCourse ? 'Dong' : 'Tao thu muc'}
        </button>
      </div>

      {renderTabSearch('Tim thu muc...')}

      {showCreateCourse ? (
        <form className="docs-create-form" onSubmit={createCourse}>
          <input
            type="text"
            placeholder="Ten thu muc"
            value={courseName}
            onChange={(event) => setCourseName(event.target.value)}
          />
          <input
            type="text"
            placeholder="Mo ta ngan"
            value={courseDescription}
            onChange={(event) => setCourseDescription(event.target.value)}
          />
          <button type="submit" className="docs-primary-btn">Tao</button>
        </form>
      ) : null}

      {visibleCourses.length === 0 ? (
        <EmptyState
          title={normalizedSearch ? 'Khong tim thay thu muc phu hop' : EMPTY_MESSAGES.folders}
          message={normalizedSearch ? 'Hay thu thay doi tu khoa.' : 'Tao thu muc dau tien de nhom cac tai lieu lien quan.'}
          actionLabel={normalizedSearch ? '' : 'Tao thu muc'}
          onAction={normalizedSearch ? null : () => setShowCreateCourse(true)}
        />
      ) : (
        <>
          <div className="docs-course-grid">
            {visibleCourses.map((course) => (
              <button
                key={course.id}
                type="button"
                className={`docs-course-card${selectedCourseId === course.id ? ' is-active' : ''}`}
                onClick={() => setSelectedCourseId(course.id)}
              >
                <strong>{course.name}</strong>
                <p>{course.document_count} tai lieu</p>
                <span>{fmtRelativeDate(course.updated_at)}</span>
              </button>
            ))}
          </div>

          {activeCourse ? (
            <div className="docs-course-detail">
              <div className="docs-course-detail__head">
                <div>
                  <h3>{activeCourse.name}</h3>
                  {activeCourse.description ? <p>{activeCourse.description}</p> : null}
                </div>
              </div>
              {isCourseDetailLoading ? (
                <div className="docs-loading">Dang tai noi dung thu muc...</div>
              ) : selectedCourseDetail?.documents?.length ? (
                <div className="docs-list">
                  {selectedCourseDetail.documents.map((item) => renderDocumentRow(
                    item.document,
                    { kind: 'course', label: fmtRelativeDate(item.added_at) },
                    {
                      action: (
                        <button
                          type="button"
                          className="docs-inline-link docs-inline-link--action"
                          onClick={() => removeCourseDocument(item.document.id)}
                        >
                          Go khoi thu muc
                        </button>
                      ),
                    },
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Thu muc nay chua co tai lieu"
                  message="Ban co the them tai lieu vao thu muc tu trang chi tiet tai lieu."
                />
              )}
            </div>
          ) : null}
        </>
      )}
    </section>
  )

  const userInitial = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase()

  return (
    <div className="docs-page">
      <Topbar />
      <main className="docs-main">
        <section className="docs-header">
          <div className="docs-header__avatar">{userInitial}</div>
          <div className="docs-header__copy">
            <h1>Tai lieu cua toi</h1>
            <p>Quan ly toan bo hoat dong tai lieu cua ban</p>
          </div>
        </section>

        <nav className="docs-tabs" aria-label="Tai lieu cua toi">
          {TAB_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`docs-tab${activeTab === item.id ? ' is-active' : ''}`}
              onClick={() => changeTab(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {isLoading ? <div className="docs-loading">Dang tai du lieu...</div> : null}
        {!isLoading && error ? <div className="docs-error">{error}</div> : null}

        {!isLoading && !error ? (
          <div className="docs-content">
            {activeTab === 'overview' ? renderOverview() : null}
            {activeTab === 'uploaded' ? renderUploads() : null}
            {activeTab === 'downloaded' ? renderDownloads() : null}
            {activeTab === 'bookmarks' ? renderBookmarks() : null}
            {activeTab === 'folders' ? renderFolders() : null}
            {activeTab === 'liked' ? renderLiked() : null}
          </div>
        ) : null}
      </main>
    </div>
  )
}

export default MyDocuments
