/**
 * Monitoring Service
 * Handles system monitoring and health checks
 */

import databaseService from './database.service';
import morpheusService from './morpheus.service';
import { ServicesStatusResponse, GlobalMetricsResponse } from '../models';
import { pool } from '../config/database';

export class MonitoringService {
  /**
   * Get status of all services
   */
  async getServicesStatus(): Promise<ServicesStatusResponse> {
    const services: ServicesStatusResponse = {
      backend: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
      postgres: {
        status: 'unknown',
      },
      morpheus: {
        status: 'unknown',
      },
    };

    // Check PostgreSQL
    try {
      const isConnected = await databaseService.testConnection();
      services.postgres.status = isConnected ? 'healthy' : 'unhealthy';
    } catch (error) {
      services.postgres.status = 'unhealthy';
      services.postgres.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Check Morpheus/Triton
    try {
      const morpheusHealth = await morpheusService.checkHealth();
      services.morpheus = {
        status: 'healthy',
        ...morpheusHealth,
      };
    } catch (error) {
      services.morpheus.status = 'unhealthy';
      services.morpheus.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return services;
  }

  /**
   * Get global system metrics
   */
  async getGlobalMetrics(): Promise<GlobalMetricsResponse> {
    try {
      // Get metrics from Morpheus/Triton
      const morpheusMetrics = await morpheusService.getMetrics();

      // Get service status
      const servicesStatus = await this.getServicesStatus();

      return {
        gpu_usage: morpheusMetrics.gpu_usage || 0,
        gpu_mem_mb: morpheusMetrics.gpu_mem_mb || 0,
        cpu_usage: morpheusMetrics.cpu_usage || 0,
        ram_mb: morpheusMetrics.ram_mb || 0,
        services: servicesStatus,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get global metrics'
      );
    }
  }

  /**
   * Health check for backend service
   */
  async healthCheck(): Promise<{ status: string; service: string; timestamp: string }> {
    return {
      status: 'healthy',
      service: 'backend',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<any> {
    try {
      // Get total analyses count
      const totalAnalysesResult = await pool.query(
        'SELECT COUNT(*) as count FROM analyses'
      );
      const totalAnalyses = parseInt(totalAnalysesResult.rows[0].count);

      // Get analyses in progress
      const inProgressResult = await pool.query(
        "SELECT COUNT(*) as count FROM analyses WHERE status IN ('pending', 'processing')"
      );
      const analysesInProgress = parseInt(inProgressResult.rows[0].count);

      // Get recent analyses (last 10)
      const recentAnalysesResult = await pool.query(
        'SELECT id, model_name, status, created_at, completed_at FROM analyses ORDER BY created_at DESC LIMIT 10'
      );

      // Get services status
      const servicesStatus = await this.getServicesStatus();

      // Get GPU metrics
      let gpuUsage = 0;
      let gpuMemory = 0;
      try {
        const metrics = await morpheusService.getMetrics();
        gpuUsage = metrics.gpu_usage || 0;
        gpuMemory = metrics.gpu_mem_mb || 0;
      } catch (error) {
        console.error('Error getting GPU metrics:', error);
      }

      return {
        totalAnalyses,
        analysesInProgress,
        completedAnalyses: totalAnalyses - analysesInProgress,
        recentAnalyses: recentAnalysesResult.rows.map((row: any) => ({
          analysisId: row.id,
          modelName: row.model_name,
          status: row.status,
          createdAt: row.created_at,
          completedAt: row.completed_at,
        })),
        services: servicesStatus,
        gpu: {
          usage: gpuUsage,
          memory: gpuMemory,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get dashboard stats'
      );
    }
  }

  /**
   * Get GPU usage history (simulated for now, can be enhanced with actual tracking)
   */
  async getGpuUsageHistory(): Promise<any> {
    try {
      // Get last 60 records (5 minutes at 5-second intervals)
      const result = await pool.query(
        `SELECT 
          usage, 
          memory_mb as "memoryMb",
          timestamp
         FROM gpu_metrics 
         ORDER BY timestamp DESC 
         LIMIT 60`
      );

      // Reverse to get chronological order (oldest first)
      const history = result.rows.reverse().map((row: any) => ({
        timestamp: row.timestamp,
        usage: parseFloat(row.usage),
        memory: parseFloat(row.memoryMb),
      }));

      // Get current metrics
      let currentUsage = 0;
      let currentMemory = 0;
      
      if (history.length > 0) {
        const latest = history[history.length - 1];
        currentUsage = latest.usage;
        currentMemory = latest.memory;
      } else {
        // If no historical data, try to get current from Morpheus
        try {
          const metrics = await morpheusService.getMetrics();
          currentUsage = metrics.gpu_usage || 0;
          currentMemory = metrics.gpu_mem_mb || 0;
        } catch (error) {
          console.error('Error getting current GPU metrics:', error);
        }
      }

      return {
        current: {
          usage: currentUsage,
          memory: currentMemory,
        },
        history,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get GPU usage history'
      );
    }
  }

  /**
   * Save GPU metrics to database
   * Should be called every 5 seconds
   */
  async saveGpuMetrics(): Promise<void> {
    try {
      const metrics = await morpheusService.getMetrics();
      
      await pool.query(
        `INSERT INTO gpu_metrics (usage, memory_mb, timestamp)
         VALUES ($1, $2, NOW())`,
        [metrics.gpu_usage || 0, metrics.gpu_mem_mb || 0]
      );

      // Clean old data - keep only last 24 hours
      await pool.query(
        `DELETE FROM gpu_metrics 
         WHERE timestamp < NOW() - INTERVAL '24 hours'`
      );
    } catch (error) {
      console.error('Error saving GPU metrics:', error);
    }
  }

  /**
   * Start GPU metrics collection
   * Collects metrics every 5 seconds
   */
  startGpuMetricsCollection(): void {
    // Save metrics every 5 seconds
    setInterval(async () => {
      await this.saveGpuMetrics();
    }, 5000);

    // Initial save
    this.saveGpuMetrics();
    
    console.log('GPU metrics collection started (every 5 seconds)');
  }
}

export default new MonitoringService();
