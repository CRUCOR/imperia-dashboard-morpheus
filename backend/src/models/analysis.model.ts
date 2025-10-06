/**
 * Analysis Model
 * Represents the structure of an analysis in the system
 */

export interface Analysis {
  id: string;
  model_name: string;
  status: 'processing' | 'completed' | 'failed';
  result?: any;
  duration_ms?: number;
  error?: string;
  created_at: Date;
  completed_at?: Date;
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
  parameters?: string;
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
  result?: any;
  duration_ms?: number;
  error?: string;
  created_at: Date;
  completed_at?: Date;
}

export interface AnalysisMetricsResponse {
  analysisId: string;
  metrics: AnalysisMetric[];
}
