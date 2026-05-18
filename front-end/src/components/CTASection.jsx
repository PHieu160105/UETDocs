import { useNavigate } from 'react-router-dom'
import { IconArrowRight, IconUpload } from './HomeIcons'

const CTASection = () => {
  const navigate = useNavigate()

  return (
    <section id="cta" className="cta-banner">
      <div className="cta-banner__content">
        <h2>
          Bạn có tài liệu hay?
          <span>Hãy chia sẻ với cộng đồng UET!</span>
        </h2>
        <p>
          Đóng góp tài liệu của bạn để giúp đỡ các bạn sinh viên khác. Mỗi tài liệu bạn chia sẻ
          đều tạo nên giá trị cho cộng đồng.
        </p>
      </div>

      <div className="cta-banner__actions">
        <button className="cta-banner__primary" type="button" onClick={() => navigate('/upload')}>
          <IconUpload />
          Đóng góp tài liệu
        </button>
        <button className="cta-banner__secondary" type="button" onClick={() => navigate('/my-documents')}>
          Tìm hiểu thêm
          <IconArrowRight />
        </button>
      </div>
    </section>
  )
}

export default CTASection
