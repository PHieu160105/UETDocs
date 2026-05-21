export const IconBookMark = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {/* Open book - left page */}
    <path
      d="M12 6.5C10.5 5 8.5 4 6 4C4.5 4 3.2 4.4 2.5 5V18.5C3.2 17.9 4.5 17.5 6 17.5C8.5 17.5 10.5 18.5 12 20"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Open book - right page */}
    <path
      d="M12 6.5C13.5 5 15.5 4 18 4C19.5 4 20.8 4.4 21.5 5V18.5C20.8 17.9 19.5 17.5 18 17.5C15.5 17.5 13.5 18.5 12 20"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Book spine */}
    <path
      d="M12 6.5V20"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    {/* Sparkle accent */}
    <path
      d="M17 8.5L17.5 7L18 8.5L19.5 9L18 9.5L17.5 11L17 9.5L15.5 9L17 8.5Z"
      fill="currentColor"
    />
  </svg>
)

export const IconSearch = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
    <path d="M16 16L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const IconChevronRight = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconGraduationCap = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 9.2L12 4L21 9.2L12 14.4L3 9.2Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    <path d="M7 11.4V15C7 16.6569 9.23858 18 12 18C14.7614 18 17 16.6569 17 15V11.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M21 9.2V13.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
)

export const IconStar = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 3.75L14.577 8.973L20.34 9.81L16.17 13.875L17.155 19.615L12 16.905L6.845 19.615L7.83 13.875L3.66 9.81L9.423 8.973L12 3.75Z" />
  </svg>
)

export const IconDownload = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 4.5V14.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M8.5 11L12 14.5L15.5 11" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 18.5H19" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
)

export const IconClock = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.9" />
    <path d="M12 8V12L15 14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconUpload = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 15.5V5.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M8.5 9L12 5.5L15.5 9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 18.5H19" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
)

export const IconArrowRight = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12H19" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M13.5 6.5L19 12L13.5 17.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
