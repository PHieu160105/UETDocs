const GoogleLoginButton = () => {
  return (
    <button
      type="button"
      className="google-login-button"
      disabled
      aria-disabled="true"
      title="Tính năng đăng nhập Google sẽ được bổ sung sau"
    >
      <span className="google-icon" aria-hidden="true">
        G
      </span>
      <span>Đăng nhập bằng Google</span>
    </button>
  )
}

export default GoogleLoginButton
