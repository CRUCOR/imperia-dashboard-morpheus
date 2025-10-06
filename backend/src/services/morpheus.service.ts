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
    analysisId: string,
    pipelineBatchSize?: number,
    modelMaxBatchSize?: number,
    numThreads?: number
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
      formData.append('model_name', modelName);
      formData.append('analysisId', analysisId);

      // Add ABP parameters if provided
      if (pipelineBatchSize !== undefined) {
        formData.append('pipeline_batch_size', pipelineBatchSize.toString());
      }
      if (modelMaxBatchSize !== undefined) {
        formData.append('model_max_batch_size', modelMaxBatchSize.toString());
      }
      if (numThreads !== undefined) {
        formData.append('num_threads', numThreads.toString());
      }

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
