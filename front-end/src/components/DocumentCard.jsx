const DocumentCard = ({ title, author, faculty, size, badge, variant = 'solid' }) => {
  return (
    <article className={`doc-card ${variant === 'ghost' ? 'doc-card--ghost' : ''}`}>
      <div>
        <p className="doc-title">{title}</p>
        <p className="doc-meta">
          {author} · {faculty} · {size}
        </p>
      </div>
      <span className={`badge ${variant === 'ghost' ? 'subtle' : ''}`}>{badge}</span>
    </article>
  )
}

export default DocumentCard
