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
   * For large files (>50MB), only store metadata to avoid PostgreSQL JSONB 256MB limit
   */
  private async extractInputData(file: Express.Multer.File): Promise<any> {
    const fileSizeMB = file.size / (1024 * 1024);
    
    // Check if file is jsonlines
    if (file.originalname.toLowerCase().endsWith('.jsonlines') ||
        file.originalname.toLowerCase().endsWith('.jsonl') ||
        file.originalname.toLowerCase().endsWith('.ndjson')) {
      const parsed = this.parseJsonlines(file.buffer);
      
      // For large files, only store summary to avoid database size issues
      if (fileSizeMB > 50) {
        console.log(`[extractInputData] Large file detected (${fileSizeMB.toFixed(2)}MB). Storing metadata only.`);
        return {
          type: 'jsonlines',
          num_rows: parsed.length,
          file_size_mb: parseFloat(fileSizeMB.toFixed(2)),
          preview_note: 'Data preview omitted for large files',
          sample_first: parsed.slice(0, 10), // First 10 rows
          sample_last: parsed.slice(-10)     // Last 10 rows
        };
      }
      
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
    modelName: string = 'cryptomining',
    modelParameters?: any
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
      modelParameters
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
    modelParameters?: any
  ): Promise<void> {
    const startTime = Date.now();
    let metricsInterval: NodeJS.Timeout | null = null;

    try {
      console.log(`[${analysisId}] Starting analysis with model: ${modelName}`);
      console.log(`[${analysisId}] Parameters:`, modelParameters);

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

      // Send to Morpheus/Triton with model parameters
      const result = await morpheusService.predict(
        file,
        modelName,
        analysisId,
        modelParameters
      );
      const duration = Date.now() - startTime;

      console.log(`[${analysisId}] Analysis completed in ${duration}ms`);

      // Store result in database
      await databaseService.updateAnalysisResult(analysisId, 'completed', result, duration);

      // Get updated analysis for real-time notification
      const completedAnalysis = await databaseService.getAnalysisById(analysisId);

      if (completedAnalysis) {
        // Emit status change event with full result (including ALL predictions)
        // The full result is sent via Socket.IO for real-time display
        socketService.emitStatusChange(
          analysisId,
          'completed',
          'processing',
          {
            analysisId: completedAnalysis.id,
            modelName: completedAnalysis.model_name,
            status: completedAnalysis.status,
            result: result, // Send FULL result with predictions via Socket.IO
            duration_ms: completedAnalysis.duration_ms,
            created_at: completedAnalysis.created_at,
            completed_at: completedAnalysis.completed_at
          }
        );

        // Emit analysis completed event with full result
        socketService.emitAnalysisCompleted(analysisId, {
          analysisId: completedAnalysis.id,
          modelName: completedAnalysis.model_name,
          result: result, // Send FULL result with predictions via Socket.IO
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
   * Loads predictions from predictions table with pagination support
   */
  async getAnalysisResult(analysisId: string): Promise<AnalysisResultResponse> {
    const analysis = await databaseService.getAnalysisById(analysisId);

    if (!analysis) {
      throw new Error('Analysis not found');
    }

    // For completed analyses, load predictions from predictions table
    let predictions = [];
    if (analysis.status === 'completed' && analysis.result) {
      // Load first 10,000 predictions by default (can be paginated from frontend)
      predictions = await databaseService.getPredictions(analysisId, 10000, 0);
      
      console.log(`[${analysisId}] Loaded ${predictions.length} predictions from database`);
    }

    // Merge predictions into result object
    const resultWithPredictions = analysis.result ? {
      ...analysis.result,
      predictions: predictions
    } : undefined;

    return {
      analysisId: analysis.id,
      modelName: analysis.model_name,
      status: analysis.status,
      inputData: analysis.input_data,
      result: resultWithPredictions,
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

  /**
   * Get predictions for an analysis with pagination
   */
  async getPredictions(
    analysisId: string,
    limit: number = 1000,
    offset: number = 0,
    miningOnly: boolean = false
  ): Promise<any[]> {
    // Verify analysis exists
    const analysis = await databaseService.getAnalysisById(analysisId);
    if (!analysis) {
      throw new Error('Analysis not found');
    }

    // Get predictions from predictions table
    return await databaseService.getPredictions(analysisId, limit, offset, miningOnly);
  }
}

export default new AnalysisService();
