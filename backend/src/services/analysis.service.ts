/**
 * Analysis Service
 * Business logic for analysis operations
 */

import databaseService from './database.service';
import morpheusService from './morpheus.service';
import socketService from './socket.service';
import {
  AnalysisResponse,
  AnalysisResultResponse,
  AnalysisMetricsResponse,
  FileMetadata,
  ABPParameters,
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
   * Extract file metadata
   */
  private extractFileMetadata(file: Express.Multer.File): FileMetadata {
    return {
      file_name: file.originalname,
      file_size_bytes: file.size,
      file_size_mb: file.size / (1024 * 1024),
      file_type: file.mimetype
    };
  }

  /**
   * Parse jsonlines input file
   */
  private parseJsonlines(buffer: Buffer): any[] {
    try {
      const content = buffer.toString('utf-8');
      const lines = content.trim().split('\n');
      const parsed = lines
        .filter(line => line.trim().length > 0)
        .map(line => JSON.parse(line));

      return parsed;
    } catch (error) {
      console.error('Error parsing jsonlines:', error);
      return [];
    }
  }

  /**
   * Extract input data from file
   */
  private async extractInputData(file: Express.Multer.File): Promise<any> {
    // Check if file is jsonlines
    if (file.originalname.toLowerCase().endsWith('.jsonlines') ||
        file.originalname.toLowerCase().endsWith('.jsonl') ||
        file.originalname.toLowerCase().endsWith('.ndjson')) {
      const parsed = this.parseJsonlines(file.buffer);
      return {
        type: 'jsonlines',
        num_rows: parsed.length,
        data: parsed.slice(0, 100) // Store first 100 rows for preview
      };
    }

    // For other file types, store basic info
    return {
      type: 'binary',
      preview: 'Binary file content not displayed'
    };
  }

  /**
   * Create and start a new analysis
   */
  async createAnalysis(
    file: Express.Multer.File,
    modelName: string = 'abp',
    pipelineBatchSize?: number,
    modelMaxBatchSize?: number,
    numThreads?: number
  ): Promise<AnalysisResponse> {
    const analysisId = this.generateAnalysisId();

    // Extract file metadata
    const fileMetadata = this.extractFileMetadata(file);

    // Add num_rows to metadata if jsonlines
    if (file.originalname.toLowerCase().endsWith('.jsonlines') ||
        file.originalname.toLowerCase().endsWith('.jsonl') ||
        file.originalname.toLowerCase().endsWith('.ndjson')) {
      const parsed = this.parseJsonlines(file.buffer);
      (fileMetadata as any).num_rows = parsed.length;
    }

    // Build model parameters
    const modelParameters: ABPParameters | undefined =
      pipelineBatchSize !== undefined || modelMaxBatchSize !== undefined || numThreads !== undefined
        ? {
            pipeline_batch_size: pipelineBatchSize,
            model_max_batch_size: modelMaxBatchSize,
            num_threads: numThreads
          }
        : undefined;

    // Create analysis record in database
    await databaseService.createAnalysis(analysisId, modelName, fileMetadata, modelParameters);

    // Extract and store input data asynchronously
    this.extractInputData(file).then(inputData => {
      databaseService.updateAnalysisInput(analysisId, inputData).catch(err => {
        console.error(`[${analysisId}] Error storing input data:`, err);
      });
    });

    // Start async processing
    this.processAnalysis(
      analysisId,
      file,
      modelName,
      pipelineBatchSize,
      modelMaxBatchSize,
      numThreads
    ).catch((error) => {
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
    pipelineBatchSize?: number,
    modelMaxBatchSize?: number,
    numThreads?: number
  ): Promise<void> {
    const startTime = Date.now();
    let metricsInterval: NodeJS.Timeout | null = null;

    try {
      console.log(`[${analysisId}] Starting analysis with model: ${modelName}`);
      console.log(`[${analysisId}] Parameters: pipeline_batch_size=${pipelineBatchSize}, model_max_batch_size=${modelMaxBatchSize}, num_threads=${numThreads}`);

      // Start collecting metrics every 1 second
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
      }, 1000);

      // Send to Morpheus/Triton with ABP parameters
      const result = await morpheusService.predict(
        file,
        modelName,
        analysisId,
        pipelineBatchSize,
        modelMaxBatchSize,
        numThreads
      );
      const duration = Date.now() - startTime;

      // Update analysis with result
      await databaseService.updateAnalysisResult(analysisId, 'completed', result, duration);

      console.log(`[${analysisId}] Analysis completed in ${duration}ms`);

      // Get updated analysis for real-time notification
      const completedAnalysis = await databaseService.getAnalysisById(analysisId);

      if (completedAnalysis) {
        // Emit status change event
        socketService.emitStatusChange(
          analysisId,
          'completed',
          'processing',
          {
            analysisId: completedAnalysis.id,
            modelName: completedAnalysis.model_name,
            status: completedAnalysis.status,
            result: completedAnalysis.result,
            duration_ms: completedAnalysis.duration_ms,
            created_at: completedAnalysis.created_at,
            completed_at: completedAnalysis.completed_at
          }
        );

        // Emit analysis completed event
        socketService.emitAnalysisCompleted(analysisId, {
          analysisId: completedAnalysis.id,
          modelName: completedAnalysis.model_name,
          result: completedAnalysis.result,
          duration_ms: completedAnalysis.duration_ms,
          created_at: completedAnalysis.created_at,
          completed_at: completedAnalysis.completed_at
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await databaseService.updateAnalysisError(analysisId, errorMessage);
      console.error(`[${analysisId}] Analysis failed:`, errorMessage);

      // Get failed analysis for real-time notification
      const failedAnalysis = await databaseService.getAnalysisById(analysisId);

      if (failedAnalysis) {
        // Emit status change event
        socketService.emitStatusChange(
          analysisId,
          'failed',
          'processing',
          {
            analysisId: failedAnalysis.id,
            modelName: failedAnalysis.model_name,
            status: failedAnalysis.status,
            error: failedAnalysis.error,
            created_at: failedAnalysis.created_at,
            completed_at: failedAnalysis.completed_at
          }
        );

        // Emit analysis failed event
        socketService.emitAnalysisFailed(analysisId, errorMessage, {
          analysisId: failedAnalysis.id,
          modelName: failedAnalysis.model_name,
          error: failedAnalysis.error,
          created_at: failedAnalysis.created_at,
          completed_at: failedAnalysis.completed_at
        });
      }
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
      inputData: analysis.input_data,
      result: analysis.result,
      durationMs: analysis.duration_ms,
      error: analysis.error,
      fileMetadata: analysis.file_metadata,
      modelParameters: analysis.model_parameters,
      metrics: analysis.metrics,
      createdAt: analysis.created_at,
      completedAt: analysis.completed_at,
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

  /**
   * List all analyses with pagination
   */
  async listAnalyses(limit: number = 50, offset: number = 0): Promise<AnalysisResultResponse[]> {
    const analyses = await databaseService.listAnalyses(limit, offset);

    return analyses.map(analysis => ({
      analysisId: analysis.id,
      modelName: analysis.model_name,
      status: analysis.status,
      inputData: analysis.input_data,
      result: analysis.result,
      durationMs: analysis.duration_ms,
      error: analysis.error,
      fileMetadata: analysis.file_metadata,
      modelParameters: analysis.model_parameters,
      createdAt: analysis.created_at,
      completedAt: analysis.completed_at,
    }));
  }
}

export default new AnalysisService();
