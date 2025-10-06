/**
 * Type definitions for the application
 */

export interface Service {
  status: 'healthy' | 'unhealthy' | 'unknown';
  timestamp?: string;
  error?: string;
  service?: string;
  model_loaded?: boolean;
  gpu_available?: boolean;
}

export interface ServicesStatus {
  backend: Service;
  postgres: Service;
  morpheus: Service;
}

export interface DashboardStats {
  totalAnalyses: number;
  analysesInProgress: number;
  completedAnalyses: number;
  recentAnalyses: Analysis[];
  services: ServicesStatus;
  gpu: {
    usage: number;
    memory: number;
  };
  timestamp: string;
}

export interface Analysis {
  analysisId: string;
  modelName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  statusLabel?: 'Pendiente' | 'Procesando' | 'Completado' | 'Fallido';
  createdAt: string;
  completedAt?: string;
  fileMetadata?: FileMetadata;
  inputData?: any;
  result?: any;
  durationMs?: number;
  error?: string;
  modelParameters?: any;
  metrics?: AnalysisMetrics;
}

export interface AnalysisMetrics {
  gpu_usage: GpuDataPoint[];
  gpu_memory: GpuDataPoint[];
  cpu_usage: GpuDataPoint[];
  ram_mb: GpuDataPoint[];
}

export interface FileMetadata {
  file_name: string;
  file_size_bytes: number;
  file_size_mb: number;
  file_type: string;
  num_rows?: number;
}

export interface GpuUsageHistory {
  current: {
    usage: number;
    memory: number;
  };
  history: GpuDataPoint[];
  timestamp: string;
}

export interface GpuDataPoint {
  timestamp: string;
  usage: number;
  memory: number;
}

export interface AnalysisProgress {
  analysisId: string;
  status: string;
  progress: number;
  message: string;
  gpuUsage?: number;
  gpuMemMb?: number;
  timestamp: string;
}

export interface UploadResponse {
  analysisId: string;
  status: string;
  message: string;
}
