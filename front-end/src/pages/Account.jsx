import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Topbar from '../components/Topbar'
import '../styles/account.css'

const Account = () => {
  const { user, updateProfile, changePassword, isLoading } = useAuth()
  const [profileForm, setProfileForm] = useState(() => ({ name: user?.name || '' }))
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' })
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' })

  const initial = useMemo(
    () => (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase(),
    [user]
  )

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    setProfileMessage({ type: '', text: '' })

    const name = profileForm.name.trim()
    if (!name) {
      setProfileMessage({ type: 'error', text: 'Tên hiển thị không được để trống' })
      return
    }

    const result = await updateProfile({ name })
    if (result.success) {
      setProfileForm({ name })
      setProfileMessage({ type: 'success', text: 'Đã cập nhật tên hiển thị' })
    } else {
      setProfileMessage({ type: 'error', text: result.error })
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setPasswordMessage({ type: '', text: '' })

    if (!passwordForm.currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Nhập mật khẩu hiện tại' })
      return
    }

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Xác nhận mật khẩu không khớp' })
      return
    }

    const result = await changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    })

    if (result.success) {
      setPasswordMessage({ type: 'success', text: 'Đã đổi mật khẩu thành công' })
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } else {
      setPasswordMessage({ type: 'error', text: result.error })
    }
  }

  return (
    <div className="page">
      <Topbar />

      <main className="account-page">
        <section className="account-hero">
          <div className="account-identity">
            <div className="account-avatar" aria-hidden="true">
              {initial}
            </div>
            <div>
              <p className="account-eyebrow">Tài khoản của bạn</p>
              <h1>Thông tin tài khoản</h1>
              <p className="account-lead">
                Cập nhật tên hiển thị và mật khẩu. Email chỉ hiển thị để nhận diện, không
                thể chỉnh sửa.
              </p>
            </div>
          </div>

          <div className="account-summary">
            <div>
              <span>Họ và tên</span>
              <strong>{user?.name || 'Chưa có tên'}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{user?.email || '-'}</strong>
            </div>
          </div>
        </section>

        <section className="account-grid">
          <article className="account-card">
            <div className="account-card-head">
              <div>
                <p className="account-card-kicker">Thông tin chung</p>
                <h2>Chỉnh sửa tên hiển thị</h2>
              </div>
            </div>

            {profileMessage.text ? (
              <div className={`${profileMessage.type}-message account-message`}>
                {profileMessage.text}
              </div>
            ) : null}

            <form onSubmit={handleProfileSubmit} className="account-form">
              <label className="form-label" htmlFor="account-name">
                Tên hiển thị
              </label>
              <input
                id="account-name"
                className="form-input"
                type="text"
                value={profileForm.name}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, name: event.target.value }))
                }
                disabled={isLoading}
              />

              <label className="form-label" htmlFor="account-email">
                Email
              </label>
              <input
                id="account-email"
                className="form-input"
                type="email"
                value={user?.email || ''}
                disabled
              />

              <button className="auth-button primary" type="submit" disabled={isLoading}>
                Lưu thay đổi
              </button>
            </form>
          </article>

          <article className="account-card">
            <div className="account-card-head">
              <div>
                <p className="account-card-kicker">Bảo mật</p>
                <h2>Đổi mật khẩu</h2>
              </div>
            </div>

            {passwordMessage.text ? (
              <div className={`${passwordMessage.type}-message account-message`}>
                {passwordMessage.text}
              </div>
            ) : null}

            <form onSubmit={handlePasswordSubmit} className="account-form">
              <label className="form-label" htmlFor="currentPassword">
                Mật khẩu hiện tại
              </label>
              <input
                id="currentPassword"
                className="form-input"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    currentPassword: event.target.value,
                  }))
                }
                disabled={isLoading}
              />

              <label className="form-label" htmlFor="newPassword">
                Mật khẩu mới
              </label>
              <input
                id="newPassword"
                className="form-input"
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    newPassword: event.target.value,
                  }))
                }
                disabled={isLoading}
              />

              <label className="form-label" htmlFor="confirmPassword">
                Xác nhận mật khẩu mới
              </label>
              <input
                id="confirmPassword"
                className="form-input"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
                disabled={isLoading}
              />

              <button className="auth-button primary" type="submit" disabled={isLoading}>
                Cập nhật mật khẩu
              </button>
            </form>
          </article>
        </section>
      </main>
    </div>
  )
}

export default Account
