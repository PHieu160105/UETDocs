import { useEffect, useRef, useState } from 'react'
import Topbar from '../components/Topbar'
import Footer from '../components/Footer'
import { documentAPI, uploadFileToStorage } from '../api/documents'
import '../styles/home.css'
import '../styles/upload.css'

const facultyOptions = [
  'Công nghệ thông tin',
  'Điện tử Viễn thông',
  'Trí tuệ nhân tạo',
  'Kinh tế',
  'Tài liệu chung',
]

const yearOptions = ['2026', '2025', '2024', '2023']

const formatFileSize = (size) => {
  if (!Number.isFinite(size)) return ''
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const getFileMeta = (file) => {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (file.type.startsWith('image/')) {
    return { label: 'IMG', tone: 'upload-file-item--image', isImage: true }
  }

  if (extension === 'pdf') return { label: 'PDF', tone: 'upload-file-item--pdf', isImage: false }
  if (['doc', 'docx'].includes(extension)) return { label: 'DOC', tone: 'upload-file-item--doc', isImage: false }
  if (['xls', 'xlsx'].includes(extension)) return { label: 'XLS', tone: 'upload-file-item--sheet', isImage: false }
  if (['ppt', 'pptx'].includes(extension)) return { label: 'PPT', tone: 'upload-file-item--ppt', isImage: false }
  if (['zip', 'rar', '7z'].includes(extension)) return { label: 'ZIP', tone: 'upload-file-item--archive', isImage: false }

  return {
    label: (extension || 'FILE').slice(0, 4).toUpperCase(),
    tone: 'upload-file-item--generic',
    isImage: false,
  }
}

const createFileItem = (file, index) => {
  const meta = getFileMeta(file)
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
    file,
    previewUrl: meta.isImage ? URL.createObjectURL(file) : null,
    ...meta,
  }
}

