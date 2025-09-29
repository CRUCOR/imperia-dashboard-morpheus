import axios from 'axios'
import type { MorpheusModel, ProcessingJob, ProcessingResult, UploadedFile } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
})

export const apiService = {
  async uploadFile(file: File): Promise<UploadedFile> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  },

  async getModels(): Promise<MorpheusModel[]> {
    const response = await api.get('/models')
    return response.data
  },

  async processFile(data: {
    filePath: string
    modelId: string
    parameters: Record<string, any>
  }): Promise<ProcessingJob> {
    const response = await api.post('/process', data)
    return response.data
  },

  async getJob(jobId: string): Promise<ProcessingJob> {
    const response = await api.get(`/jobs/${jobId}`)
    return response.data
  },

  async getJobs(): Promise<ProcessingJob[]> {
    const response = await api.get('/jobs')
    return response.data
  },

  async downloadResult(jobId: string): Promise<Blob> {
    const response = await api.get(`/jobs/${jobId}/download`, {
      responseType: 'blob',
    })
    return response.data
  },
}