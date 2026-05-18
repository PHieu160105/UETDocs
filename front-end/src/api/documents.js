import axios from 'axios'
import authAPI from './auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

const publicDocumentAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const documentAPI = {
  createUploadUrl: (payload) => authAPI.put('/documents/upload-url', payload),
  uploadFile: (formData) =>
    authAPI.post('/documents/upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000,
    }),
  registerDocument: (payload) => authAPI.put('/documents', payload),
  getDocuments: (params = {}) => publicDocumentAPI.get('/documents', { params }),
  getDocument: (id) => publicDocumentAPI.get(`/documents/${id}`),
  getDocumentAccessUrl: (id, params = {}) =>
    publicDocumentAPI.get(`/documents/${id}/access-url`, { params }),
  getDocumentTextPreview: (id) =>
    publicDocumentAPI.get(`/documents/${id}/text-preview`, {
      responseType: 'text',
      transformResponse: [(data) => data],
    }),
  downloadDocument: (id) => authAPI.post(`/documents/${id}/download`),
  getRelatedDocuments: (subject, excludeId, limit = 5) =>
    publicDocumentAPI.get('/documents', {
      params: {
        subject,
        limit,
      },
    }).then((res) => ({
      ...res,
      data: (res.data || []).filter((doc) => String(doc.id) !== String(excludeId)),
    })),
  getAdminDocuments: (params = {}) => authAPI.get('/documents/admin', { params }),
  getAdminDocument: (id) => authAPI.get(`/documents/admin/${id}`),
}

export const uploadFileToStorage = async (uploadUrl, file) => {
  await axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    timeout: 120000,
  })
}

export const uploadFileToBackend = async (file, folder = 'documents') => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)

  const response = await documentAPI.uploadFile(formData)
  return response.data
}

export const downloadDocumentToDevice = async (documentId) => {
  const response = await documentAPI.downloadDocument(documentId)
  const url = response.data?.download_url || response.data?.assigned_url

  if (!url) {
    throw new Error('Backend did not return a download URL')
  }

  const link = window.document.createElement('a')
  link.href = url
  link.download = response.data?.filename || ''
  link.rel = 'noopener'
  link.style.display = 'none'
  window.document.body.appendChild(link)
  link.click()
  window.document.body.removeChild(link)

  return response.data
}

export const getDocumentPreviewUrl = async (documentId) => {
  const response = await documentAPI.getDocumentAccessUrl(documentId)
  return response.data?.access_url || response.data?.assigned_url || ''
}

export const getDocumentTextPreview = async (documentId) => {
  const response = await documentAPI.getDocumentTextPreview(documentId)
  return typeof response.data === 'string' ? response.data : ''
}
