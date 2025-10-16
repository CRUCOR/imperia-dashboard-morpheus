/**
 * Analysis Model
 * Represents the structure of an analysis in the system
 */

// Model types supported by the system
export type ModelType = 
  | 'digital-fingerprint'
  | 'sensitive-info'
  | 'cryptomining'
  | 'phishing'
  | 'fraud-detection'
  | 'ransomware';

export interface Analysis {
  id: string;
  model_name: ModelType;
  status: 'processing' | 'completed' | 'failed';
  input_data?: any;
  result?: AnalysisResult;
  duration_ms?: number;
  error?: string;
  file_metadata?: FileMetadata;
  model_parameters?: ModelParameters;
  metrics?: {
    gpu_usage: Array<{ timestamp: Date; usage: number }>;
    gpu_memory: Array<{ timestamp: Date; memory: number }>;
    cpu_usage: Array<{ timestamp: Date; usage: number }>;
    ram_mb: Array<{ timestamp: Date; memory: number }>;
  };
  created_at: Date;
  completed_at?: Date;
}

// Union type for all possible analysis results
export type AnalysisResult = 
  | DigitalFingerprintResult
  | SensitiveInfoResult
  | CryptominingResult
  | PhishingResult
  | FraudDetectionResult
  | RansomwareResult;

export interface FileMetadata {
  file_name: string;
  file_size_bytes: number;
  file_size_mb: number;
  num_rows?: number;
  num_columns?: number;
  file_type?: string;
}

// ============= Model Parameters =============

export type ModelParameters = 
  | ABPParameters
  | DigitalFingerprintParameters
  | SensitiveInfoParameters
  | PhishingParameters
  | FraudDetectionParameters
  | RansomwareParameters;

export interface ABPParameters {
  model_type: 'cryptomining';
  pipeline_batch_size?: number;
  model_max_batch_size?: number;
  num_threads?: number;
}

export interface DigitalFingerprintParameters {
  model_type: 'digital-fingerprint';
  algorithm?: 'sha256' | 'md5' | 'ssdeep';
  include_metadata?: boolean;
}

export interface SensitiveInfoParameters {
  model_type: 'sensitive-info';
  scan_pii?: boolean;
  scan_credentials?: boolean;
  scan_api_keys?: boolean;
  confidence_threshold?: number;
}

export interface PhishingParameters {
  model_type: 'phishing';
  check_urls?: boolean;
  check_emails?: boolean;
  analyze_content?: boolean;
}

export interface FraudDetectionParameters {
  model_type: 'fraud-detection';
  transaction_threshold?: number;
  risk_level?: 'low' | 'medium' | 'high';
}

export interface RansomwareParameters {
  model_type: 'ransomware';
  scan_encrypted_files?: boolean;
  check_extensions?: boolean;
  analyze_behavior?: boolean;
}

// ============= Model Results =============

export interface BaseResult {
  analysisId: string;
  model: string;
  num_rows: number;
  metadata: {
    file_name: string;
    file_size_mb: number;
    processing_time_sec: number;
    gpu_used: boolean;
  };
}

export interface DigitalFingerprintResult extends BaseResult {
  fingerprints: Array<{
    file_path?: string;
    algorithm: string;
    hash: string;
    size_bytes: number;
    created_at?: string;
    modified_at?: string;
  }>;
  statistics: {
    total_files: number;
    unique_hashes: number;
    duplicates: number;
  };
}

export interface SensitiveInfoResult extends BaseResult {
  findings: Array<{
    row_id: number;
    type: 'pii' | 'credential' | 'api_key' | 'credit_card' | 'ssn' | 'email' | 'phone';
    content: string;
    confidence: number;
    location: {
      line?: number;
      column?: number;
      field?: string;
    };
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  statistics: {
    total_findings: number;
    by_type: Record<string, number>;
    by_severity: Record<string, number>;
    high_risk_items: number;
  };
}

export interface CryptominingResult extends BaseResult {
  predictions: Array<{
    row_id: number;
    prediction: {
      is_mining: boolean;
      mining_probability: number;
      regular_probability: number;
      confidence: number;
      anomaly_score: number;
      detected_patterns: Array<{
        pattern: string;
        description: string;
        severity: string;
      }>;
    };
    packet_info: {
      src_ip: string;
      dest_ip: string;
      src_port: number;
      dest_port: number;
      protocol: string;
      data_len: number;
      timestamp: string;
    };
  }>;
  statistics: {
    total_packets: number;
    mining_detected: number;
    regular_traffic: number;
    mining_rate: number;
    suspicious_ips: Array<{
      ip: string;
      mining_packets: number;
    }>;
  };
}

export interface PhishingResult extends BaseResult {
  detections: Array<{
    row_id: number;
    is_phishing: boolean;
    phishing_probability: number;
    indicators: Array<{
      type: 'url' | 'domain' | 'content' | 'sender' | 'attachment';
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      score: number;
    }>;
    source: {
      url?: string;
      email?: string;
      subject?: string;
      sender?: string;
    };
  }>;
  statistics: {
    total_analyzed: number;
    phishing_detected: number;
    legitimate: number;
    phishing_rate: number;
    by_severity: Record<string, number>;
  };
}

export interface FraudDetectionResult extends BaseResult {
  transactions: Array<{
    transaction_id: string;
    is_fraudulent: boolean;
    fraud_probability: number;
    risk_score: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    anomalies: Array<{
      type: string;
      description: string;
      impact: number;
    }>;
    transaction_data: {
      amount?: number;
      timestamp?: string;
      location?: string;
      user_id?: string;
      ip_address?: string;
    };
  }>;
  statistics: {
    total_transactions: number;
    fraudulent: number;
    legitimate: number;
    fraud_rate: number;
    total_amount_at_risk: number;
    by_risk_level: Record<string, number>;
  };
}

export interface RansomwareResult extends BaseResult {
  threats: Array<{
    row_id: number;
    is_ransomware: boolean;
    ransomware_probability: number;
    threat_level: 'low' | 'medium' | 'high' | 'critical';
    indicators: Array<{
      type: 'file_extension' | 'encryption' | 'behavior' | 'signature';
      description: string;
      matched: boolean;
    }>;
    file_info: {
      path?: string;
      name?: string;
      extension?: string;
      size_bytes?: number;
      is_encrypted?: boolean;
    };
  }>;
  statistics: {
    total_files: number;
    ransomware_detected: number;
    clean_files: number;
    infection_rate: number;
    by_threat_level: Record<string, number>;
  };
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
  modelName?: ModelType;
  modelParameters?: ModelParameters;
}

export interface AnalysisResponse {
  analysisId: string;
  status: string;
  message: string;
}

export interface AnalysisResultResponse {
  analysisId: string;
  modelName: ModelType;
  status: string;
  inputData?: any;
  result?: AnalysisResult;
  durationMs?: number;
  error?: string;
  fileMetadata?: FileMetadata;
  modelParameters?: ModelParameters;
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
