import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Topbar from '../components/Topbar'
import { useAuth } from '../context/AuthContext'
import { documentAPI } from '../api/documents'
import { buildDocumentSummary } from '../utils/documentPresentation'
import { fmt, fmtRelativeDate, fmtSize } from '../utils/format'
import '../styles/documents.css'

const IconOverview = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
const IconUpload = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
const IconDownload = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
const IconBookmark = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
const IconFolder = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
const IconHeart = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>

const TAB_ITEMS = [
  { id: 'overview', label: 'Tổng quan', icon: <IconOverview /> },
  { id: 'uploaded', label: 'Đã tải lên', icon: <IconUpload /> },
  { id: 'downloaded', label: 'Đã tải xuống', icon: <IconDownload /> },
  { id: 'bookmarks', label: 'Bookmark', icon: <IconBookmark /> },
  { id: 'folders', label: 'Thư mục', icon: <IconFolder /> },
  { id: 'liked', label: 'Đã thích', icon: <IconHeart /> },
]

const VALID_TABS = new Set(TAB_ITEMS.map((item) => item.id))

const EMPTY_MESSAGES = {
  uploaded: 'Bạn chưa tải lên tài liệu nào',
  downloaded: 'Bạn chưa tải xuống tài liệu nào',
  bookmarks: 'Bạn chưa lưu bookmark nào',
  folders: 'Bạn chưa có thư mục nào',
  liked: 'Bạn chưa thích tài liệu nào',
}

const STATUS_LABELS = {
  approved: 'Đã duyệt',
  pending: 'Chờ duyệt',
  rejected: 'Từ chối',
}

