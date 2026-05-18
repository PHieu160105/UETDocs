import { IconClock, IconDownload } from './HomeIcons'

const getFileToneClass = (fileTypeLabel = '') => {
  const normalized = fileTypeLabel.toUpperCase()

  if (normalized === 'PDF') return 'doc-card__file-badge--red'
  if (normalized === 'PPT' || normalized === 'PPTX') return 'doc-card__file-badge--orange'
  if (normalized === 'ZIP' || normalized === 'RAR' || normalized === '7Z') return 'doc-card__file-badge--amber'
  if (normalized === 'IMG') return 'doc-card__file-badge--cyan'
  if (normalized === 'DOC' || normalized === 'DOCX' || normalized === 'TXT') return 'doc-card__file-badge--blue'
  return 'doc-card__file-badge--emerald'
}

const DocumentCard = ({
  title,
  departmentLabel,
  fileTypeLabel,
  updatedLabel,
  downloadsLabel,
  onOpen,
}) => (
  <button className="doc-card" type="button" onClick={onOpen}>
    <div className="doc-card__top">
      <span className={`doc-card__file-badge ${getFileToneClass(fileTypeLabel)}`} aria-hidden="true">
        {fileTypeLabel || 'DOC'}
      </span>

      <div className="doc-card__type-copy">
        <span className="doc-card__chip">{fileTypeLabel || 'DOC'}</span>
        <span className="doc-card__type-meta">{departmentLabel || 'Tài liệu chung'}</span>
      </div>
    </div>

    <h3 className="doc-card__title">{title}</h3>

    <div className="doc-card__divider" />

    <div className="doc-card__footer">
      <span className="doc-card__meta-item">
        <IconDownload />
        {downloadsLabel}
      </span>
      <span className="doc-card__meta-item">
        <IconClock />
        {updatedLabel}
      </span>
    </div>
  </button>
)

export default DocumentCard
