export const fmt = (value) => Number(value ?? 0).toLocaleString('vi-VN')

export const fmtSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

export const fmtDate = (value) =>
  value ? new Date(value).toLocaleDateString('vi-VN') : '-'

export const fmtRelativeDate = (value) => {
  if (!value) return '-'

  const target = new Date(value).getTime()
  if (Number.isNaN(target)) return '-'

  const diffMs = target - Date.now()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  const absDays = Math.abs(diffDays)

  if (absDays === 0) return 'Hôm nay'
  if (absDays === 1) return diffDays < 0 ? '1 ngày trước' : 'Ngày mai'
  if (absDays < 7) return diffDays < 0 ? `${absDays} ngày trước` : `${absDays} ngày nữa`

  const diffWeeks = Math.round(absDays / 7)
  if (diffWeeks < 5) return diffDays < 0 ? `${diffWeeks} tuần trước` : `${diffWeeks} tuần nữa`

  const diffMonths = Math.round(absDays / 30)
  if (diffMonths < 12) return diffDays < 0 ? `${diffMonths} tháng trước` : `${diffMonths} tháng nữa`

  const diffYears = Math.round(absDays / 365)
  return diffDays < 0 ? `${diffYears} năm trước` : `${diffYears} năm nữa`
}
