import { fmt, fmtDate } from '../../utils/format'
import StatusBadge from '../../components/admin/StatusBadge'

const OverviewView = ({ docs, users }) => {
  const pending = docs.filter((d) => d.status === 'pending').length
  const approved = docs.filter((d) => d.status === 'approved').length
  const totalDownloads = docs.reduce((s, d) => s + (d.download_count || 0), 0)
  const activeUsers = users.filter((u) => u.is_active).length

  const stats = [
    { label: 'Tổng tài liệu',  value: fmt(docs.length),       icon: '📄', color: '#6366f1', sub: `${approved} đã duyệt` },
    { label: 'Chờ duyệt',      value: fmt(pending),            icon: '⏳', color: '#fbbf24', sub: 'Cần xem xét' },
    { label: 'Tổng lượt tải',  value: fmt(totalDownloads),     icon: '⬇️', color: '#22c55e', sub: 'Tất cả tài liệu' },
    { label: 'Người dùng',     value: fmt(users.length),       icon: '👥', color: '#38bdf8', sub: `${activeUsers} đang hoạt động` },
  ]

  const topDocs = [...docs]
    .sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
    .slice(0, 5)

  return (
    <div className="admin-view">
      <div className="admin-stats">
        {stats.map((s) => (
          <div key={s.label} className="admin-stat" style={{ '--stat-color': s.color }}>
            <div className="admin-stat__icon" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
            <div className="admin-stat__value">{s.value}</div>
            <div className="admin-stat__label">{s.label}</div>
            <div className="admin-stat__sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="admin-panel">
        <div className="admin-panel__head">
          <h2 className="admin-panel__title">Top tài liệu được tải nhiều nhất</h2>
        </div>
        <table className="admin-table">
          <thead>
            <tr><th>#</th><th>Tiêu đề</th><th>Môn học</th><th>Lượt tải</th><th>Trạng thái</th></tr>
          </thead>
          <tbody>
            {topDocs.map((d, i) => (
              <tr key={d.id}>
                <td>{i + 1}</td>
                <td><strong>{d.title}</strong><span className="sub">{d.department}</span></td>
                <td>{d.subject}</td>
                <td>{fmt(d.download_count)}</td>
                <td><StatusBadge status={d.status} /></td>
              </tr>
            ))}
            {topDocs.length === 0 && (
              <tr><td colSpan={5}>
                <div className="admin-empty"><div className="admin-empty__text">Chưa có dữ liệu</div></div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default OverviewView
