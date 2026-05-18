import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Footer from '../components/Footer'
import DocumentCard from '../components/DocumentCard'
import { documentAPI } from '../api/documents'
import { departmentOptions, normalizeDepartmentValue } from '../data/departments'
import { buildDocumentSummary } from '../utils/documentPresentation'
import { IconChevronRight, IconSearch } from '../components/HomeIcons'
import '../styles/home.css'
import '../styles/documents-catalog.css'

const PAGE_SIZE = 10
const MAX_VISIBLE_PAGES = 5
const DEFAULT_SORT = 'newest'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'downloads', label: 'Được tải nhiều nhất' },
  { value: 'rating', label: 'Được thích nhiều nhất' },
]

const FILTER_DEPARTMENTS = departmentOptions.filter((option) => option.shortLabel !== 'ALL')

const IconFilter = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="17" x2="20" y2="17" />
    <circle cx="9" cy="7" r="2.2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="17" r="2.2" fill="currentColor" stroke="none" />
  </svg>
)

const IconChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 6L9 12L15 18" />
  </svg>
)

const sanitizeSort = (value) =>
  SORT_OPTIONS.some((option) => option.value === value) ? value : DEFAULT_SORT

const getPageWindow = (currentPage, totalPages) => {
  const half = Math.floor(MAX_VISIBLE_PAGES / 2)
  let start = Math.max(1, currentPage - half)
  let end = Math.min(totalPages, start + MAX_VISIBLE_PAGES - 1)

  if (end - start + 1 < MAX_VISIBLE_PAGES) {
    start = Math.max(1, end - MAX_VISIBLE_PAGES + 1)
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

const DocumentsCatalog = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const filterRef = useRef(null)
  const [searchValue, setSearchValue] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [documents, setDocuments] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const activeSearch = (searchParams.get('search') || '').trim()
  const activeDepartment = normalizeDepartmentValue(
    searchParams.get('department') || searchParams.get('faculty') || '',
  )
  const activeSort = sanitizeSort((searchParams.get('sort') || DEFAULT_SORT).trim())
  const currentPage = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1)

  useEffect(() => {
    setSearchValue(activeSearch)
  }, [activeSearch])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const updateQuery = useCallback(({
    search = activeSearch,
    department = activeDepartment,
    sort = activeSort,
    page = currentPage,
  }) => {
    const nextParams = new URLSearchParams()
    const trimmedSearch = search.trim()
    const trimmedDepartment = department.trim()
    const safeSort = sanitizeSort(sort)
    const safePage = Math.max(1, Number(page) || 1)

    if (trimmedSearch) nextParams.set('search', trimmedSearch)
    if (trimmedDepartment) nextParams.set('department', trimmedDepartment)
    if (safeSort !== DEFAULT_SORT) nextParams.set('sort', safeSort)
    if (safePage > 1) nextParams.set('page', String(safePage))

    setSearchParams(nextParams)
  }, [activeDepartment, activeSearch, activeSort, currentPage, setSearchParams])

  useEffect(() => {
    let ignore = false

    setIsLoading(true)
    setError('')

    const requestParams = {
      limit: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
      sort: activeSort,
    }

    if (activeSearch) requestParams.search = activeSearch
    if (activeDepartment) requestParams.department = activeDepartment

    documentAPI.getDocuments(requestParams)
      .then((res) => {
        if (ignore) return

        const items = (res.data || []).map(buildDocumentSummary)
        const totalHeader = Number.parseInt(res.headers?.['x-total-count'] || '', 10)

        setDocuments(items)
        setTotalCount(Number.isFinite(totalHeader) ? totalHeader : items.length)
      })
      .catch((requestError) => {
        if (ignore) return

        setDocuments([])
        setTotalCount(0)
        setError(
          requestError.response?.data?.detail ||
            requestError.message ||
            'Không thể tải danh sách tài liệu.',
        )
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [activeDepartment, activeSearch, activeSort, currentPage])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  useEffect(() => {
    if (currentPage <= totalPages) return
    updateQuery({ page: totalPages })
  }, [currentPage, totalPages, updateQuery])

  const pageNumbers = useMemo(
    () => getPageWindow(currentPage, totalPages),
    [currentPage, totalPages],
  )

  const resultHeading = useMemo(() => {
    if (activeSearch && activeDepartment) {
      return `Kết quả cho "${activeSearch}" trong ${activeDepartment}`
    }

    if (activeSearch) {
      return `Kết quả cho "${activeSearch}"`
    }

    if (activeDepartment) {
      return activeDepartment
    }

    return 'Tất cả tài liệu'
  }, [activeDepartment, activeSearch])

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    updateQuery({
      search: searchValue,
      page: 1,
    })
  }

  const handleSortSelect = (sortValue) => {
    updateQuery({ sort: sortValue, page: 1 })
  }

  const handleDepartmentSelect = (department) => {
    updateQuery({ department, page: 1 })
  }

  const clearFilters = () => {
    updateQuery({
      search: activeSearch,
      department: '',
      sort: DEFAULT_SORT,
      page: 1,
    })
  }

  const goToPage = (page) => {
    updateQuery({ page })
    window.requestAnimationFrame(() => {
      document.getElementById('documents-results')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  return (
    <div className="page documents-catalog-page">
      <Topbar />

      <main className="documents-catalog">
        <section className="documents-catalog__hero">
          <div className="documents-catalog__hero-copy">
            <h1>Tìm kiếm tài liệu</h1>
            <p>Tra cứu tài liệu học tập theo từ khóa, khoa viện và độ phổ biến.</p>
          </div>

          <div className="documents-catalog__search-shell" ref={filterRef}>
            <form className="documents-catalog__search-form" onSubmit={handleSearchSubmit}>
              <label className="documents-catalog__search-input">
                <span aria-hidden="true">
                  <IconSearch />
                </span>
                <input
                  type="search"
                  placeholder="Nhập tên tài liệu, mã môn học..."
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                />
              </label>

              <button className="documents-catalog__search-button" type="submit">
                Tìm kiếm
              </button>

              <button
                className={`documents-catalog__filter-button${isFilterOpen ? ' is-active' : ''}`}
                type="button"
                onClick={() => setIsFilterOpen((open) => !open)}
                aria-expanded={isFilterOpen}
              >
                <IconFilter />
              </button>
            </form>

            {isFilterOpen ? (
              <div className="documents-catalog__filter-panel">
                <div className="documents-catalog__filter-group">
                  <div className="documents-catalog__filter-head">
                    <h2>Sắp xếp</h2>
                  </div>
                  <div className="documents-catalog__filter-options">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        className={`documents-catalog__filter-chip${
                          activeSort === option.value ? ' is-selected' : ''
                        }`}
                        type="button"
                        onClick={() => handleSortSelect(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="documents-catalog__filter-group">
                  <div className="documents-catalog__filter-head">
                    <h2>Khoa & Viện</h2>
                    {activeDepartment ? (
                      <button
                        className="documents-catalog__clear-inline"
                        type="button"
                        onClick={() => handleDepartmentSelect('')}
                      >
                        Bỏ chọn
                      </button>
                    ) : null}
                  </div>

                  <div className="documents-catalog__department-list">
                    {FILTER_DEPARTMENTS.map((option) => (
                      <button
                        key={option.label}
                        className={`documents-catalog__department-option${
                          activeDepartment === option.label ? ' is-selected' : ''
                        }`}
                        type="button"
                        onClick={() => handleDepartmentSelect(option.label)}
                      >
                        <strong>{option.label}</strong>
                        <span>{option.shortLabel}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="documents-catalog__filter-actions">
                  <button className="documents-catalog__ghost-action" type="button" onClick={clearFilters}>
                    Xóa lọc
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section id="documents-results" className="documents-catalog__results">
          <div className="documents-catalog__summary">
            <h2>{resultHeading}</h2>
            <p>{totalCount} tài liệu</p>
          </div>

          {error ? <div className="notice error-message">{error}</div> : null}

          {isLoading ? (
            <div className="documents-catalog__grid" aria-label="Đang tải tài liệu">
              {Array.from({ length: PAGE_SIZE }, (_, index) => (
                <div key={index} className="doc-card doc-card--skeleton">
                  <span />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          ) : null}

          {!isLoading && documents.length > 0 ? (
            <>
              <div className="documents-catalog__grid">
                {documents.map((doc) => (
                  <DocumentCard
                    key={doc.id || doc.title}
                    {...doc}
                    onOpen={() => navigate(`/documents/${doc.id}`)}
                  />
                ))}
              </div>

              <div className="documents-catalog__pagination">
                <button
                  className="documents-catalog__page-button"
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <IconChevronLeft />
                </button>

                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    className={`documents-catalog__page-button${
                      page === currentPage ? ' is-active' : ''
                    }`}
                    type="button"
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  className="documents-catalog__page-button"
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <IconChevronRight />
                </button>
              </div>
            </>
          ) : null}

          {!isLoading && !error && documents.length === 0 ? (
            <div className="empty-state">
              <strong>Không có tài liệu phù hợp</strong>
              <p>Hãy thử đổi từ khóa, bỏ lọc khoa viện hoặc quay lại danh sách tổng.</p>
            </div>
          ) : null}
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default DocumentsCatalog
