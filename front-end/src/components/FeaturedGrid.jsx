import DocumentCard from './DocumentCard'
import { IconChevronRight } from './HomeIcons'

const FeaturedGrid = ({
  items,
  title,
  description,
  activeSearch = '',
  activeDepartment = '',
  isLoading = false,
  error = '',
  hasMore = false,
  onViewAll,
  onLoadMore,
  onOpen,
}) => (
  <section id="library" className="home-section">
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {(activeSearch || activeDepartment || hasMore) ? (
        <button className="section-link" type="button" onClick={onViewAll}>
          Xem tất cả
          <IconChevronRight />
        </button>
      ) : null}
    </div>

    {error ? <div className="notice error-message">{error}</div> : null}

    {isLoading ? (
      <div className="featured-grid" aria-label="Đang tải tài liệu">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="doc-card doc-card--skeleton">
            <span />
            <span />
            <span />
          </div>
        ))}
      </div>
    ) : null}

    {!isLoading && items.length > 0 ? (
      <>
        <div className="featured-grid">
          {items.map((doc) => (
            <DocumentCard
              key={doc.id || doc.title}
              {...doc}
              onOpen={() => onOpen?.(doc)}
            />
          ))}
        </div>

        {hasMore ? (
          <div className="featured-grid__more">
            <button className="more-button" type="button" onClick={onLoadMore}>
              Xem thêm tài liệu
              <IconChevronRight />
            </button>
          </div>
        ) : null}
      </>
    ) : null}

    {!isLoading && !error && items.length === 0 ? (
      <div className="empty-state">
        <strong>Không có tài liệu phù hợp</strong>
        <p>Hãy thử đổi từ khóa, bỏ lọc khoa/viện hoặc quay lại thư viện tổng.</p>
      </div>
    ) : null}
  </section>
)

export default FeaturedGrid
