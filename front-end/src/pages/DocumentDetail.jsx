import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Link, useNavigate, useParams } from 'react-router-dom'
import pdfWorkerSrc from '../../node_modules/react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs?url'
import Topbar from '../components/Topbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import {
  documentAPI,
  downloadDocumentToDevice,
  getDocumentPreviewUrl,
  getDocumentTextPreview,
} from '../api/documents'
import { buildDocumentSummary } from '../utils/documentPresentation'
import { fmt } from '../utils/format'
import '../styles/home.css'
import '../styles/document-detail.css'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc

const IconDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)
const IconBookmark = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)
const IconShare = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)
const IconThumbUp = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
  </svg>
)
const IconThumbDown = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L10.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
  </svg>
)
const IconFlag = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
)
const IconFile = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)
const IconZoomIn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
)
const IconZoomOut = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
)
const IconExpand = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
)

const emptyFeedback = {
  tone: '',
  message: '',
  showLogin: false,
}

const getPreviewKind = (doc) => {
  if (!doc) return 'none'
  const extension = doc.original_name?.split('.').pop()?.toLowerCase()

  if (doc.isTextPreviewable) return 'text'
  if (doc.mime_type?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(extension || '')) return 'image'
  if (doc.mime_type?.startsWith('application/pdf') || extension === 'pdf') return 'pdf'
  return 'unsupported'
}

const getPreviewLabel = (previewKind, doc) => {
  if (previewKind === 'text') return 'Text Preview'
  if (previewKind === 'image') return 'Image Preview'
  if (previewKind === 'pdf') return 'PDF Preview'
  return doc?.fileTypeLabel || 'Preview'
}

const getUnsupportedPreviewMessage = (doc) => {
  const extension = doc?.original_name?.split('.').pop()?.toLowerCase()

  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension || '')) {
    return 'Định dạng Office hiện chưa được hỗ trợ xem trực tiếp. Hãy tải xuống để mở đầy đủ.'
  }

  if (['zip', 'rar', '7z'].includes(extension || '')) {
    return 'Tệp nén không có bản xem trước trực tiếp. Hãy tải xuống để giải nén và kiểm tra.'
  }

  return 'Tài liệu này chưa hỗ trợ xem trực tiếp trên website ở phiên bản hiện tại.'
}

const RelatedDocCard = ({ doc, onClick }) => {
  const ext = (doc.mime_type || '').includes('pdf')
    ? 'PDF'
    : (doc.mime_type || '').includes('image')
      ? 'IMG'
      : 'DOC'

  const likePercent = doc.rating_count > 0
    ? Math.round((doc.rating_average / 5) * 100)
    : null

  return (
    <button className="rd-card" type="button" onClick={onClick}>
      <div className="rd-card__thumb">
        <span className="rd-card__ext">{ext}</span>
        <IconFile />
      </div>
      <div className="rd-card__body">
        {likePercent !== null ? (
          <span className="rd-card__rating">
            <IconThumbUp />
            {likePercent}% {doc.rating_count ? `(${doc.rating_count})` : ''}
          </span>
        ) : null}
        <p className="rd-card__title">{doc.title}</p>
        <p className="rd-card__meta">{doc.subject || doc.department || 'Tài liệu chung'}</p>
        {doc.file_size ? <p className="rd-card__pages">{Math.ceil(doc.file_size / 50000)} trang</p> : null}
      </div>
    </button>
  )
}

const DetailAction = ({ icon, label, meta, className = '', onClick }) => (
  <button className={`dd-action-btn ${className}`.trim()} type="button" onClick={onClick}>
    <span className="dd-action-btn__icon">{icon}</span>
    <span className="dd-action-btn__body">
      <strong>{label}</strong>
      {meta ? <span>{meta}</span> : null}
    </span>
  </button>
)

const DetailInfoRow = ({ label, value }) => (
  <div className="dd-info-row">
    <span className="dd-info-row__label">{label}</span>
    <span className="dd-info-row__value">{value || 'Chưa có'}</span>
  </div>
)

const DocumentDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const viewerRef = useRef(null)
  const pdfPageRefs = useRef([])

  const [document, setDocument] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [textPreview, setTextPreview] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(emptyFeedback)
  const [relatedDocs, setRelatedDocs] = useState([])
  const [zoom, setZoom] = useState(100)
  const [saved, setSaved] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [pdfPageCount, setPdfPageCount] = useState(0)
  const [currentPdfPage, setCurrentPdfPage] = useState(1)
  const [pdfViewportWidth, setPdfViewportWidth] = useState(0)
  const [pdfLoadError, setPdfLoadError] = useState('')

  const previewKind = getPreviewKind(document)
  const previewLabel = getPreviewLabel(previewKind, document)
  const likePercent = document?.ratingCount > 0
    ? Math.round((document.ratingAverage / 5) * 100)
    : null
  const dislikePercent = likePercent !== null ? 100 - likePercent : null
  const estimatedPages = document?.file_size ? Math.max(1, Math.ceil(document.file_size / 50000)) : null
  const visiblePageCount = previewKind === 'pdf' && pdfPageCount > 0 ? pdfPageCount : estimatedPages
  const downloadButtonLabel = isAuthenticated ? 'Tải xuống' : 'Đăng nhập để tải'
  const shouldShowDescriptionToggle = (document?.description?.length || 0) > 180
  const pdfScale = Math.max(0.6, zoom / 100)
  const pdfPageWidth = pdfViewportWidth > 0
    ? Math.max(280, pdfViewportWidth - 8)
    : 820

  const syncCurrentPdfPage = () => {
    if (previewKind !== 'pdf' || !viewerRef.current || pdfPageRefs.current.length === 0) return

    const viewer = viewerRef.current
    const pageNodes = pdfPageRefs.current.filter(Boolean)

    if (pageNodes.length === 0) return

    const viewerRect = viewer.getBoundingClientRect()
    const viewportTop = 0
    const viewportBottom = window.innerHeight
    const readerBandTop = window.innerHeight * 0.22
    const readerBandBottom = window.innerHeight * 0.62
    let nextPage = null
    let maxOverlap = 0

    pageNodes.forEach((pageNode, index) => {
      const pageRect = pageNode.getBoundingClientRect()
      const overlap = Math.max(
        0,
        Math.min(pageRect.bottom, readerBandBottom) - Math.max(pageRect.top, readerBandTop),
      )

      if (overlap > maxOverlap) {
        maxOverlap = overlap
        nextPage = index + 1
      }
    })

    if (nextPage !== null) {
      setCurrentPdfPage((current) => (current === nextPage ? current : nextPage))
      return
    }

    const firstVisibleIndex = pageNodes.findIndex((pageNode) => {
      const pageRect = pageNode.getBoundingClientRect()

      return (
        pageRect.bottom > Math.max(viewerRect.top, viewportTop) + 16 &&
        pageRect.top < Math.min(viewerRect.bottom, viewportBottom) - 16
      )
    })
    const fallbackPage = firstVisibleIndex >= 0 ? firstVisibleIndex + 1 : 1

    setCurrentPdfPage((current) => (current === fallbackPage ? current : fallbackPage))
  }

  useEffect(() => {
    let ignore = false
    setIsLoading(true)
    setError('')
    setFeedback(emptyFeedback)
    setIsDescriptionExpanded(false)

    documentAPI.getDocument(id)
      .then((res) => {
        if (!ignore) setDocument(buildDocumentSummary(res.data))
      })
      .catch((err) => {
        if (!ignore) {
          setDocument(null)
          setError(
            err.response?.data?.detail ||
            err.message ||
            'Không thể tải thông tin tài liệu.',
          )
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [id])

  useEffect(() => {
    if (!document?.id) return undefined

    if (previewKind === 'unsupported') {
      setPreviewUrl('')
      setTextPreview(null)
      setPreviewError('')
      setPdfLoadError('')
      setPdfPageCount(0)
      setCurrentPdfPage(1)
      if (viewerRef.current) viewerRef.current.scrollTop = 0
      setIsPreviewLoading(false)
      return undefined
    }

    let ignore = false
    setIsPreviewLoading(true)
    setPreviewUrl('')
    setTextPreview(null)
    setPreviewError('')
    setPdfLoadError('')
    setPdfPageCount(0)
    setCurrentPdfPage(1)
    setPdfViewportWidth(0)
    if (viewerRef.current) viewerRef.current.scrollTop = 0
    pdfPageRefs.current = []

    const request = previewKind === 'text'
      ? getDocumentTextPreview(document.id).then((content) => {
        if (!ignore) setTextPreview(content)
      })
      : getDocumentPreviewUrl(document.id).then((url) => {
        if (!ignore) setPreviewUrl(url)
      })

    request
      .catch((err) => {
        if (!ignore) {
          setPreviewUrl('')
          setTextPreview(null)
          setPreviewError(
            err.response?.data?.detail ||
            err.message ||
            'Không thể tải bản xem trước lúc này.',
          )
        }
      })
      .finally(() => {
        if (!ignore) setIsPreviewLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [document, previewKind])

  useEffect(() => {
    if (!document?.subject && !document?.department) return undefined

    const term = document.subject || document.department
    let ignore = false

    documentAPI.getRelatedDocuments(term, document.id, 6)
      .then((res) => {
        if (!ignore) setRelatedDocs(res.data || [])
      })
      .catch(() => {
        if (!ignore) setRelatedDocs([])
      })

    return () => {
      ignore = true
    }
  }, [document])

  useEffect(() => {
    if (previewKind !== 'pdf') return undefined

    const syncWidth = () => {
      if (viewerRef.current) {
        setPdfViewportWidth(viewerRef.current.clientWidth)
      }
    }

    syncWidth()

    if (typeof ResizeObserver !== 'undefined' && viewerRef.current) {
      const observer = new ResizeObserver(() => {
        syncWidth()
      })

      observer.observe(viewerRef.current)
      return () => observer.disconnect()
    }

    window.addEventListener('resize', syncWidth)
    return () => window.removeEventListener('resize', syncWidth)
  }, [previewKind])

  useEffect(() => {
    if (previewKind !== 'pdf' || pdfPageCount === 0) return undefined

    const frame = window.requestAnimationFrame(() => {
      syncCurrentPdfPage()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [previewKind, pdfPageCount, pdfPageWidth, pdfScale])

  useEffect(() => {
    if (previewKind !== 'pdf' || pdfPageCount === 0) return undefined

    let frame = 0
    const syncOnPageScroll = () => {
      if (frame) return

      frame = window.requestAnimationFrame(() => {
        frame = 0
        syncCurrentPdfPage()
      })
    }

    window.addEventListener('scroll', syncOnPageScroll, { passive: true })
    window.addEventListener('resize', syncOnPageScroll)

    return () => {
      window.removeEventListener('scroll', syncOnPageScroll)
      window.removeEventListener('resize', syncOnPageScroll)

      if (frame) {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [previewKind, pdfPageCount, pdfPageWidth, pdfScale])

  const requireLogin = (message) => {
    setFeedback({
      tone: 'info',
      message,
      showLogin: true,
    })
  }

  const handleDownload = async () => {
    if (!document?.id) return

    if (!isAuthenticated) {
      requireLogin('Đăng nhập để tải tài liệu đầy đủ về máy.')
      return
    }

    setFeedback(emptyFeedback)
    try {
      await downloadDocumentToDevice(document.id)
    } catch (err) {
      setFeedback({
        tone: 'error',
        message:
          err.response?.data?.detail ||
          err.message ||
          'Không thể tải tài liệu.',
        showLogin: false,
      })
    }
  }

  const handleSave = () => {
    if (!isAuthenticated) {
      requireLogin('Đăng nhập để lưu tài liệu vào thư viện cá nhân.')
      return
    }

    setSaved((current) => !current)
    setFeedback(emptyFeedback)
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setFeedback({
        tone: 'info',
        message: 'Đã sao chép liên kết chia sẻ.',
        showLogin: false,
      })
    } catch {
      setFeedback({
        tone: 'error',
        message: 'Không thể sao chép liên kết. Hãy thử lại.',
        showLogin: false,
      })
    }
  }

  const handleRate = (mode) => {
    if (!isAuthenticated) {
      requireLogin('Đăng nhập để đánh giá tài liệu.')
      return
    }

    setFeedback({
      tone: 'info',
      message: mode === 'up'
        ? 'Luồng đánh giá hữu ích sẽ được hoàn thiện ở bước tiếp theo.'
        : 'Luồng phản hồi chưa hữu ích sẽ được hoàn thiện ở bước tiếp theo.',
      showLogin: false,
    })
  }

  const handleReport = () => {
    if (!isAuthenticated) {
      requireLogin('Đăng nhập để báo cáo tài liệu.')
      return
    }

    setFeedback({
      tone: 'info',
      message: 'Chức năng báo cáo sẽ được hoàn thiện ở bước tiếp theo.',
      showLogin: false,
    })
  }

  const handleExpandPreview = async () => {
    const element = viewerRef.current
    if (!element?.requestFullscreen) return

    try {
      await element.requestFullscreen()
    } catch {
      setFeedback({
        tone: 'error',
        message: 'Không thể mở rộng vùng xem trước lúc này.',
        showLogin: false,
      })
    }
  }

  const handlePdfLoadSuccess = ({ numPages }) => {
    setPdfPageCount(numPages)
    setCurrentPdfPage(1)
    setPdfLoadError('')
    if (viewerRef.current) viewerRef.current.scrollTop = 0
  }

  const handlePdfLoadError = (pdfError) => {
    setPdfPageCount(0)
    setCurrentPdfPage(1)
    setPdfLoadError(
      pdfError?.message ||
      'Không thể hiển thị tệp PDF lúc này.',
    )
  }

  const renderPreviewFallback = () => {
    let title = 'Bản xem trước chưa sẵn sàng'
    let description = 'Hãy tải xuống để mở tài liệu đầy đủ.'

    if (previewKind === 'unsupported') {
      title = 'Định dạng này chưa hỗ trợ xem trực tiếp'
      description = getUnsupportedPreviewMessage(document)
    } else if (previewError || pdfLoadError) {
      title = 'Không thể tải bản xem trước'
      description = previewError || pdfLoadError
    }

    return (
      <div className="dd-viewer-state">
        <div className="dd-viewer-nopreview">
          <div className="dd-nopreview-icon"><IconFile /></div>
          <h3>{title}</h3>
          <p>{description}</p>
          <button className="dd-btn-download" type="button" onClick={handleDownload}>
            <IconDownload />
            {downloadButtonLabel}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dd-page">
      <Topbar />

      {isLoading ? (
        <div className="dd-skeleton-wrap">
          <div className="dd-skeleton-left">
            <div className="dd-skel-line w60" />
            <div className="dd-skel-line w100 tall" />
            <div className="dd-skel-line w80" />
            <div className="dd-skel-line w50" />
            <div className="dd-skel-actions" />
          </div>
          <div className="dd-skeleton-center">
            <div className="dd-skel-toolbar" />
            <div className="dd-skel-viewer" />
          </div>
          <div className="dd-skeleton-right">
            {[1, 2, 3, 4].map((item) => <div key={item} className="dd-skel-rcard" />)}
          </div>
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="dd-error-wrap">
          <div className="dd-error-box">
            <h1>Không tìm thấy tài liệu</h1>
            <p>{error}</p>
            <button className="dd-btn-download" type="button" onClick={() => navigate('/home')}>
              Về trang chủ
            </button>
          </div>
        </div>
      ) : null}

      {!isLoading && document ? (
        <div className="dd-shell">
          <aside className="dd-left">
            <div className="dd-stats-row">
              {likePercent !== null ? (
                <span className="dd-stat-like">
                  <IconThumbUp />
                  {likePercent}% ({document.ratingCount})
                </span>
              ) : null}
              <span className="dd-stat-item">{fmt(document.downloadCount)} lượt xem</span>
              {visiblePageCount ? <span className="dd-stat-item">{visiblePageCount} trang</span> : null}
            </div>

            <h1 className="dd-title">{document.title}</h1>
            <div className="dd-description-block">
              <p className={`dd-description ${isDescriptionExpanded ? 'dd-description--expanded' : ''}`}>
                {document.description}
              </p>
              {shouldShowDescriptionToggle ? (
                <button
                  className="dd-description-toggle"
                  type="button"
                  onClick={() => setIsDescriptionExpanded((current) => !current)}
                >
                  {isDescriptionExpanded ? 'Thu gọn mô tả' : 'Xem mô tả đầy đủ'}
                </button>
              ) : null}
            </div>

            <div className="dd-uploader">
              <span className="dd-uploader__label">Đăng bởi</span>
              <span className="dd-uploader__name">{document.author}</span>
            </div>

            <button className="dd-btn-download dd-btn-download--hero" type="button" onClick={handleDownload}>
              <IconDownload />
              {downloadButtonLabel}
            </button>

            {feedback.message ? (
              <div className={`dd-action-feedback dd-action-feedback--${feedback.tone || 'info'}`}>
                <span>{feedback.message}</span>
                {feedback.showLogin ? (
                  <button className="notice__action" type="button" onClick={() => navigate('/login')}>
                    Đăng nhập
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="dd-action-grid">
              <DetailAction
                icon={<IconBookmark />}
                label={saved ? 'Đã lưu' : 'Lưu'}
                className={saved ? 'dd-action-btn--active' : ''}
                onClick={handleSave}
              />
              <DetailAction
                icon={<IconThumbUp />}
                label={likePercent !== null ? `${likePercent}%` : 'Hữu ích'}
                onClick={() => handleRate('up')}
              />
              <DetailAction
                icon={<IconThumbDown />}
                label={dislikePercent !== null ? `${dislikePercent}%` : 'Chưa ổn'}
                onClick={() => handleRate('down')}
              />
              <DetailAction
                icon={<IconFlag />}
                label="Báo cáo"
                className="dd-action-btn--danger"
                onClick={handleReport}
              />
            </div>

            <section className="dd-info-card">
              <div className="dd-section-head">
                <p>Thông tin tài liệu</p>
                <span>{document.fileTypeLabel}</span>
              </div>
              <DetailInfoRow label="Khoa / ngành" value={document.departmentLabel} />
              <DetailInfoRow label="Môn học" value={document.subjectLabel} />
              {document.teacherLabel ? <DetailInfoRow label="Giảng viên" value={document.teacherLabel} /> : null}
              {document.yearLabel ? <DetailInfoRow label="Năm" value={document.yearLabel} /> : null}
              <DetailInfoRow label="Tên gốc" value={document.original_name || document.title} />
              <DetailInfoRow label="Định dạng" value={document.fileTypeLabel} />
              <DetailInfoRow label="Dung lượng" value={document.sizeLabel} />
            </section>

            <Link className="dd-back-link" to="/home">← Quay lại thư viện</Link>
          </aside>

          <main className="dd-center">
            <div className="dd-viewer-bar">
              <div className="dd-viewer-bar__left">
                <button className="dd-vbar-btn dd-vbar-btn--primary" type="button" onClick={handleDownload}>
                  <IconDownload />
                  {downloadButtonLabel}
                </button>
                <button
                  className={`dd-vbar-btn ${saved ? 'dd-vbar-btn--saved' : ''}`}
                  type="button"
                  onClick={handleSave}
                  aria-label="Lưu tài liệu"
                >
                  <IconBookmark />
                </button>
                <button className="dd-vbar-btn" type="button" aria-label="Chia sẻ" onClick={handleShare}>
                  <IconShare />
                </button>
              </div>
              <div className="dd-viewer-bar__right">
                <span className="dd-preview-chip">{previewLabel}</span>
              </div>
            </div>

            <div className="dd-reader">
              <div className="dd-reader-rail">
                <div className="dd-rail-group dd-rail-group--solo">
                  <button className="dd-rail-btn" type="button" aria-label="Mở rộng bản xem trước" onClick={handleExpandPreview}>
                    <IconExpand />
                  </button>
                </div>

                <div className="dd-rail-divider" aria-hidden="true" />

                <div className="dd-rail-group dd-rail-group--status">
                  {previewKind === 'pdf' && pdfPageCount > 0 ? (
                    <div className="dd-rail-indicator dd-rail-indicator--page">
                      <span className="dd-rail-indicator__value">{currentPdfPage}/{pdfPageCount}</span>
                      <span className="dd-rail-indicator__label">Trang</span>
                    </div>
                  ) : (
                    <div className="dd-rail-indicator dd-rail-indicator--preview">
                      <span className="dd-rail-indicator__value">{previewLabel}</span>
                      <span className="dd-rail-indicator__label">Preview</span>
                    </div>
                  )}
                </div>

                <div className="dd-rail-divider" aria-hidden="true" />

                <div className="dd-rail-group dd-rail-group--zoom">
                  <button className="dd-rail-btn" type="button" aria-label="Thu nhỏ" onClick={() => setZoom((current) => Math.max(50, current - 10))}>
                    <IconZoomOut />
                  </button>
                  <div className="dd-rail-indicator">
                    <span className="dd-rail-indicator__value">{zoom}%</span>
                    <span className="dd-rail-indicator__label">Zoom</span>
                  </div>
                  <button className="dd-rail-btn" type="button" aria-label="Phóng to" onClick={() => setZoom((current) => Math.min(200, current + 10))}>
                    <IconZoomIn />
                  </button>
                </div>
              </div>

              <div
                ref={viewerRef}
                className={`dd-viewer ${previewKind === 'text' ? 'dd-viewer--text' : ''} ${previewKind === 'pdf' ? 'dd-viewer--pdf' : ''}`.trim()}
              >
                {isPreviewLoading ? (
                  <div className="dd-viewer-state">
                    <div>
                      <div className="dd-viewer-spinner" />
                      <p>Đang chuẩn bị bản xem trước...</p>
                    </div>
                  </div>
                ) : null}

                {!isPreviewLoading && previewKind === 'text' && textPreview !== null ? (
                  <div className="dd-text-preview">
                    <pre
                      className="dd-preview-text__content"
                      style={{ fontSize: `${Math.max(12, zoom * 0.16)}px` }}
                    >
                      {textPreview}
                    </pre>
                  </div>
                ) : null}

                {!isPreviewLoading && previewKind === 'image' && previewUrl ? (
                  <div className="dd-paper dd-paper--image">
                    <img
                      className="dd-preview-img"
                      src={previewUrl}
                      alt={document.title}
                      style={{ transform: `scale(${zoom / 100})` }}
                    />
                  </div>
                ) : null}

                {!isPreviewLoading && previewKind === 'pdf' && previewUrl && !pdfLoadError ? (
                  <div className="dd-pdf-stage">
                    <Document
                      className="dd-pdf-document"
                      error=""
                      file={previewUrl}
                      loading={
                        <div className="dd-viewer-state dd-viewer-state--inline">
                          <div>
                            <div className="dd-viewer-spinner" />
                            <p>Đang dựng tài liệu PDF...</p>
                          </div>
                        </div>
                      }
                      onLoadError={handlePdfLoadError}
                      onLoadSuccess={handlePdfLoadSuccess}
                    >
                      {Array.from({ length: pdfPageCount }, (_, index) => (
                        <div
                          key={`pdf-page-${index + 1}`}
                          ref={(node) => {
                            pdfPageRefs.current[index] = node
                          }}
                          className="dd-pdf-page"
                        >
                          <Page
                            className="dd-pdf-page__canvas"
                            loading={null}
                            pageNumber={index + 1}
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                            scale={pdfScale}
                            width={pdfPageWidth}
                          />
                        </div>
                      ))}
                    </Document>
                  </div>
                ) : null}

                {!isPreviewLoading && (
                  previewKind === 'unsupported' ||
                  (previewKind === 'text' && textPreview === null) ||
                  (previewKind === 'pdf' && !!pdfLoadError) ||
                  ((previewKind === 'image' || previewKind === 'pdf') && !previewUrl)
                ) ? renderPreviewFallback() : null}
              </div>
            </div>

            <div className="dd-rating-bar" hidden>
              <p>Tài liệu này có hữu ích không?</p>
              <div className="dd-rating-bar__btns">
                <button className="dd-rate-btn dd-rate-btn--up" type="button" onClick={() => handleRate('up')}>
                  <IconThumbUp />
                  {document.ratingCount > 0 ? `${likePercent}%` : 'Hữu ích'}
                </button>
                <button className="dd-rate-btn dd-rate-btn--down" type="button" onClick={() => handleRate('down')}>
                  <IconThumbDown />
                  {document.ratingCount > 0 ? `${dislikePercent}%` : 'Không hữu ích'}
                </button>
              </div>
            </div>
          </main>

          <aside className="dd-right">
            <div className="dd-right__head">
              <h2 className="dd-right__title">Có thể bạn cũng thích</h2>
              <p>Các tài liệu cùng chủ đề hoặc cùng khoa.</p>
            </div>

            {relatedDocs.length === 0 ? (
              <div className="dd-right__empty">
                <IconFile />
                <p>Chưa có tài liệu liên quan</p>
              </div>
            ) : null}

            <div className="dd-related-list">
              {relatedDocs.map((doc) => (
                <RelatedDocCard
                  key={doc.id}
                  doc={doc}
                  onClick={() => navigate(`/documents/${doc.id}`)}
                />
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      <Footer />
    </div>
  )
}

export default DocumentDetail
