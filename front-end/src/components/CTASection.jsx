import { useNavigate } from 'react-router-dom'

const CTASection = () => {
  const navigate = useNavigate()

  return (
    <section id="cta" className="cta">
      <div className="cta-content">
        <h2>Bạn có tài liệu muốn chia sẻ?</h2>
        <p>
          Đăng nhập để chuẩn bị bài gửi, gắn tag môn học và xem trước giao diện tải lên trước khi
          tính năng gửi thật được mở.
        </p>
      </div>
      <div className="cta-actions">
        <button className="solid" onClick={() => navigate('/upload')}>
          Mở trang tải lên
        </button>
        <button className="ghost" onClick={() => navigate('/my-documents')}>
          Xem hướng dẫn
        </button>
      </div>
    </section>
  )
}

export default CTASection
