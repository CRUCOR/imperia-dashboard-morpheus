/**
 * Type definitions for the application
 */

// ============= Model Types =============

export type ModelType = 
  | 'digital-fingerprint'
  | 'sensitive-info'
  | 'cryptomining'
  | 'phishing'
  | 'fraud-detection'
  | 'ransomware';

export const MODEL_NAMES: Record<ModelType, string> = {
  'digital-fingerprint': 'Huellas Digitales',
  'sensitive-info': 'Información Confidencial',
  'cryptomining': 'Detección de Criptominería',
  'phishing': 'Detección de Phishing',
  'fraud-detection': 'Detección de Fraude',
  'ransomware': 'Detección de Ransomware'
};

export const MODEL_DESCRIPTIONS: Record<ModelType, string> = {
  'digital-fingerprint': 'Genera hashes únicos para identificar archivos y detectar duplicados',
  'sensitive-info': 'Detecta información personal, credenciales y API keys en datos',
  'cryptomining': 'Analiza tráfico de red para detectar actividad de minería de criptomonedas',
  'phishing': 'Identifica intentos de phishing en URLs, correos y contenido',
  'fraud-detection': 'Detecta transacciones fraudulentas y robo de identidad',
  'ransomware': 'Identifica amenazas de ransomware en archivos y comportamiento'
};

// ============= Service Status =============

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

// ============= Analysis Types =============

export interface Analysis {
  analysisId: string;
  modelName: ModelType | string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  statusLabel?: 'Pendiente' | 'Procesando' | 'Completado' | 'Fallido';
  createdAt: string;
  completedAt?: string;
  fileMetadata?: FileMetadata;
  inputData?: any;
  result?: AnalysisResult;
  durationMs?: number;
  error?: string;
  modelParameters?: ModelParameters;
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

// ============= Model Parameters =============

export type ModelParameters = 
  | CryptominingParameters
  | DigitalFingerprintParameters
  | SensitiveInfoParameters
  | PhishingParameters
  | FraudDetectionParameters
  | RansomwareParameters;

export interface CryptominingParameters {
  pipeline_batch_size?: number;
  model_max_batch_size?: number;
  num_threads?: number;
}

export interface DigitalFingerprintParameters {
  algorithm?: 'sha256' | 'md5' | 'ssdeep';
  include_metadata?: boolean;
}

export interface SensitiveInfoParameters {
  scan_pii?: boolean;
  scan_credentials?: boolean;
  scan_api_keys?: boolean;
  confidence_threshold?: number;
}

export interface PhishingParameters {
  check_urls?: boolean;
  check_emails?: boolean;
  analyze_content?: boolean;
}

export interface FraudDetectionParameters {
  transaction_threshold?: number;
  risk_level?: 'low' | 'medium' | 'high';
}

export interface RansomwareParameters {
  scan_encrypted_files?: boolean;
  check_extensions?: boolean;
  analyze_behavior?: boolean;
}

// ============= Model Results =============

export type AnalysisResult = 
  | DigitalFingerprintResult
  | SensitiveInfoResult
  | CryptominingResult
  | PhishingResult
  | FraudDetectionResult
  | RansomwareResult;

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

// ============= GPU & Progress =============

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

