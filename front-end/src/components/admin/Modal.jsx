import { useState, useCallback } from 'react'

/* ── useToast hook ────────────────────────────────────────── */
export const useToast = () => {
  const [toasts, setToasts] = useState([])
  const push = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts((p) => [...p, { id, msg, type }])
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500)
  }, [])
  return { toasts, push }
}

/* ── ToastList ────────────────────────────────────────────── */
export const ToastList = ({ toasts }) => (
  <div className="admin-toast-wrap">
    {toasts.map((t) => (
      <div key={t.id} className={`admin-toast admin-toast--${t.type}`}>
        {t.type === 'success' ? '✓' : '✕'} {t.msg}
      </div>
    ))}
  </div>
)

/* ── Base Modal ───────────────────────────────────────────── */
const Modal = ({ title, onClose, children, footer }) => (
  <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className="admin-modal">
      <div className="admin-modal__head">
        <h3 className="admin-modal__title">{title}</h3>
        <button className="admin-modal__close" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div className="admin-modal__body">{children}</div>
      {footer && <div className="admin-modal__foot">{footer}</div>}
    </div>
  </div>
)

export default Modal
