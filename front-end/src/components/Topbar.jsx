import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const facultyLinks = [
  'Khoa Công nghệ Thông tin',
  'Viện Trí tuệ Nhân tạo',
  'Khoa Điện tử Viễn Thông',
  'Khoa Công nghệ Nông nghiệp',
  'Tài liệu chung',
]

const Topbar = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()
  const homePath = '/home'
  const menuRef = useRef(null)
  const searchRef = useRef(null)
  const [isFacultyMenuOpen, setIsFacultyMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const accountInitial = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

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

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    const value = searchQuery.trim()

    if (!value) return

    navigate(`${homePath}?search=${encodeURIComponent(value)}`)
    setIsSearchOpen(false)
  }

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <button className="brand" type="button" onClick={() => navigate(homePath)}>
          <div className="brand-mark">U</div>
          <span className="brand-name">uetdocs</span>
        </button>

        <nav className="nav" aria-label="Điều hướng chính">
          <NavLink
            className={({ isActive }) =>
              `nav__link${isActive ? ' nav__link--active' : ''}`
            }
            to={homePath}
            end
          >
            Trang chủ
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `nav__link${isActive ? ' nav__link--active' : ''}`
            }
            to="/my-documents"
          >
            Tài liệu của bạn
          </NavLink>
          <a className="nav__link" href="#library">
            Tài liệu chung
          </a>
          <button
            className="nav__link nav__link--button"
            type="button"
            onClick={() => navigate('/upload')}
          >
            Đóng góp
          </button>

          <div className="nav__dropdown" ref={menuRef}>
            <button
              className="nav__link nav__link--button"
              type="button"
              onClick={() => setIsFacultyMenuOpen((open) => !open)}
              aria-expanded={isFacultyMenuOpen}
              aria-haspopup="menu"
            >
              Khoa/Viện
              <span className="nav__caret" aria-hidden="true">
                ▾
              </span>
            </button>

            {isFacultyMenuOpen ? (
              <div className="nav__menu" role="menu">
                {facultyLinks.map((label) => (
                  <button
                    key={label}
                    className="nav__menu-item"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsFacultyMenuOpen(false)
                      navigate(`${homePath}?faculty=${encodeURIComponent(label)}`)
                    }}
                  >
                    {label}
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
              <span aria-hidden="true">⌕</span>
            </button>

            <form
              className={`topbar__search-form ${
                isSearchOpen ? 'topbar__search-form--open' : ''
              }`}
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
                <span className="topbar__avatar" aria-hidden="true">
                  {accountInitial}
                </span>
                <span className="topbar__user">{user?.name}</span>
              </button>
              <button className="topbar__ghost" onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <button className="topbar__ghost" onClick={() => navigate('/login')}>
                Đăng nhập
              </button>
              <button className="topbar__solid" onClick={() => navigate('/signup')}>
                Tạo tài khoản
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Topbar
