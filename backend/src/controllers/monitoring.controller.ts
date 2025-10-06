/**
 * Monitoring Controller
 * Handles HTTP requests for monitoring and health checks
 */

import { Request, Response } from 'express';
import { monitoringService } from '../services';

export class MonitoringController {
  /**
   * GET /health
   * Health check endpoint
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const result = await monitoringService.healthCheck();
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in healthCheck:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /status
   * Get status of all services
   */
  async getServicesStatus(req: Request, res: Response): Promise<void> {
    try {
      const result = await monitoringService.getServicesStatus();
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getServicesStatus:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /metrics/global
   * Get global system metrics
   */
  async getGlobalMetrics(req: Request, res: Response): Promise<void> {
    try {
      const result = await monitoringService.getGlobalMetrics();
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getGlobalMetrics:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new MonitoringController();
