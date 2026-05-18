import { findDepartmentOption, normalizeDepartmentValue } from '../data/departments'
import { fmt, fmtDate, fmtSize } from './format'

export const documentStatusLabels = {
  approved: 'Đã duyệt',
  pending: 'Chờ duyệt',
  rejected: 'Từ chối',
}

const getAuthorName = (uploaderId) => {
  if (!uploaderId) return 'UETDoc'
  return `Người đóng góp #${String(uploaderId).slice(0, 6)}`
}

const getFileTypeLabel = (mimeType, originalName = '') => {
  if (mimeType?.includes('pdf')) return 'PDF'
  if (mimeType?.startsWith('image/')) return 'IMG'
  if (mimeType?.startsWith('text/')) return 'TXT'

  const extension = originalName.split('.').pop()?.toUpperCase()
  return extension || 'DOC'
}

const hasImagePreview = (mimeType, originalName = '') => {
  if (mimeType?.startsWith('image/')) return true

  const extension = originalName.split('.').pop()?.toLowerCase()
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(extension || '')
}

const hasPdfPreview = (mimeType, originalName = '') => {
  if (mimeType?.includes('pdf')) return true

  const extension = originalName.split('.').pop()?.toLowerCase()
  return extension === 'pdf'
}

const isTextPreviewable = (mimeType, originalName = '') => {
  if (mimeType?.startsWith('text/')) return true

  const extension = originalName.split('.').pop()?.toLowerCase()
  return ['txt', 'md', 'csv', 'json', 'log', 'xml', 'yml', 'yaml'].includes(extension || '')
}

export const buildDocumentSummary = (doc) => {
  const ratingAverage = Number(doc?.rating_average ?? 0)
  const ratingCount = Number(doc?.rating_count ?? 0)
  const downloadCount = Number(doc?.download_count ?? 0)
  const departmentLabel = normalizeDepartmentValue(doc?.department || '') || 'Tài liệu chung'
  const subjectLabel = doc?.subject || 'Chưa phân loại'
  const sizeLabel = fmtSize(doc?.file_size)
  const statusLabel = documentStatusLabels[doc?.status] || doc?.status || 'Chưa rõ'
  const departmentOption = findDepartmentOption(doc?.department || '')

  return {
    ...doc,
    id: doc?.id || '',
    title: doc?.title || 'Tài liệu chưa đặt tên',
    description: doc?.description?.trim() || 'Chưa có mô tả cho tài liệu này.',
    author: getAuthorName(doc?.uploader_id),
    faculty: departmentLabel,
    subject: subjectLabel,
    size: sizeLabel,
    badge: statusLabel,
    departmentLabel,
    departmentShortLabel: departmentOption?.shortLabel || departmentLabel,
    departmentAccent: departmentOption?.accent || { start: '#2F72F7', end: '#3E8BFF' },
    subjectLabel,
    sizeLabel,
    statusLabel,
    downloadsLabel: `${fmt(downloadCount)} lượt tải`,
    ratingLabel: ratingCount > 0 ? `${ratingAverage.toFixed(1)}/5` : 'Chưa có đánh giá',
    updatedLabel: fmtDate(doc?.updated_at || doc?.created_at),
    createdLabel: fmtDate(doc?.created_at),
    approvedLabel: fmtDate(doc?.approved_at),
    yearLabel: doc?.year ? String(doc.year) : '',
    teacherLabel: doc?.teacher?.trim() || '',
    fileTypeLabel: getFileTypeLabel(doc?.mime_type, doc?.original_name),
    ratingAverage,
    ratingCount,
    downloadCount,
    isPreviewable:
      hasPdfPreview(doc?.mime_type, doc?.original_name) ||
      hasImagePreview(doc?.mime_type, doc?.original_name) ||
      isTextPreviewable(doc?.mime_type, doc?.original_name),
    isTextPreviewable: isTextPreviewable(doc?.mime_type, doc?.original_name),
  }
}
