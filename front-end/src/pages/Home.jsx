import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Hero from '../components/Hero'
import DepartmentSection from '../components/DepartmentSection'
import FeaturedGrid from '../components/FeaturedGrid'
import CTASection from '../components/CTASection'
import Footer from '../components/Footer'
import { documentAPI } from '../api/documents'
import { normalizeDepartmentValue } from '../data/departments'
import { buildDocumentSummary } from '../utils/documentPresentation'
import '../styles/home.css'

const FETCH_LIMIT = 12
const INITIAL_VISIBLE_COUNT = 6

const Home = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [visibleState, setVisibleState] = useState({
    filterKey: '',
    count: INITIAL_VISIBLE_COUNT,
  })

  const searchQuery = (searchParams.get('search') || '').trim()
  const currentDepartment = normalizeDepartmentValue(
    searchParams.get('department') || searchParams.get('faculty') || '',
  )
  const filterKey = `${currentDepartment}::${searchQuery}`
  const visibleCount = visibleState.filterKey === filterKey
    ? visibleState.count
    : INITIAL_VISIBLE_COUNT

  useEffect(() => {
    const legacyFaculty = searchParams.get('faculty')
    const department = searchParams.get('department')

    if (!legacyFaculty || department) return

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('faculty')

    if (currentDepartment) {
      nextParams.set('department', currentDepartment)
    }

    setSearchParams(nextParams, { replace: true })
  }, [currentDepartment, searchParams, setSearchParams])

  useEffect(() => {
    let ignore = false

    window.requestAnimationFrame(() => {
      if (!ignore) {
        setIsLoading(true)
        setError('')
      }
    })

    const requestParams = { limit: FETCH_LIMIT }

    if (searchQuery) requestParams.search = searchQuery
    if (currentDepartment) requestParams.department = currentDepartment

    documentAPI.getDocuments(requestParams)
      .then((res) => {
        if (!ignore) {
          setDocuments((res.data || []).map(buildDocumentSummary))
        }
      })
      .catch((requestError) => {
        if (!ignore) {
          setDocuments([])
          setError(
            requestError.response?.data?.detail ||
              requestError.message ||
              'Không thể tải danh sách tài liệu.',
          )
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [currentDepartment, searchQuery])

  const previewableCount = useMemo(
    () => documents.filter((doc) => doc.isPreviewable).length,
    [documents],
  )

  const heroStats = useMemo(
    () => [
      {
        icon: 'docs',
        value: String(documents.length),
        label: currentDepartment ? 'Tài liệu phù hợp' : 'Tài liệu đang hiển thị',
      },
      {
        icon: 'preview',
        value: String(previewableCount),
        label: 'Có xem trước',
      },
      {
        icon: 'activity',
        value: currentDepartment || 'Toàn kho',
        label: searchQuery ? `Từ khóa: ${searchQuery}` : 'Bộ lọc hiện tại',
      },
    ],
    [currentDepartment, documents.length, previewableCount, searchQuery],
  )

  const visibleDocuments = documents.slice(0, visibleCount)
  const hasMoreDocuments = documents.length > visibleCount

  const scrollToLibrary = () => {
    window.requestAnimationFrame(() => {
      document.getElementById('library')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  const updateFilters = (
    { search = searchQuery, department = currentDepartment },
    scrollAfterUpdate = false,
  ) => {
    const nextParams = new URLSearchParams()
    const trimmedSearch = search.trim()
    const trimmedDepartment = department.trim()

    if (trimmedSearch) nextParams.set('search', trimmedSearch)
    if (trimmedDepartment) nextParams.set('department', trimmedDepartment)

    setSearchParams(nextParams)

    if (scrollAfterUpdate) {
      scrollToLibrary()
    }
  }

  const handleOpenDocument = (doc) => {
    if (doc.id) navigate(`/documents/${doc.id}`)
  }

  return (
    <div className="page home-page">
      <Topbar />

      <main className="home-shell">
        <Hero
          searchValue={searchQuery}
          stats={heroStats}
          onSearch={(value) => updateFilters({ search: value }, true)}
        />

        <DepartmentSection
          activeDepartment={currentDepartment}
          onSelectDepartment={(department) => navigate(`/documents?department=${encodeURIComponent(department)}`)}
          onViewAll={() => navigate('/documents')}
        />

        <FeaturedGrid
          items={visibleDocuments}
          title="Tài liệu nổi bật"
          description={
            searchQuery || currentDepartment
              ? 'Danh sách bên dưới đang phản ánh đúng bộ lọc hiện tại từ backend.'
              : 'Các tài liệu công khai mới nhất đang có trên hệ thống.'
          }
          activeSearch={searchQuery}
          activeDepartment={currentDepartment}
          isLoading={isLoading}
          error={error}
          hasMore={hasMoreDocuments}
          onViewAll={() => {
            if (searchQuery || currentDepartment) {
              updateFilters({ search: '', department: '' })
              return
            }

            setVisibleState({ filterKey, count: documents.length })
          }}
          onLoadMore={() =>
            setVisibleState({
              filterKey,
              count: visibleCount + INITIAL_VISIBLE_COUNT,
            })}
          onOpen={handleOpenDocument}
        />

        <CTASection />
      </main>

      <Footer />
    </div>
  )
}

export default Home
