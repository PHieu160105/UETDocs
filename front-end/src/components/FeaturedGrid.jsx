const FeaturedGrid = ({ items, title, description, onRead }) => (
  <section id="library" className="library">
    <div className="section-head">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
    <div className="library-grid">
      {items.map((doc) => (
        <div key={doc.id || doc.title} className="library-card">
          <div className="chip">Tep {doc.size}</div>
          <h3>{doc.title}</h3>
          <p className="doc-meta">{doc.author}</p>
          <p className="faculty">{doc.faculty}</p>
          <div className="card-footer">
            <span className="badge subtle">{doc.badge}</span>
            <button className="text-btn" type="button" onClick={() => onRead?.(doc)}>
              Doc ngay
            </button>
          </div>
        </div>
      ))}
    </div>
  </section>
)

export default FeaturedGrid
