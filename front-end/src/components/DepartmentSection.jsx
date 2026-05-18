import { IconChevronRight, IconGraduationCap } from './HomeIcons'
import { departmentOptions } from '../data/departments'

const DepartmentSection = ({ activeDepartment = '', onSelectDepartment, onViewAll }) => (
  <section className="home-section" aria-labelledby="department-section-title">
    <div className="section-header">
      <div>
        <h2 id="department-section-title">Khoa & Viện</h2>
        <p>Tìm tài liệu theo khoa, viện của bạn</p>
      </div>
      <button className="section-link" type="button" onClick={onViewAll}>
        Xem tất cả
        <IconChevronRight />
      </button>
    </div>

    <div className="department-grid">
      {departmentOptions.map((option) => (
        <button
          key={option.label}
          className={`department-card${
            activeDepartment === option.label ? ' department-card--active' : ''
          }`}
          type="button"
          onClick={() => onSelectDepartment(option.label)}
        >
          <span
            className="department-card__icon"
            style={{
              '--department-start': option.accent.start,
              '--department-end': option.accent.end,
            }}
            aria-hidden="true"
          >
            <IconGraduationCap />
          </span>
          <span className="department-card__content">
            <strong>{option.label}</strong>
            <span>{option.shortLabel} · Lọc tài liệu theo khoa này</span>
          </span>
          <IconChevronRight className="department-card__arrow" />
        </button>
      ))}
    </div>
  </section>
)

export default DepartmentSection
