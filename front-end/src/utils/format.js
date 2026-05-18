export const fmt = (value) => Number(value ?? 0).toLocaleString('vi-VN')

export const fmtSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

export const fmtDate = (value) =>
  value ? new Date(value).toLocaleDateString('vi-VN') : '-'
