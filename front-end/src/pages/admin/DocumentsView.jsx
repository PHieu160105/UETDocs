import { useState } from 'react'
import { adminAPI } from '../../api/admin'
import { fmt, fmtDate } from '../../utils/format'
import StatusBadge from '../../components/admin/StatusBadge'
import Modal from '../../components/admin/Modal'

/* ── Reject modal ─────────────────────────────────────────── */
const RejectModal = ({ doc, onConfirm, onClose }) => {
  const [reason, setReason] = useState('')

  return (
    <Modal
      title="Từ chối tài liệu"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Huỷ</button>
          <button className="btn btn--reject" onClick={() => onConfirm(reason)} disabled={!reason.trim()}>
            Xác nhận từ chối
          </button>
        </>
      }
    >
      <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
        Tài liệu: <strong style={{ color: '#f1f5f9' }}>{doc.title}</strong>
      </p>
      <div className="admin-field">
        <label>Lý do từ chối *</label>
        <textarea
          placeholder="Nhập lý do từ chối tài liệu này..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Modal>
  )
}

/* ── Edit document modal ──────────────────────────────────── */
const EditDocModal = ({ doc, onSave, onClose }) => {
  const [form, setForm] = useState({
    title: doc.title,
    department: doc.department,
    subject: doc.subject,
    description: doc.description || '',
    status: doc.status,
  })
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  return (
    <Modal
      title="Chỉnh sửa tài liệu"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Huỷ</button>
          <button className="btn btn--primary" onClick={() => onSave(form)}>Lưu thay đổi</button>
        </>
      }
    >
      <div className="admin-field"><label>Tiêu đề</label><input value={form.title} onChange={set('title')} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="admin-field"><label>Khoa/Bộ môn</label><input value={form.department} onChange={set('department')} /></div>
        <div className="admin-field"><label>Môn học</label><input value={form.subject} onChange={set('subject')} /></div>
      </div>
      <div className="admin-field">
        <label>Trạng thái</label>
        <select value={form.status} onChange={set('status')}>
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Từ chối</option>
        </select>
      </div>
      <div className="admin-field"><label>Mô tả</label><textarea value={form.description} onChange={set('description')} /></div>
    </Modal>
  )
}

/* ── Documents view ───────────────────────────────────────── */
const DocumentsView = ({ docs, onRefresh, toast }) => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [loading, setLoading] = useState(false)
  const PER_PAGE = 15

  const filtered = docs.filter((d) => {
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      d.title.toLowerCase().includes(q) ||
      d.subject.toLowerCase().includes(q) ||
      d.department.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const withLoading = async (fn) => {
    setLoading(true)
    try { await fn() } finally { setLoading(false) }
  }

  const handleApprove = (doc) => withLoading(async () => {
    await adminAPI.approveDocument(doc.id)
    toast('Đã duyệt tài liệu thành công')
    onRefresh()
  })

  const handleReject = (reason) => withLoading(async () => {
    await adminAPI.rejectDocument(rejectTarget.id, reason)
    setRejectTarget(null)
    toast('Đã từ chối tài liệu')
    onRefresh()
  })

  const handleEdit = (form) => withLoading(async () => {
    await adminAPI.updateDocument(editTarget.id, form)
    setEditTarget(null)
    toast('Đã cập nhật tài liệu')
    onRefresh()
  })

  const handleDelete = (doc) => {
    if (!window.confirm(`Xoá tài liệu "${doc.title}"? Không thể hoàn tác.`)) return
    withLoading(async () => {
      await adminAPI.deleteDocument(doc.id)
      toast('Đã xoá tài liệu')
      onRefresh()
    })
  }

  const handleOpenDocument = (doc) => withLoading(async () => {
    const res = await adminAPI.getDocumentAccessUrl(doc.id)
    const url = res.data?.access_url
    if (!url) throw new Error('Missing document URL')
    window.open(url, '_blank', 'noopener,noreferrer')
  })

  return (
    <div className="admin-view">
      {rejectTarget && <RejectModal doc={rejectTarget} onConfirm={handleReject} onClose={() => setRejectTarget(null)} />}
      {editTarget && <EditDocModal doc={editTarget} onSave={handleEdit} onClose={() => setEditTarget(null)} />}

      <div className="admin-panel">
        <div className="admin-panel__head">
          <h2 className="admin-panel__title">Tài liệu ({fmt(filtered.length)})</h2>
          <div className="admin-filters">
            <div className="admin-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                placeholder="Tìm kiếm tiêu đề, môn học..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <select className="admin-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
              <option value="all">Tất cả</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /> Đang xử lý...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tài liệu</th><th>Khoa / Môn</th><th>Dung lượng</th>
                <th>Lượt tải</th><th>Ngày tạo</th><th>Trạng thái</th><th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((doc) => (
                <tr key={doc.id}>
                  <td><strong>{doc.title}</strong><span className="sub">{doc.original_name}</span></td>
                  <td>{doc.department}<span className="sub">{doc.subject}</span></td>
                  <td>{doc.file_size ? (doc.file_size < 1024 ** 2 ? `${(doc.file_size / 1024).toFixed(1)} KB` : `${(doc.file_size / 1024 ** 2).toFixed(1)} MB`) : '—'}</td>
                  <td>{fmt(doc.download_count)}</td>
                  <td>{fmtDate(doc.created_at)}</td>
                  <td><StatusBadge status={doc.status} /></td>
                  <td>
                    <div className="admin-actions">
                      <button className="btn btn--edit" onClick={() => handleOpenDocument(doc)}>Xem</button>
                      {doc.status === 'pending' && <button className="btn btn--approve" onClick={() => handleApprove(doc)}>✓ Duyệt</button>}
                      {doc.status === 'pending' && <button className="btn btn--reject" onClick={() => setRejectTarget(doc)}>✕ Từ chối</button>}
                      <button className="btn btn--edit" onClick={() => setEditTarget(doc)}>✎ Sửa</button>
                      <button className="btn btn--delete" onClick={() => handleDelete(doc)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={7}>
                  <div className="admin-empty">
                    <div className="admin-empty__icon">📂</div>
                    <div className="admin-empty__text">Không tìm thấy tài liệu</div>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        )}

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

export default DocumentsView
