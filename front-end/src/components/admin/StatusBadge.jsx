const STATUS_MAP = {
  approved: ['badge--approved', 'Đã duyệt'],
  pending:  ['badge--pending',  'Chờ duyệt'],
  rejected: ['badge--rejected', 'Từ chối'],
}

const StatusBadge = ({ status }) => {
  const [cls, label] = STATUS_MAP[status] || ['badge--pending', status]
  return <span className={`badge ${cls}`}>{label}</span>
}

export default StatusBadge
