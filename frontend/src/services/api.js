// src/services/api.js
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({ baseURL: API_URL })

export const taskAPI = {
  getByProject: (projectId) => api.get(`/tasks/project/${projectId}`),
  updateStatus: (taskId, status) => api.patch(`/tasks/${taskId}/status`, { status }),
}
