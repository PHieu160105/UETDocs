const createDepartment = (label, shortLabel, description, accent, aliases = []) => ({
  label,
  shortLabel,
  description,
  accent,
  aliases,
})

export const departmentOptions = [
  createDepartment(
    'Công nghệ thông tin',
    'CNTT',
    'Lọc các tài liệu phần mềm, cấu trúc dữ liệu và học phần lập trình.',
    { start: '#2F72F7', end: '#3E8BFF' },
    ['Khoa Công nghệ Thông tin', 'CNTT'],
  ),
  createDepartment(
    'Điện tử Viễn thông',
    'ĐTVT',
    'Tài liệu tín hiệu, mạch, hệ nhúng và các học phần viễn thông.',
    { start: '#5352E6', end: '#6957F0' },
    ['Khoa Điện tử Viễn thông', 'ĐTVT'],
  ),
  createDepartment(
    'Trí tuệ nhân tạo',
    'AI',
    'Nhóm môn học về dữ liệu, học máy và trí tuệ nhân tạo ứng dụng.',
    { start: '#7C3AED', end: '#A855F7' },
    ['Viện Trí tuệ Nhân tạo', 'AI'],
  ),
  createDepartment(
    'Kinh tế',
    'ECO',
    'Tài liệu khối kinh tế, quản trị và các môn liên ngành liên quan.',
    { start: '#0EA5E9', end: '#2563EB' },
    ['Khoa Kinh tế', 'Kinh tế số'],
  ),
  createDepartment(
    'Công nghệ nông nghiệp',
    'CNNN',
    'Tài liệu ứng dụng công nghệ cho nông nghiệp và hệ thống thông minh.',
    { start: '#10B981', end: '#059669' },
    ['Khoa Công nghệ Nông nghiệp', 'CNNN'],
  ),
  createDepartment(
    'Tài liệu chung',
    'ALL',
    'Những tài liệu dùng chung hoặc chưa cần gắn vào một khoa cụ thể.',
    { start: '#64748B', end: '#475569' },
    ['Tài liệu chung'],
  ),
]

const normalizeText = (value = '') =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')

export const findDepartmentOption = (value = '') => {
  const normalized = normalizeText(value)

  if (!normalized) return null

  return departmentOptions.find((option) =>
    [option.label, ...option.aliases].some((candidate) => normalizeText(candidate) === normalized),
  ) || null
}

export const normalizeDepartmentValue = (value = '') => {
  const matchedOption = findDepartmentOption(value)

  if (matchedOption) return matchedOption.label

  return value.trim()
}
