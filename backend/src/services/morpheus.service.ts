/**
 * Morpheus Service
 * Handles communication with Morpheus/Triton service
 */

import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config';

export class MorpheusService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = config.morpheusUrl;
  }

  /**
   * Check Morpheus service health
   */
  async checkHealth(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to connect to Morpheus service'
      );
    }
  }

  /**
   * Get current metrics from Morpheus
   */
  async getMetrics(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/metrics`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get metrics from Morpheus'
      );
    }
  }

  /**
   * Send prediction request to Morpheus
   */
  async predict(
    file: Express.Multer.File,
    modelName: string,
    parameters: string,
    analysisId: string
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
      formData.append('model', modelName);
      formData.append('parameters', parameters);
      formData.append('analysisId', analysisId);

      const response = await axios.post(`${this.baseUrl}/predict`, formData, {
        headers: formData.getHeaders(),
        timeout: 300000, // 5 minutes
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Prediction request failed'
      );
    }
  }
}

export default new MorpheusService();