const Upload = () => {
  const fileInputRef = useRef(null)
  const fileItemsRef = useRef([])
  const [fileItems, setFileItems] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    documentType: 'Giáo trình',
    faculty: facultyOptions[0],
    subject: '',
    year: yearOptions[0],
    comment: '',
  })

  useEffect(() => {
    return () => {
      fileItemsRef.current.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl)
        }
      })
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || [])
    const nextItems = selectedFiles.map((file, index) => createFileItem(file, index))

    setFileItems((current) => {
      const next = current.length === 0 ? nextItems : [...current, ...nextItems]
      fileItemsRef.current = next
      return next
    })

    event.target.value = ''
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const removeFileAt = (indexToRemove) => {
    setFileItems((current) => {
      const item = current[indexToRemove]
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl)
      }

      const next = current.filter((_, index) => index !== indexToRemove)
      fileItemsRef.current = next
      return next
    })
  }

  const buildDocumentTitle = (file, index) => {
    const baseTitle = formData.title.trim() || formData.subject.trim() || file.name.replace(/\.[^.]+$/, '')
    return fileItems.length > 1 ? `${baseTitle} ${index + 1}` : baseTitle
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    setSubmitSuccess('')

    if (fileItems.length === 0) {
      setSubmitError('Vui lòng chọn ít nhất một tệp để tải lên.')
      return
    }

    if (!formData.subject.trim()) {
      setSubmitError('Vui lòng nhập tên môn học hoặc chủ đề.')
      return
    }

    setIsSubmitting(true)
    try {
      for (const [index, item] of fileItems.entries()) {
        const uploadRes = await documentAPI.createUploadUrl({
          original_filename: item.file.name,
          folder: 'documents',
          expired_minutes: 10,
        })

        await uploadFileToStorage(uploadRes.data.upload_url, item.file)

        await documentAPI.registerDocument({
          title: buildDocumentTitle(item.file, index),
          description: formData.comment.trim() || null,
          file_key: uploadRes.data.object_key,
          original_name: item.file.name,
          file_size: item.file.size,
          mime_type: item.file.type || null,
          department: formData.faculty,
          subject: formData.subject.trim(),
          year: Number(formData.year),
          teacher: null,
          note: formData.comment.trim() || null,
        })
      }

      setSubmitSuccess('Tải lên thành công. Tài liệu sẽ hiển thị sau khi được duyệt.')
      setFormData({
        title: '',
        documentType: 'Giáo trình',
        faculty: facultyOptions[0],
        subject: '',
        year: yearOptions[0],
        comment: '',
      })

      fileItemsRef.current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      })
      fileItemsRef.current = []
      setFileItems([])
    } catch (error) {
      setSubmitError(error.response?.data?.detail || error.message || 'Không thể tải lên tài liệu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page upload-page">
      <Topbar />

      <main className="upload-stage">
        <div className="upload-bg">
          <span className="upload-orb upload-orb--one" />
          <span className="upload-orb upload-orb--two" />
          <span className="upload-orb upload-orb--three" />
          <span className="upload-grid" />
        </div>

        <section className="upload-card">
          <header className="upload-card__header">
            <h1>Gửi tài liệu</h1>
            <p>
              Tải lên một hoặc nhiều file. Mỗi file sẽ được upload vào storage private, sau đó tạo record
              tài liệu ở trạng thái pending để admin duyệt.
            </p>
          </header>

          <form className="upload-form" onSubmit={handleSubmit}>
            <label className="upload-field upload-field--full">
              <span>Tải tệp tài liệu lên</span>
              <p className="upload-field__hint">
                Bạn có thể tải lên nhiều đuôi tệp như .jpg, .png, .pdf, .docx, .xlsx, .pptx, .zip.
              </p>
              <div
                className="upload-dropzone"
                onClick={openFilePicker}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    openFilePicker()
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  aria-label="Chọn tệp tài liệu"
                />

                {fileItems.length > 0 ? (
                  <div className="upload-file-list">
                    {fileItems.map((item, index) => (
                      <div key={item.id} className={`upload-file-item ${item.tone}`}>
                        <button
                          className="upload-file-item__remove"
                          type="button"
                          aria-label={`Xóa ${item.file.name}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            removeFileAt(index)
                          }}
                        >
                          ×
                        </button>

                        {item.isImage ? (
                          <img
                            className="upload-file-item__thumb"
                            src={item.previewUrl}
                            alt={item.file.name}
                            loading="lazy"
                          />
                        ) : (
                          <div className="upload-file-item__icon" aria-hidden="true">
                            {item.label}
                          </div>
                        )}

                        <div className="upload-file-item__meta">
                          <strong title={item.file.name}>{item.file.name}</strong>
                          <span>{formatFileSize(item.file.size)}</span>
                        </div>
                      </div>
                    ))}
                    <button
                      className="upload-file-list__add"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        openFilePicker()
                      }}
                    >
                      + Tải thêm tệp
                    </button>
                  </div>
                ) : (
                  <div className="upload-dropzone__empty">
                    <strong>Dán hoặc kéo tệp vào đây</strong>
                    <p>Kéo thả hoặc bấm để chọn ảnh, PDF, DOCX, XLSX, PPTX, ZIP, và nhiều loại file khác.</p>
                    <button className="upload-file-list__add" type="button" onClick={openFilePicker}>
                      + Chọn tệp
                    </button>
                  </div>
                )}
              </div>
            </label>

            <label className="upload-field upload-field--full">
              <span>Tiêu đề tài liệu</span>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ví dụ: Cấu trúc dữ liệu - Bài giảng tuần 3"
                type="text"
              />
            </label>

            <div className="upload-form__row">
              <label className="upload-field">
                <span>Loại tài liệu</span>
                <select name="documentType" value={formData.documentType} onChange={handleChange}>
                  <option>Giáo trình</option>
                  <option>Slide bài giảng</option>
                  <option>Báo cáo</option>
                  <option>Đề cương</option>
                  <option>Đề thi / luyện tập</option>
                </select>
              </label>

              <label className="upload-field">
                <span>Khoa / viện</span>
                <select name="faculty" value={formData.faculty} onChange={handleChange}>
                  {facultyOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="upload-field">
              <span>Tên tài liệu, môn học</span>
              <input
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Ví dụ: Cấu trúc dữ liệu - Chương 3"
                type="text"
              />
            </label>

            <label className="upload-field">
              <span>Năm học</span>
              <select name="year" value={formData.year} onChange={handleChange}>
                {yearOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="upload-field upload-field--full">
              <span>Ghi chú</span>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                placeholder="Ghi chú thêm về nội dung, điểm cần chú ý cho người duyệt"
                rows="4"
              />
            </label>

            {submitError && <div style={{ color: '#f87171', fontSize: 14 }}>{submitError}</div>}
            {submitSuccess && <div style={{ color: '#34d399', fontSize: 14 }}>{submitSuccess}</div>}

            <div className="upload-form__footer">
              <button className="upload-submit" type="submit" disabled={isSubmitting || fileItems.length === 0}>
                {isSubmitting ? 'Đang gửi...' : 'Gửi'}
              </button>
            </div>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Upload
