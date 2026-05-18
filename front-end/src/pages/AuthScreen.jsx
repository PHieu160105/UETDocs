import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import GoogleLoginButton from '../components/GoogleLoginButton'
import { IconBookMark } from '../components/HomeIcons'
import { useAuth } from '../context/AuthContext'
import '../styles/auth.css'

const LOGIN_MODE = 'login'
const SIGNUP_MODE = 'signup'

const BRAND_CARDS = [
  {
    title: 'Tài liệu học tập',
    description: 'Giáo trình, bài giảng và đề thi được sắp xếp gọn gàng.',
  },
  {
    title: 'Theo khoa và môn',
    description: 'Lọc nhanh theo khoa viện, môn học và từ khóa cần tìm.',
  },
  {
    title: 'Chia sẻ dễ dàng',
    description: 'Đóng góp tài liệu và theo dõi nội dung sau khi được duyệt.',
  },
]

const BRAND_BENEFITS = [
  'Tải và chia sẻ tài liệu học tập trên cùng một nền tảng.',
  'Tìm kiếm theo khoa, môn học và tên tài liệu.',
  'Theo dõi nội dung đã được duyệt và mở xem trước nhanh.',
]

const emptyMessage = { type: '', text: '' }

const getModeFromPath = (pathname) => (pathname === '/signup' ? SIGNUP_MODE : LOGIN_MODE)

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)

const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
    <polyline points="22,8 12,15 2,8" />
  </svg>
)

const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21a8 8 0 0 0-16 0" />
    <circle cx="12" cy="8" r="4" />
  </svg>
)

const IconCheckCircle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <polyline points="8.5 12.5 11 15 16 9.5" />
  </svg>
)

const AuthField = ({
  id,
  name,
  label,
  type,
  value,
  placeholder,
  error,
  icon,
  onChange,
  disabled,
}) => (
  <label className="auth-form-field" htmlFor={id}>
    <span className="auth-form-field__label">{label}</span>
    <span className={`auth-form-field__control ${error ? 'auth-form-field__control--error' : ''}`}>
      <span className="auth-form-field__icon" aria-hidden="true">
        {icon}
      </span>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        disabled={disabled}
      />
    </span>
    {error ? <span className="auth-form-field__error">{error}</span> : null}
  </label>
)

const AuthScreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, signup, isLoading } = useAuth()

  const routeMode = getModeFromPath(location.pathname)
  const [visualMode, setVisualMode] = useState(routeMode)
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loginErrors, setLoginErrors] = useState({})
  const [signupErrors, setSignupErrors] = useState({})
  const [loginMessage, setLoginMessage] = useState(emptyMessage)
  const [signupMessage, setSignupMessage] = useState(emptyMessage)

  useEffect(() => {
    setVisualMode(routeMode)
  }, [routeMode])

  const handleModeChange = (nextMode) => {
    if (nextMode === routeMode) return
    setVisualMode(nextMode)
    navigate(nextMode === SIGNUP_MODE ? '/signup' : '/login')
  }

  const handleLoginChange = (event) => {
    const { name, value } = event.target
    setLoginForm((current) => ({
      ...current,
      [name]: value,
    }))

    if (loginErrors[name]) {
      setLoginErrors((current) => ({
        ...current,
        [name]: '',
      }))
    }

    if (loginMessage.text) {
      setLoginMessage(emptyMessage)
    }
  }

  const handleSignupChange = (event) => {
    const { name, value } = event.target
    setSignupForm((current) => ({
      ...current,
      [name]: value,
    }))

    if (signupErrors[name]) {
      setSignupErrors((current) => ({
        ...current,
        [name]: '',
      }))
    }

    if (signupMessage.text) {
      setSignupMessage(emptyMessage)
    }
  }

  const validateLoginForm = () => {
    const nextErrors = {}

    if (!loginForm.email) {
      nextErrors.email = 'Email là bắt buộc'
    } else if (!isValidEmail(loginForm.email)) {
      nextErrors.email = 'Email không hợp lệ'
    }

    if (!loginForm.password) {
      nextErrors.password = 'Mật khẩu là bắt buộc'
    } else if (loginForm.password.length < 6) {
      nextErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
    }

    setLoginErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const validateSignupForm = () => {
    const nextErrors = {}

    if (!signupForm.name) {
      nextErrors.name = 'Tên là bắt buộc'
    } else if (signupForm.name.length < 3) {
      nextErrors.name = 'Tên phải có ít nhất 3 ký tự'
    }

    if (!signupForm.email) {
      nextErrors.email = 'Email là bắt buộc'
    } else if (!isValidEmail(signupForm.email)) {
      nextErrors.email = 'Email không hợp lệ'
    }

    if (!signupForm.password) {
      nextErrors.password = 'Mật khẩu là bắt buộc'
    } else if (signupForm.password.length < 6) {
      nextErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
    }

    if (!signupForm.confirmPassword) {
      nextErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu'
    } else if (signupForm.password !== signupForm.confirmPassword) {
      nextErrors.confirmPassword = 'Mật khẩu không trùng khớp'
    }

    setSignupErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    setLoginMessage(emptyMessage)

    if (!validateLoginForm()) {
      return
    }

    const result = await login(loginForm.email, loginForm.password)

    if (result.success) {
      setLoginMessage({ type: 'success', text: 'Đăng nhập thành công!' })
      window.setTimeout(() => {
        navigate(result.data?.role === 'admin' ? '/admin' : '/home', { replace: true })
      }, 1000)
      return
    }

    setLoginMessage({ type: 'error', text: result.error })
  }

  const handleSignupSubmit = async (event) => {
    event.preventDefault()
    setSignupMessage(emptyMessage)

    if (!validateSignupForm()) {
      return
    }

    const result = await signup(signupForm.name, signupForm.email, signupForm.password)

    if (result.success) {
      setSignupMessage({ type: 'success', text: 'Đăng ký thành công!' })
      window.setTimeout(() => {
        navigate('/home', { replace: true })
      }, 1000)
      return
    }

    setSignupMessage({ type: 'error', text: result.error })
  }

  return (
    <div className="auth-shell" data-mode={visualMode}>
      <section className="auth-shell__brand-panel" aria-label="Thông tin nền tảng">
        <div className="auth-shell__brand-top">
          <span className="auth-shell__brand-mark" aria-hidden="true">
            <IconBookMark />
          </span>
          <div className="auth-shell__brand-copy">
            <strong>UETDoc</strong>
            <span>VNU-UET</span>
          </div>
        </div>

        <div className="auth-shell__brand-main">
          <h1>Kho tài liệu dành cho sinh viên UET</h1>
          <p>
            Truy cập giáo trình, bài giảng và tài liệu học tập trong một giao diện gọn, rõ và dễ dùng.
          </p>
        </div>

        <div className="auth-shell__value-grid" aria-label="Giá trị nổi bật">
          {BRAND_CARDS.map((card) => (
            <article key={card.title} className="auth-shell__value-card">
              <strong>{card.title}</strong>
              <span>{card.description}</span>
            </article>
          ))}
        </div>

        <ul className="auth-shell__benefits">
          {BRAND_BENEFITS.map((benefit) => (
            <li key={benefit}>
              <IconCheckCircle />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="auth-shell__panel" aria-label="Đăng nhập và đăng ký">
        <div className="auth-switcher" role="tablist" aria-label="Chọn chế độ xác thực">
          <span
            className={`auth-switcher__indicator ${visualMode === SIGNUP_MODE ? 'auth-switcher__indicator--signup' : ''}`}
            aria-hidden="true"
          />
          <button
            type="button"
            className={`auth-switcher__tab ${visualMode === LOGIN_MODE ? 'auth-switcher__tab--active' : ''}`}
            onClick={() => handleModeChange(LOGIN_MODE)}
            role="tab"
            aria-selected={visualMode === LOGIN_MODE}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            className={`auth-switcher__tab ${visualMode === SIGNUP_MODE ? 'auth-switcher__tab--active' : ''}`}
            onClick={() => handleModeChange(SIGNUP_MODE)}
            role="tab"
            aria-selected={visualMode === SIGNUP_MODE}
          >
            Đăng ký
          </button>
        </div>

        <div className="auth-panel__stage">
          <div
            className={`auth-panel__pane auth-panel__pane--login ${visualMode === LOGIN_MODE ? 'is-active' : 'is-hidden'}`}
            aria-hidden={visualMode !== LOGIN_MODE}
          >
            <header className="auth-panel__header">
              <h2>Chào mừng trở lại!</h2>
              <p>Đăng nhập để truy cập kho tài liệu UETDoc.</p>
            </header>

            {loginMessage.text ? (
              <div className={`auth-feedback auth-feedback--${loginMessage.type}`}>{loginMessage.text}</div>
            ) : null}

            <GoogleLoginButton label="Tiếp tục với Google" />

            <div className="auth-panel__divider">
              <span />
              <em>hoặc dùng email</em>
              <span />
            </div>

            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <AuthField
                id="login-email"
                name="email"
                label="Email"
                type="email"
                value={loginForm.email}
                placeholder="sinhvien@vnu.edu.vn"
                error={loginErrors.email}
                icon={<IconMail />}
                onChange={handleLoginChange}
                disabled={isLoading || visualMode !== LOGIN_MODE}
              />

              <AuthField
                id="login-password"
                name="password"
                label="Mật khẩu"
                type="password"
                value={loginForm.password}
                placeholder="Nhập mật khẩu"
                error={loginErrors.password}
                icon={<IconLock />}
                onChange={handleLoginChange}
                disabled={isLoading || visualMode !== LOGIN_MODE}
              />

              <button className="auth-submit-button" type="submit" disabled={isLoading || visualMode !== LOGIN_MODE}>
                {isLoading && visualMode === LOGIN_MODE ? (
                  <>
                    <span className="loading-spinner" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <IconArrowRight />
                  </>
                )}
              </button>
            </form>
          </div>

          <div
            className={`auth-panel__pane auth-panel__pane--signup ${visualMode === SIGNUP_MODE ? 'is-active' : 'is-hidden'}`}
            aria-hidden={visualMode !== SIGNUP_MODE}
          >
            <header className="auth-panel__header">
              <h2>Tạo tài khoản mới</h2>
              <p>Đăng ký để bắt đầu lưu, tải và chia sẻ tài liệu học tập.</p>
            </header>

            {signupMessage.text ? (
              <div className={`auth-feedback auth-feedback--${signupMessage.type}`}>{signupMessage.text}</div>
            ) : null}

            <GoogleLoginButton label="Tiếp tục với Google" />

            <div className="auth-panel__divider">
              <span />
              <em>hoặc đăng ký bằng email</em>
              <span />
            </div>

            <form className="auth-form" onSubmit={handleSignupSubmit}>
              <AuthField
                id="signup-name"
                name="name"
                label="Tên của bạn"
                type="text"
                value={signupForm.name}
                placeholder="Nguyễn Văn A"
                error={signupErrors.name}
                icon={<IconUser />}
                onChange={handleSignupChange}
                disabled={isLoading || visualMode !== SIGNUP_MODE}
              />

              <AuthField
                id="signup-email"
                name="email"
                label="Email"
                type="email"
                value={signupForm.email}
                placeholder="sinhvien@vnu.edu.vn"
                error={signupErrors.email}
                icon={<IconMail />}
                onChange={handleSignupChange}
                disabled={isLoading || visualMode !== SIGNUP_MODE}
              />

              <AuthField
                id="signup-password"
                name="password"
                label="Mật khẩu"
                type="password"
                value={signupForm.password}
                placeholder="Nhập mật khẩu"
                error={signupErrors.password}
                icon={<IconLock />}
                onChange={handleSignupChange}
                disabled={isLoading || visualMode !== SIGNUP_MODE}
              />

              <AuthField
                id="signup-confirm-password"
                name="confirmPassword"
                label="Xác nhận mật khẩu"
                type="password"
                value={signupForm.confirmPassword}
                placeholder="Nhập lại mật khẩu"
                error={signupErrors.confirmPassword}
                icon={<IconLock />}
                onChange={handleSignupChange}
                disabled={isLoading || visualMode !== SIGNUP_MODE}
              />

              <button className="auth-submit-button" type="submit" disabled={isLoading || visualMode !== SIGNUP_MODE}>
                {isLoading && visualMode === SIGNUP_MODE ? (
                  <>
                    <span className="loading-spinner" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <span>Đăng ký</span>
                    <IconArrowRight />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <Link className="auth-home-link" to="/home">
          ← Quay về trang chủ
        </Link>
      </section>
    </div>
  )
}

export default AuthScreen
