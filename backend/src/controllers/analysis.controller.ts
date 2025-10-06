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

      const { modelName = 'abp', parameters = '{}' } = req.body;

      const result = await analysisService.createAnalysis(req.file, modelName, parameters);

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
}

export default new AnalysisController();
