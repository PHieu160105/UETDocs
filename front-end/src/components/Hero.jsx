import { useEffect, useState } from 'react'
import { IconBookMark, IconDownload, IconSearch, IconStar } from './HomeIcons'

const Hero = ({ searchValue = '', onSearch, stats = [] }) => {
  const [draftSearch, setDraftSearch] = useState(searchValue)

  useEffect(() => {
    setDraftSearch(searchValue)
  }, [searchValue])

  const handleSubmit = (event) => {
    event.preventDefault()
    onSearch?.(draftSearch)
  }

  const iconMap = {
    docs: IconBookMark,
    preview: IconStar,
    activity: IconDownload,
  }

  return (
    <section className="hero">
      <div className="hero__backdrop" />
      <div className="hero__orb hero__orb--one" />
      <div className="hero__orb hero__orb--two" />
      <div className="hero__inner">
        <div className="hero__badge">
          <IconBookMark />
          <span>Nền tảng chia sẻ tài liệu UET-VNU Hà Nội</span>
        </div>

        <h1 className="hero__title">
          Kho tài liệu
          <span>dành cho sinh viên UET</span>
        </h1>

        <p className="hero__lede">
          Tìm kiếm, chia sẻ và đóng góp tài liệu học tập từ tất cả các khoa và viện
          của Đại học Công nghệ - ĐHQGHN.
        </p>

        <form className="hero__search" onSubmit={handleSubmit}>
          <label className="hero__search-field">
            <span className="sr-only">Tìm kiếm tài liệu</span>
            <IconSearch className="hero__search-icon" />
            <input
              type="search"
              placeholder="Tìm tài liệu, môn học, giáo trình..."
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
            />
          </label>
          <button className="hero__search-button" type="submit">
            Tìm kiếm
          </button>
        </form>
      </div>
    </section>
  )
}

export default Hero
