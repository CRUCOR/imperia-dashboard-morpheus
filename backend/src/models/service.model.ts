/**
 * Service Model
 * Represents the structure of service status and metrics
 */

export interface ServiceStatus {
  status: 'healthy' | 'unhealthy' | 'unknown';
  timestamp?: string;
  error?: string;
  [key: string]: any;
}

export interface ServicesStatusResponse {
  backend: ServiceStatus;
  postgres: ServiceStatus;
  morpheus: ServiceStatus;
}

export interface GlobalMetricsResponse {
  gpu_usage: number;
  gpu_mem_mb: number;
  cpu_usage: number;
  ram_mb: number;
  services: ServicesStatusResponse;
  timestamp: string;
}

export interface HealthCheckResponse {
  status: string;
  service: string;
  timestamp: string;
}
