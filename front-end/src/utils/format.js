/* ── Số / kích thước / ngày ───────────────────────────────── */
export const fmt = (n) => Number(n ?? 0).toLocaleString('vi-VN')

export const fmtSize = (bytes) => {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—'
