// Google OAuth Configuration
// Bạn cần đăng ký app trên Google Cloud Console
// và lấy Client ID

export const GOOGLE_CONFIG = {
  // Thay YOUR_GOOGLE_CLIENT_ID bằng Client ID thực của bạn
  // Hướng dẫn: https://console.cloud.google.com
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
}

/**
 * Cách lấy Google Client ID:
 * 
 * 1. Truy cập: https://console.cloud.google.com
 * 2. Tạo project mới (nếu chưa có)
 * 3. Bật API: Google+ API
 * 4. Tạo OAuth 2.0 credentials (Web application)
 * 5. Authorized redirect URIs: http://localhost:5173
 * 6. Copy Client ID vào VITE_GOOGLE_CLIENT_ID ở file .env
 */
