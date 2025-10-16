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
        model_name = 'cryptomining',
        // General parameters
        pipeline_batch_size,
        model_max_batch_size,
        num_threads,
        // Digital Fingerprint
        algorithm,
        include_metadata,
        // Sensitive Info
        scan_pii,
        scan_credentials,
        scan_api_keys,
        confidence_threshold,
        // Phishing
        check_urls,
        check_emails,
        analyze_content,
        // Fraud Detection
        transaction_threshold,
        risk_level,
        // Ransomware
        scan_encrypted_files,
        check_extensions,
        analyze_behavior
      } = req.body;

      // Build model parameters based on model type
      const modelParameters: any = {};

      // Add common parameters
      if (pipeline_batch_size) modelParameters.pipeline_batch_size = parseInt(pipeline_batch_size);
      if (model_max_batch_size) modelParameters.model_max_batch_size = parseInt(model_max_batch_size);
      if (num_threads) modelParameters.num_threads = parseInt(num_threads);

      // Add model-specific parameters
      switch (model_name) {
        case 'digital-fingerprint':
          if (algorithm) modelParameters.algorithm = algorithm;
          if (include_metadata !== undefined) modelParameters.include_metadata = include_metadata === 'true';
          break;
        
        case 'sensitive-info':
          if (scan_pii !== undefined) modelParameters.scan_pii = scan_pii === 'true';
          if (scan_credentials !== undefined) modelParameters.scan_credentials = scan_credentials === 'true';
          if (scan_api_keys !== undefined) modelParameters.scan_api_keys = scan_api_keys === 'true';
          if (confidence_threshold) modelParameters.confidence_threshold = parseFloat(confidence_threshold);
          break;
        
        case 'phishing':
          if (check_urls !== undefined) modelParameters.check_urls = check_urls === 'true';
          if (check_emails !== undefined) modelParameters.check_emails = check_emails === 'true';
          if (analyze_content !== undefined) modelParameters.analyze_content = analyze_content === 'true';
          break;
        
        case 'fraud-detection':
          if (transaction_threshold) modelParameters.transaction_threshold = parseFloat(transaction_threshold);
          if (risk_level) modelParameters.risk_level = risk_level;
          break;
        
        case 'ransomware':
          if (scan_encrypted_files !== undefined) modelParameters.scan_encrypted_files = scan_encrypted_files === 'true';
          if (check_extensions !== undefined) modelParameters.check_extensions = check_extensions === 'true';
          if (analyze_behavior !== undefined) modelParameters.analyze_behavior = analyze_behavior === 'true';
          break;
      }

      const result = await analysisService.createAnalysis(
        req.file,
        model_name,
        Object.keys(modelParameters).length > 0 ? modelParameters : undefined
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

  /**
   * GET /predictions/:analysisId
   * Get predictions for an analysis with pagination
   */
  async getPredictions(req: Request, res: Response): Promise<void> {
    try {
      const { analysisId } = req.params;
      const limit = parseInt(req.query.limit as string) || 1000;
      const offset = parseInt(req.query.offset as string) || 0;
      const miningOnly = req.query.miningOnly === 'true';

      const predictions = await analysisService.getPredictions(
        analysisId,
        limit,
        offset,
        miningOnly
      );

      res.status(200).json({
        analysisId,
        predictions,
        pagination: {
          limit,
          offset,
          count: predictions.length,
        },
      });
    } catch (error) {
      console.error('Error in getPredictions:', error);
      
      if (error instanceof Error && error.message === 'Analysis not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new AnalysisController();
