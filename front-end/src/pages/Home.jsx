import { useEffect, useState } from 'react'
import Topbar from '../components/Topbar'
import Hero from '../components/Hero'
import FeaturedGrid from '../components/FeaturedGrid'
import ProcessSteps from '../components/ProcessSteps'
import CTASection from '../components/CTASection'
import Footer from '../components/Footer'
import { documentAPI, downloadAndOpenDocument } from '../api/documents'
import { featuredDocs, steps } from '../data/docs'
import '../styles/home.css'

const toDisplayDocument = (doc) => ({
  ...doc,
  author: doc.uploader_id ? `User ${String(doc.uploader_id).slice(0, 8)}` : 'UETDocs',
  faculty: doc.department,
  size: doc.file_size < 1024 ** 2
    ? `${(doc.file_size / 1024).toFixed(1)} KB`
    : `${(doc.file_size / 1024 ** 2).toFixed(1)} MB`,
  badge: doc.status === 'approved' ? 'Da duyet' : doc.status,
})

const Home = () => {
  const [documents, setDocuments] = useState([])
  const [downloadError, setDownloadError] = useState('')

  useEffect(() => {
    let ignore = false

    documentAPI.getDocuments({ limit: 6 })
      .then((res) => {
        if (!ignore) {
          setDocuments((res.data || []).map(toDisplayDocument))
        }
      })
      .catch(() => {
        if (!ignore) setDocuments([])
      })

    return () => {
      ignore = true
    }
  }, [])

  const visibleDocs = documents.length > 0 ? documents : featuredDocs

  const handleReadDocument = async (doc) => {
    if (!doc.id) return

    setDownloadError('')
    try {
      await downloadAndOpenDocument(doc.id)
    } catch (error) {
      setDownloadError(error.response?.data?.detail || error.message || 'Khong the tai tai lieu.')
    }
  }

  return (
    <div className="page">
      <Topbar />
      <Hero featured={visibleDocs.slice(0, 3)} />
      {downloadError && (
        <div style={{ maxWidth: 1120, margin: '16px auto 0', color: '#b91c1c', padding: '0 24px' }}>
          {downloadError}
        </div>
      )}
      <FeaturedGrid
        items={visibleDocs}
        title="Tai lieu noi bat"
        description="Cac tai lieu da duoc duyet va co the tai ve"
        onRead={handleReadDocument}
      />
      <FeaturedGrid
        items={visibleDocs.slice(0, 3)}
        title="Ban da xem truoc do"
        onRead={handleReadDocument}
      />
      <ProcessSteps steps={steps} />
      <CTASection />
      <Footer />
    </div>
  )
}

export default Home
