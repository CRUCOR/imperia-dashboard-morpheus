/**
 * Monitoring Service
 * Handles system monitoring and health checks
 */

import databaseService from './database.service';
import morpheusService from './morpheus.service';
import { ServicesStatusResponse, GlobalMetricsResponse } from '../models';

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
}

export default new MonitoringService();
