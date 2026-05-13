import authAPI from './auth'

// ─── Documents ────────────────────────────────────────────────────────────────

export const adminAPI = {
  // List all documents for admin review
  getDocuments: (params = {}) =>
    authAPI.get('/documents/admin', { params }),

  // Documents uploaded by a specific user
  getUserDocuments: (userId, params = {}) =>
    authAPI.get('/documents/admin', { params: { uploader_id: userId, limit: 100, ...params } }),

  getDocument: (id) =>
    authAPI.get(`/documents/admin/${id}`),

  getDocumentAccessUrl: (id) =>
    authAPI.get(`/documents/admin/${id}/access-url`),

  approveDocument: (id) =>
    authAPI.post(`/documents/${id}/approve`),

  rejectDocument: (id, reason) =>
    authAPI.patch(`/documents/${id}`, { status: 'rejected', description: reason }),

  updateDocument: (id, payload) =>
    authAPI.patch(`/documents/${id}`, payload),

  deleteDocument: (id) =>
    authAPI.delete(`/documents/${id}`),

  // ─── Users ──────────────────────────────────────────────────────────────────

  getUsers: (params = {}) =>
    authAPI.get('/users', { params }),

  getUser: (id) =>
    authAPI.get(`/users/${id}`),

  updateUser: (id, payload) =>
    authAPI.patch(`/users/${id}`, payload),

  lockUser: (id) =>
    authAPI.patch(`/users/${id}`, { is_active: false }),

  unlockUser: (id) =>
    authAPI.patch(`/users/${id}`, { is_active: true }),

  deleteUser: (id) =>
    authAPI.delete(`/users/${id}`),

  getUserActivity: (id) =>
    authAPI.get(`/users/${id}/activity`),
}

export default adminAPI
