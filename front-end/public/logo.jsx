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