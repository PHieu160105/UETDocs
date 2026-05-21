// Cấu hình API
// Thay đổi giá trị BASE_URL để phù hợp với backend của bạn

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  TIMEOUT: 10000,
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      SIGNUP: '/auth/signup',
      LOGOUT: '/auth/logout',
      ME: '/auth/me',
      REFRESH: '/auth/refresh',
    },
    DOCS: {
      LIST: '/documents',
      GET: '/documents/:id',
      CREATE: '/documents',
      UPDATE: '/documents/:id',
      DELETE: '/documents/:id',
      SEARCH: '/documents/search',
    },
  },
}

// Cách sử dụng:
// import { API_CONFIG } from './config'
// const loginUrl = API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.AUTH.LOGIN
