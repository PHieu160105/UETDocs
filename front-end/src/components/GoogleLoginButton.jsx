const GoogleMark = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path
      fill="#FFC107"
      d="M43.61 20.08H42V20H24v8h11.3c-1.65 4.66-6.08 8-11.3 8-6.63 0-12-5.37-12-12s5.37-12 12-12c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.06 6.05 29.27 4 24 4 12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20c0-1.34-.14-2.65-.39-3.92Z"
    />
    <path
      fill="#FF3D00"
      d="M6.31 14.69l6.57 4.82C14.66 15.11 18.96 12 24 12c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.06 6.05 29.27 4 24 4 16.32 4 9.66 8.34 6.31 14.69Z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.16 0 9.86-1.98 13.41-5.2l-6.19-5.24C29.14 35.09 26.67 36 24 36c-5.2 0-9.62-3.32-11.29-7.95l-6.52 5.02C9.5 39.56 16.22 44 24 44Z"
    />
    <path
      fill="#1976D2"
      d="M43.61 20.08H42V20H24v8h11.3a12.05 12.05 0 0 1-4.09 5.56l.01-.01 6.19 5.24C36.97 39.2 44 34 44 24c0-1.34-.14-2.65-.39-3.92Z"
    />
  </svg>
)

const GoogleLoginButton = ({ label = 'Đăng nhập bằng Google' }) => {
  return (
    <button
      type="button"
      className="google-login-button"
      disabled
      aria-disabled="true"
      title="Tính năng đăng nhập Google sẽ được bổ sung sau"
    >
      <span className="google-login-button__content">
        <span className="google-icon">
          <GoogleMark />
        </span>
        <span>{label}</span>
      </span>
    </button>
  )
}

export default GoogleLoginButton
