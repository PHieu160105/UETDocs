import { useNavigate } from 'react-router-dom'
import DocumentCard from './DocumentCard'

const Hero = ({ featured }) => {
  const navigate = useNavigate()

  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="pill">Nền tảng chia sẻ tài liệu nội bộ UET</p>
        <h1>Khám phá và đóng góp tài liệu nhanh hơn</h1>
        <p className="lede">
          UETDocs là thư viện mở cho sinh viên và giảng viên lưu trữ giáo trình, slide, báo cáo.
          Tài liệu được duyệt nhanh, có cấu trúc rõ ràng và dễ tra cứu theo môn học.
        </p>
        <div className="cta-group">
          <button className="solid" onClick={() => navigate('/upload')}>
            Tải tài liệu
          </button>
          <button className="ghost" onClick={() => navigate('/my-documents')}>
            Quản lý tài liệu của bạn
          </button>
        </div>
        <div className="stats">
          <div>
            <strong>4.2k</strong>
            <span>Tài liệu đã duyệt</span>
          </div>
          <div>
            <strong>870</strong>
            <span>Tác giả đóng góp</span>
          </div>
          <div>
            <strong>24h</strong>
            <span>Thời gian duyệt trung bình</span>
          </div>
        </div>
      </div>

      <div className="hero-card">
        <div className="floating-tag">Tài liệu mới cập nhật</div>
        <div className="card-top">
          <div>
            <h3>Kho tài liệu nổi bật</h3>
          </div>
        </div>
        <div className="doc-list">
          {featured.map((doc) => (
            <DocumentCard key={doc.title} {...doc} />
          ))}
        </div>
        <div className="upload-hint">
          <p>Chọn file, thêm mô tả, gắn tag môn học và gửi duyệt trong một màn hình duy nhất.</p>
          <button className="solid wide" onClick={() => navigate('/upload')}>
            Bắt đầu tải lên
          </button>
        </div>
      </div>
    </section>
  )
}

export default Hero
