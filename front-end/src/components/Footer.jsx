import { Link } from 'react-router-dom'
import { departmentOptions } from '../data/departments'
import { IconBookMark } from './HomeIcons'

const Footer = () => (
  <footer className="footer">
    <div className="footer__inner">
      <div className="footer__grid">
        <div className="footer__brand">
          <span className="footer__brand-mark" aria-hidden="true">
            <IconBookMark />
          </span>
          <div>
            <strong>UETDocs</strong>
            <p>
              Nền tảng chia sẻ tài liệu học tập dành cho sinh viên Đại học Công nghệ,
              ĐHQGHN.
            </p>
          </div>
        </div>

        <div className="footer__column">
          <h3>Tài liệu</h3>
          <Link to="/home#library">Tài liệu nổi bật</Link>
          <Link to="/upload">Đóng góp tài liệu</Link>
          <Link to="/my-documents">Tài liệu của bạn</Link>
        </div>

        <div className="footer__column">
          <h3>Khoa & Viện</h3>
          {departmentOptions.slice(0, 4).map((option) => (
            <span key={option.label}>{option.label}</span>
          ))}
        </div>

        <div className="footer__column">
          <h3>Hỗ trợ</h3>
          <span>Dữ liệu được kiểm duyệt trước khi công khai</span>
          <span>Hỗ trợ xem chi tiết trước khi tải xuống</span>
          <span>Tìm kiếm theo khoa, môn học và tên tài liệu</span>
        </div>
      </div>
    </div>
  </footer>
)

export default Footer
