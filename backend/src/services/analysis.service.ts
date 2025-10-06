/**
 * Analysis Service
 * Business logic for analysis operations
 */

import databaseService from './database.service';
import morpheusService from './morpheus.service';
import {
  AnalysisResponse,
  AnalysisResultResponse,
  AnalysisMetricsResponse,
} from '../models';

export class AnalysisService {
  /**
   * Generate unique analysis ID
   */
  generateAnalysisId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `analysis_${timestamp}_${random}`;
  }

  /**
   * Create and start a new analysis
   */
  async createAnalysis(
    file: Express.Multer.File,
    modelName: string = 'abp',
    parameters: string = '{}'
  ): Promise<AnalysisResponse> {
    const analysisId = this.generateAnalysisId();

    // Create analysis record in database
    await databaseService.createAnalysis(analysisId, modelName);

    // Start async processing
    this.processAnalysis(analysisId, file, modelName, parameters).catch((error) => {
      console.error(`[${analysisId}] Error processing analysis:`, error);
    });

    return {
      analysisId,
      status: 'processing',
      message: 'Analysis started successfully',
    };
  }

  /**
   * Process analysis in background
   */
  private async processAnalysis(
    analysisId: string,
    file: Express.Multer.File,
    modelName: string,
    parameters: string
  ): Promise<void> {
    const startTime = Date.now();
    let metricsInterval: NodeJS.Timeout | null = null;

    try {
      console.log(`[${analysisId}] Starting analysis with model: ${modelName}`);

      // Start collecting metrics every 5 seconds
      metricsInterval = setInterval(async () => {
        try {
          const metrics = await morpheusService.getMetrics();

          await databaseService.insertAnalysisMetric(
            analysisId,
            metrics.gpu_usage || 0,
            metrics.gpu_mem_mb || 0,
            metrics.cpu_usage || 0,
            metrics.ram_mb || 0,
            Date.now() - startTime,
            metrics.throughput || 0
          );
        } catch (error) {
          console.error(`[${analysisId}] Error collecting metrics:`, error);
        }
      }, 5000);

      // Send to Morpheus/Triton
      const result = await morpheusService.predict(file, modelName, parameters, analysisId);
      const duration = Date.now() - startTime;

      // Update analysis with result
      await databaseService.updateAnalysisResult(analysisId, 'completed', result, duration);

      console.log(`[${analysisId}] Analysis completed in ${duration}ms`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await databaseService.updateAnalysisError(analysisId, errorMessage);
      console.error(`[${analysisId}] Analysis failed:`, errorMessage);
    } finally {
      if (metricsInterval) {
        clearInterval(metricsInterval);
      }
    }
  }

  /**
   * Get analysis result by ID
   */
  async getAnalysisResult(analysisId: string): Promise<AnalysisResultResponse> {
    const analysis = await databaseService.getAnalysisById(analysisId);

    if (!analysis) {
      throw new Error('Analysis not found');
    }

    return {
      analysisId: analysis.id,
      modelName: analysis.model_name,
      status: analysis.status,
      result: analysis.result,
      duration_ms: analysis.duration_ms,
      error: analysis.error,
      created_at: analysis.created_at,
      completed_at: analysis.completed_at,
    };
  }

  /**
   * Get analysis metrics by ID
   */
  async getAnalysisMetrics(analysisId: string): Promise<AnalysisMetricsResponse> {
    const metrics = await databaseService.getAnalysisMetrics(analysisId);

    if (metrics.length === 0) {
      throw new Error('Analysis not found or no metrics available');
    }

    return {
      analysisId,
      metrics,
    };
  }
}

export default new AnalysisService();