const ACTIVITY_ICONS = {
  uploaded: <IconUpload />,
  downloaded: <IconDownload />,
  bookmarks: <IconBookmark />,
  liked: <IconHeart />,
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
        'Không thể tải dữ liệu tài liệu của bạn.',
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
              <span>{fmt(document.download_count)} lượt tải</span>
              <span>{fmt(document.like_count)} lượt thích</span>
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
              {expandedRejectId === document.id ? 'Ẩn lý do từ chối' : 'Xem lý do từ chối'}
            </button>
            {expandedRejectId === document.id ? (
              <div className="docs-reject-box">
                <span>Lý do từ chối</span>
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
      window.alert(requestError.response?.data?.detail || 'Không thể tạo thư mục.')
    }
  }

  const removeCourseDocument = async (documentId) => {
    if (!selectedCourseId) return
    try {
      await documentAPI.removeDocumentFromCourse(selectedCourseId, documentId)
      await loadAllData()
    } catch (requestError) {
      window.alert(requestError.response?.data?.detail || 'Không thể gỡ tài liệu khỏi thư mục.')
    }
  }

  const renderOverview = () => (
    <div className="docs-panel-section">
      <section className="docs-stats-grid">
        <article className="docs-stat-card"><strong>{fmt(uploads.length)}</strong><span>Tải lên</span></article>
        <article className="docs-stat-card"><strong>{fmt(downloads.length)}</strong><span>Tải xuống</span></article>
        <article className="docs-stat-card"><strong>{fmt(bookmarks.length)}</strong><span>Bookmark</span></article>
        <article className="docs-stat-card"><strong>{fmt(courses.length)}</strong><span>Thư mục</span></article>
        <article className="docs-stat-card"><strong>{fmt(liked.length)}</strong><span>Đã thích</span></article>
        <article className="docs-stat-card"><strong>{fmt(uploadStats.totalViews)}</strong><span>Lượt tải tài liệu của bạn</span></article>
      </section>

      <section className="docs-section-card">
        <div className="docs-section-head">
          <div>
            <h2>Hoạt động gần đây</h2>
            <p>Tổng hợp các tài liệu bạn vừa tải lên, tải xuống, lưu hoặc thích.</p>
          </div>
        </div>
        {recentActivity.length === 0 ? (
          <EmptyState
            title="Bạn chưa có hoạt động nào"
            message="Hãy tải tài liệu đầu tiên hoặc lưu một tài liệu để bắt đầu."
            actionLabel="Tải tài liệu lên"
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
          <h2>Tài liệu đã tải lên</h2>
          <p>{uploadStats.approved} đã duyệt · {uploadStats.pending} chờ duyệt · {uploadStats.rejected} bị từ chối</p>
        </div>
        <button type="button" className="docs-primary-btn" onClick={() => navigate('/upload')}>
          Tải lên mới
        </button>
      </div>

      {renderTabSearch('Tìm tài liệu đã tải lên...')}

      <div className="docs-filter-row">
        {['all', 'approved', 'pending', 'rejected'].map((status) => (
          <button
            key={status}
            type="button"
            className={`docs-chip${uploadStatusFilter === status ? ' is-active' : ''}`}
            onClick={() => setUploadStatusFilter(status)}
          >
            {status === 'all' ? 'Tất cả' : STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {visibleUploads.length === 0 ? (
        <EmptyState
          title={normalizedSearch ? 'Không tìm thấy tài liệu phù hợp' : EMPTY_MESSAGES.uploaded}
          message={normalizedSearch ? 'Hãy thử thay đổi từ khóa hoặc bộ lọc.' : 'Khi bạn tải tài liệu lên, trạng thái duyệt sẽ hiển thị tại đây.'}
          actionLabel={normalizedSearch ? '' : 'Tải tài liệu lên'}
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
          <h2>Tài liệu đã tải xuống</h2>
          <p>Lịch sử tải xuống của bạn.</p>
        </div>
      </div>
      {renderTabSearch('Tìm trong lịch sử tải xuống...')}
      {visibleDownloads.length === 0 ? (
        <EmptyState
          title={normalizedSearch ? 'Không tìm thấy tài liệu phù hợp' : EMPTY_MESSAGES.downloaded}
          message={normalizedSearch ? 'Hãy thử thay đổi từ khóa.' : 'Những tài liệu bạn tải xuống sẽ xuất hiện tại đây.'}
          actionLabel={normalizedSearch ? '' : 'Khám phá tài liệu'}
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
          <p>Các tài liệu bạn đã lưu để xem lại sau.</p>
        </div>
      </div>
      {renderTabSearch('Tìm bookmark...')}
      {visibleBookmarks.length === 0 ? (
        <EmptyState
          title={normalizedSearch ? 'Không tìm thấy tài liệu phù hợp' : EMPTY_MESSAGES.bookmarks}
          message={normalizedSearch ? 'Hãy thử thay đổi từ khóa.' : 'Khi lưu một tài liệu, bạn sẽ thấy nó ở đây.'}
          actionLabel={normalizedSearch ? '' : 'Khám phá tài liệu'}
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
          <h2>Đã thích</h2>
          <p>Các tài liệu bạn đã đánh dấu thích.</p>
        </div>
      </div>
      {renderTabSearch('Tìm tài liệu đã thích...')}
      {visibleLiked.length === 0 ? (
        <EmptyState
          title={normalizedSearch ? 'Không tìm thấy tài liệu phù hợp' : EMPTY_MESSAGES.liked}
          message={normalizedSearch ? 'Hãy thử thay đổi từ khóa.' : 'Khi thích một tài liệu, bạn sẽ thấy nó ở đây.'}
          actionLabel={normalizedSearch ? '' : 'Khám phá tài liệu'}
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
          <h2>Thư mục</h2>
          <p>Quản lý các thư mục tài liệu cá nhân của bạn.</p>
        </div>
        <button type="button" className="docs-primary-btn" onClick={() => setShowCreateCourse((current) => !current)}>
          {showCreateCourse ? 'Đóng' : 'Tạo thư mục'}
        </button>
      </div>

      {renderTabSearch('Tìm thư mục...')}

      {showCreateCourse ? (
        <form className="docs-create-form" onSubmit={createCourse}>
          <input
            type="text"
            placeholder="Tên thư mục"
            value={courseName}
            onChange={(event) => setCourseName(event.target.value)}
          />
          <input
            type="text"
            placeholder="Mô tả ngắn"
            value={courseDescription}
            onChange={(event) => setCourseDescription(event.target.value)}
          />
          <button type="submit" className="docs-primary-btn">Tạo</button>
        </form>
      ) : null}

      {visibleCourses.length === 0 ? (
        <EmptyState
          title={normalizedSearch ? 'Không tìm thấy thư mục phù hợp' : EMPTY_MESSAGES.folders}
          message={normalizedSearch ? 'Hãy thử thay đổi từ khóa.' : 'Tạo thư mục đầu tiên để nhóm các tài liệu liên quan.'}
          actionLabel={normalizedSearch ? '' : 'Tạo thư mục'}
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
                <p>{course.document_count} tài liệu</p>
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
                <div className="docs-loading">Đang tải nội dung thư mục...</div>
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
                          Gỡ khỏi thư mục
                        </button>
                      ),
                    },
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Thư mục này chưa có tài liệu"
                  message="Bạn có thể thêm tài liệu vào thư mục từ trang chi tiết tài liệu."
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
            <h1>Tài liệu của tôi</h1>
            <p>Quản lý toàn bộ hoạt động tài liệu của bạn</p>
          </div>
        </section>

        <nav className="docs-tabs" aria-label="Tài liệu của tôi">
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

        {isLoading ? <div className="docs-loading">Đang tải dữ liệu...</div> : null}
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
