import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { IconBookMark, IconSearch } from './HomeIcons'
import { departmentOptions, normalizeDepartmentValue } from '../data/departments'
import { useAuth } from '../context/AuthContext'

const Topbar = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, user, logout } = useAuth()
  const homePath = '/home'
  const documentsPath = '/documents'
  const menuRef = useRef(null)
  const searchRef = useRef(null)
  const [isFacultyMenuOpen, setIsFacultyMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const accountInitial = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase()
  const activeDepartment = normalizeDepartmentValue(
    searchParams.get('department') || searchParams.get('faculty') || '',
  )
  const activeSearch = (searchParams.get('search') || '').trim()
  const activeSort = (searchParams.get('sort') || '').trim()

  useEffect(() => {
    setSearchQuery(activeSearch)
  }, [activeSearch])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsFacultyMenuOpen(false)
      }

      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    const nextParams = new URLSearchParams()
    const value = searchQuery.trim()

    if (value) nextParams.set('search', value)
    if (activeDepartment) nextParams.set('department', activeDepartment)
    if (activeSort && activeSort !== 'newest') nextParams.set('sort', activeSort)

    navigate({
      pathname: documentsPath,
      search: nextParams.toString() ? `?${nextParams.toString()}` : '',
    })
    setIsSearchOpen(false)
  }

  const handleDepartmentNavigate = (department) => {
    const nextParams = new URLSearchParams()

    if (activeSearch) nextParams.set('search', activeSearch)
    if (department) nextParams.set('department', department)
    if (activeSort && activeSort !== 'newest') nextParams.set('sort', activeSort)

    setIsFacultyMenuOpen(false)
    navigate({
      pathname: documentsPath,
      search: nextParams.toString() ? `?${nextParams.toString()}` : '',
    })
  }

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <button className="brand" type="button" onClick={() => navigate(homePath)}>
          <span className="brand-mark" aria-hidden="true">
            <IconBookMark />
          </span>
          <span className="brand-lockup">
            <span className="brand-name">UETDocs</span>
            <span className="brand-subtitle">VNU-UET</span>
          </span>
        </button>

        <nav className="nav" aria-label="Điều hướng chính">
          <NavLink
            className={({ isActive }) => `nav__link${isActive ? ' nav__link--active' : ''}`}
            to={homePath}
            end
          >
            Trang chủ
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav__link${isActive ? ' nav__link--active' : ''}`}
            to="/my-documents"
          >
            Tài liệu của bạn
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav__link${isActive ? ' nav__link--active' : ''}`}
            to={documentsPath}
          >
            Tài liệu
          </NavLink>
          <button className="nav__link nav__link--button" type="button" onClick={() => navigate('/upload')}>
            Đóng góp
          </button>

          <div className="nav__dropdown" ref={menuRef}>
            <button
              className={`nav__link nav__link--button${activeDepartment ? ' nav__link--active' : ''}`}
              type="button"
              onClick={() => setIsFacultyMenuOpen((open) => !open)}
              aria-expanded={isFacultyMenuOpen}
              aria-haspopup="menu"
            >
              Khoa & Viện
              <span className="nav__caret" aria-hidden="true">
                ▾
              </span>
            </button>

            {isFacultyMenuOpen ? (
              <div className="nav__menu" role="menu">
                {departmentOptions.map((option) => (
                  <button
                    key={option.label}
                    className={`nav__menu-item${
                      option.label === activeDepartment ? ' nav__menu-item--active' : ''
                    }`}
                    type="button"
                    role="menuitem"
                    onClick={() => handleDepartmentNavigate(option.label)}
                  >
                    <span>{option.label}</span>
                    <small>{option.shortLabel}</small>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="topbar__actions">
          <div className="topbar__search" ref={searchRef}>
            <button
              className="topbar__icon-button"
              type="button"
              onClick={() => setIsSearchOpen((open) => !open)}
              aria-label="Mở tìm kiếm"
              aria-expanded={isSearchOpen}
            >
              <IconSearch />
            </button>

            <form
              className={`topbar__search-form ${isSearchOpen ? ' topbar__search-form--open' : ''}`}
              onSubmit={handleSearchSubmit}
            >
              <input
                className="topbar__search-input"
                type="search"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </form>
          </div>

          {isAuthenticated ? (
            <>
              <button
                className="topbar__account"
                type="button"
                onClick={() => navigate('/account')}
                aria-label="Mở trang tài khoản"
              >
                <span className="topbar__avatar" aria-hidden="true">{accountInitial}</span>
                <span className="topbar__user">{user?.name || user?.email}</span>
              </button>
              <button className="topbar__ghost" type="button" onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <button className="topbar__ghost" type="button" onClick={() => navigate('/login')}>
                Đăng nhập
              </button>
              <button className="topbar__solid" type="button" onClick={() => navigate('/signup')}>
                Đăng ký
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Topbar
