/**
 * Analysis Controller
 * Handles HTTP requests for analysis operations
 */

import { Request, Response } from 'express';
import { analysisService } from '../services';

export class AnalysisController {
  /**
   * POST /analyze
   * Create and start a new analysis
   */
  async createAnalysis(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const {
        model_name = 'abp',
        pipeline_batch_size,
        model_max_batch_size,
        num_threads
      } = req.body;

      // Parse and validate numeric parameters
      const pipelineBatchSize = pipeline_batch_size ? parseInt(pipeline_batch_size) : undefined;
      const modelMaxBatchSize = model_max_batch_size ? parseInt(model_max_batch_size) : undefined;
      const numThreads = num_threads ? parseInt(num_threads) : undefined;

      const result = await analysisService.createAnalysis(
        req.file,
        model_name,
        pipelineBatchSize,
        modelMaxBatchSize,
        numThreads
      );

      res.status(202).json(result);
    } catch (error) {
      console.error('Error in createAnalysis:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /results/:analysisId
   * Get analysis result by ID
   */
  async getAnalysisResult(req: Request, res: Response): Promise<void> {
    try {
      const { analysisId } = req.params;

      const result = await analysisService.getAnalysisResult(analysisId);

      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (message === 'Analysis not found') {
        res.status(404).json({ error: message });
        return;
      }

      console.error('Error in getAnalysisResult:', error);
      res.status(500).json({
        error: 'Internal server error',
        message,
      });
    }
  }

  /**
   * GET /metrics/:analysisId
   * Get analysis metrics by ID
   */
  async getAnalysisMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { analysisId } = req.params;

      const result = await analysisService.getAnalysisMetrics(analysisId);

      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (message === 'Analysis not found or no metrics available') {
        res.status(404).json({ error: message });
        return;
      }

      console.error('Error in getAnalysisMetrics:', error);
      res.status(500).json({
        error: 'Internal server error',
        message,
      });
    }
  }

  /**
   * GET /results
   * List all analyses with pagination
   */
  async listAnalyses(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const results = await analysisService.listAnalyses(limit, offset);

      res.status(200).json({
        results,
        pagination: {
          limit,
          offset,
          count: results.length,
        },
      });
    } catch (error) {
      console.error('Error in listAnalyses:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new AnalysisController();
