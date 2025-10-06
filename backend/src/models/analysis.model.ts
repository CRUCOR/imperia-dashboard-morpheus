/**
 * Analysis Model
 * Represents the structure of an analysis in the system
 */

export interface Analysis {
  id: string;
  model_name: string;
  status: 'processing' | 'completed' | 'failed';
  input_data?: any;
  result?: any;
  duration_ms?: number;
  error?: string;
  file_metadata?: FileMetadata;
  model_parameters?: ABPParameters;
  metrics?: {
    gpu_usage: Array<{ timestamp: Date; usage: number }>;
    gpu_memory: Array<{ timestamp: Date; memory: number }>;
    cpu_usage: Array<{ timestamp: Date; usage: number }>;
    ram_mb: Array<{ timestamp: Date; memory: number }>;
  };
  created_at: Date;
  completed_at?: Date;
}

export interface FileMetadata {
  file_name: string;
  file_size_bytes: number;
  file_size_mb: number;
  num_rows?: number;
  num_columns?: number;
  file_type?: string;
}

export interface ABPParameters {
  pipeline_batch_size?: number;
  model_max_batch_size?: number;
  num_threads?: number;
}

export interface AnalysisMetric {
  id: number;
  analysis_id: string;
  gpu_usage: number;
  gpu_mem_mb: number;
  cpu_usage: number;
  ram_mb: number;
  duration_ms: number;
  throughput: number;
  timestamp: Date;
}

export interface GlobalMetric {
  id: number;
  gpu_usage: number;
  gpu_mem_mb: number;
  cpu_usage: number;
  ram_mb: number;
  services_status: any;
  timestamp: Date;
}

export interface CreateAnalysisRequest {
  file: Express.Multer.File;
  modelName?: string;
  pipelineBatchSize?: number;
  modelMaxBatchSize?: number;
  numThreads?: number;
}

export interface AnalysisResponse {
  analysisId: string;
  status: string;
  message: string;
}

export interface AnalysisResultResponse {
  analysisId: string;
  modelName: string;
  status: string;
  inputData?: any;
  result?: any;
  durationMs?: number;
  error?: string;
  fileMetadata?: FileMetadata;
  modelParameters?: ABPParameters;
  metrics?: {
    gpu_usage: Array<{ timestamp: Date; usage: number }>;
    gpu_memory: Array<{ timestamp: Date; memory: number }>;
    cpu_usage: Array<{ timestamp: Date; usage: number }>;
    ram_mb: Array<{ timestamp: Date; memory: number }>;
  };
  createdAt: Date;
  completedAt?: Date;
}

export interface AnalysisMetricsResponse {
  analysisId: string;
  metrics: AnalysisMetric[];
}
