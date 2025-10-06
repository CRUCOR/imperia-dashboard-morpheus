/**
 * API Service
 * Handles all HTTP requests to the backend
 */

import axios, { AxiosInstance } from 'axios';
import type { DashboardStats, Analysis, GpuUsageHistory, ServicesStatus, UploadResponse } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Health & Monitoring
  async healthCheck() {
    const response = await this.api.get('/health');
    return response.data;
  }

  async getServicesStatus(): Promise<ServicesStatus> {
    const response = await this.api.get('/status');
    return response.data;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.api.get('/dashboard/stats');
    return response.data;
  }

  async getGpuUsageHistory(): Promise<GpuUsageHistory> {
    const response = await this.api.get('/dashboard/gpu-usage');
    return response.data;
  }

  // Analysis
  async listAnalyses(limit: number = 50, offset: number = 0): Promise<{ results: Analysis[] }> {
    const response = await this.api.get('/results', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getAnalysis(id: string): Promise<Analysis> {
    const response = await this.api.get(`/results/${id}`);
    return response.data;
  }

  async uploadFile(file: File, params: {
    model_name: string;
    pipeline_batch_size: string;
    model_max_batch_size: string;
    num_threads: string;
  }): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_name', params.model_name);
    formData.append('pipeline_batch_size', params.pipeline_batch_size);
    formData.append('model_max_batch_size', params.model_max_batch_size);
    formData.append('num_threads', params.num_threads);

    const response = await this.api.post('/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteAnalysis(id: string): Promise<void> {
    await this.api.delete(`/results/${id}`);
  }
}

export default new ApiService();
