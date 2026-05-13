import axios from 'axios'
import authAPI from './auth'

export const documentAPI = {
  createUploadUrl: (payload) => authAPI.put('/documents/upload-url', payload),
  registerDocument: (payload) => authAPI.put('/documents', payload),
  getDocuments: (params = {}) => authAPI.get('/documents', { params }),
  getDocument: (id) => authAPI.get(`/documents/${id}`),
  getDocumentAccessUrl: (id, params = {}) => authAPI.get(`/documents/${id}/access-url`, { params }),
  downloadDocument: (id) => authAPI.post(`/documents/${id}/download`),
  getAdminDocuments: (params = {}) => authAPI.get('/documents/admin', { params }),
  getAdminDocument: (id) => authAPI.get(`/documents/admin/${id}`),
}

export const uploadFileToStorage = async (uploadUrl, file) => {
  await axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
  })
}

export const downloadAndOpenDocument = async (documentId) => {
  const response = await documentAPI.downloadDocument(documentId)
  const url = response.data?.assigned_url

  if (!url) {
    throw new Error('Backend did not return a document URL')
  }

  window.open(url, '_blank', 'noopener,noreferrer')
  return response.data
}
