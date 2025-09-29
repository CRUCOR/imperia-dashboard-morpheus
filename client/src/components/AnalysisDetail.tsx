import { useState } from 'react'
import {
  ArrowLeft,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Shield,
  TrendingUp,
  FileText,
  Eye,
  ZoomIn,
  Settings,
  Copy,
  Code,
  Database
} from 'lucide-react'

interface AnalysisDetailProps {
  analysisId: string
  onBack: () => void
}

// Mock data para el detalle del análisis
const mockAnalysisDetail = {
  id: '1',
  fileName: 'transacciones_financieras.csv',
  modelName: 'Detección de Fraude v2.1',
  modelId: 'fraud-detection',
  status: 'completed',
  startTime: '2024-01-15T10:30:00Z',
  endTime: '2024-01-15T10:32:15Z',
  parameters: {
    threshold: 0.85,
    model_type: 'bert',
    enable_preprocessing: true,
    sensitivity: 0.8,
    window_size: 60,
    algorithm: 'isolation_forest'
  },
  configuration: {
    pipeline: 'fraud_detection_v2',
    version: '2.1.3',
    environment: 'production',
    resources: {
      cpu_cores: 4,
      memory_gb: 8,
      gpu_enabled: true
    }
  },
  inputData: {
    rows: 15847,
    columns: 12,
    size: '2.4 MB',
    format: 'CSV'
  },
  results: {
    totalAnomalies: 234,
    highRiskTransactions: 89,
    mediumRiskTransactions: 145,
    averageConfidence: 0.942,
    processingTime: '2.3s',
    falsePositiveRate: 0.03,
    summary: {
      recordsProcessed: 15847,
      recordsWithAnomalies: 234,
      percentageAnomalous: 1.48,
      modelAccuracy: 94.2,
      recallScore: 0.891,
      precisionScore: 0.923,
      f1Score: 0.907
    },
    output: {
      format: 'JSON',
      totalSize: '1.2 MB',
      structure: {
        metadata: {
          analysis_id: '1',
          timestamp: '2024-01-15T10:32:15Z',
          model_version: '2.1.3',
          input_file: 'transacciones_financieras.csv'
        },
        statistics: {
          total_transactions: 15847,
          flagged_transactions: 234,
          risk_distribution: {
            high: 89,
            medium: 145,
            low: 0
          },
          confidence_distribution: {
            '0.9-1.0': 89,
            '0.8-0.9': 98,
            '0.7-0.8': 47,
            'below_0.7': 0
          }
        },
        sample_detections: [
          {
            transaction_id: 'TXN_78341_001',
            amount: 15750.00,
            risk_score: 0.95,
            risk_category: 'high',
            fraud_indicators: ['unusual_amount', 'atypical_location', 'off_hours'],
            user_id: 'USER_7834',
            timestamp: '2024-01-15T10:45:23Z',
            location: 'Madrid, España',
            device_fingerprint: 'unknown_device'
          },
          {
            transaction_id: 'TXN_45212_003',
            amount: 2300.00,
            risk_score: 0.78,
            risk_category: 'medium',
            fraud_indicators: ['high_frequency', 'repetitive_pattern'],
            user_id: 'USER_4521',
            timestamp: '2024-01-15T10:43:15Z',
            location: 'Barcelona, España',
            device_fingerprint: 'known_device_new_pattern'
          }
        ]
      }
    }
  },
  detections: [
    {
      id: 1,
      timestamp: '2024-01-15 10:45:23',
      type: 'Fraude Potencial',
      severity: 'Alto',
      confidence: 0.95,
      amount: 15750.00,
      description: 'Transacción fuera del patrón habitual del usuario',
      location: 'Madrid, España',
      userId: 'USER_7834',
      details: {
        riskFactors: ['Monto inusual', 'Horario atípico', 'Ubicación diferente'],
        similarCases: 12,
        recommendation: 'Bloquear transacción y contactar usuario'
      }
    },
    {
      id: 2,
      timestamp: '2024-01-15 10:43:15',
      type: 'Anomalía de Comportamiento',
      severity: 'Medio',
      confidence: 0.78,
      amount: 2300.00,
      description: 'Múltiples transacciones en corto período',
      location: 'Barcelona, España',
      userId: 'USER_4521',
      details: {
        riskFactors: ['Frecuencia alta', 'Patrón repetitivo'],
        similarCases: 5,
        recommendation: 'Monitorear actividad adicional'
      }
    },
    {
      id: 3,
      timestamp: '2024-01-15 10:41:07',
      type: 'Transacción Sospechosa',
      severity: 'Alto',
      confidence: 0.89,
      amount: 8950.00,
      description: 'Método de pago no habitual para el usuario',
      location: 'Valencia, España',
      userId: 'USER_2198',
      details: {
        riskFactors: ['Nuevo método de pago', 'Monto elevado', 'Comercio no habitual'],
        similarCases: 8,
        recommendation: 'Verificación adicional requerida'
      }
    }
  ],
  charts: {
    riskDistribution: {
      high: 89,
      medium: 145,
      low: 234
    },
    timelineData: [
      { time: '10:30', detections: 5 },
      { time: '10:35', detections: 12 },
      { time: '10:40', detections: 23 },
      { time: '10:45', detections: 31 },
      { time: '10:50', detections: 18 },
      { time: '10:55', detections: 8 }
    ]
  },
  analyzedRows: [
    {
      id: 'TXN_78341_001',
      timestamp: '2024-01-15 10:45:23',
      user_id: 'USER_7834',
      amount: 15750.00,
      merchant: 'Electrónica Madrid S.L.',
      location: 'Madrid, España',
      payment_method: 'Tarjeta débito',
      risk_score: 0.95,
      risk_category: 'high',
      is_fraud: true,
      fraud_indicators: ['unusual_amount', 'atypical_location', 'off_hours']
    },
    {
      id: 'TXN_45212_003',
      timestamp: '2024-01-15 10:43:15',
      user_id: 'USER_4521',
      amount: 2300.00,
      merchant: 'Supermercado Barcelona',
      location: 'Barcelona, España',
      payment_method: 'Tarjeta crédito',
      risk_score: 0.78,
      risk_category: 'medium',
      is_fraud: false,
      fraud_indicators: ['high_frequency', 'repetitive_pattern']
    },
    {
      id: 'TXN_91283_012',
      timestamp: '2024-01-15 10:41:07',
      user_id: 'USER_2198',
      amount: 8950.00,
      merchant: 'Joyas Valencia Premium',
      location: 'Valencia, España',
      payment_method: 'Transferencia',
      risk_score: 0.89,
      risk_category: 'high',
      is_fraud: true,
      fraud_indicators: ['new_payment_method', 'high_amount', 'unusual_merchant']
    },
    {
      id: 'TXN_56742_008',
      timestamp: '2024-01-15 10:39:42',
      user_id: 'USER_8931',
      amount: 127.50,
      merchant: 'Farmacia Central',
      location: 'Sevilla, España',
      payment_method: 'Tarjeta débito',
      risk_score: 0.65,
      risk_category: 'medium',
      is_fraud: false,
      fraud_indicators: ['unusual_location']
    },
    {
      id: 'TXN_34567_045',
      timestamp: '2024-01-15 10:37:18',
      user_id: 'USER_1045',
      amount: 45.90,
      merchant: 'Cafetería Bilbao',
      location: 'Bilbao, España',
      payment_method: 'Contactless',
      risk_score: 0.23,
      risk_category: 'low',
      is_fraud: false,
      fraud_indicators: []
    },
    {
      id: 'TXN_78234_091',
      timestamp: '2024-01-15 10:35:55',
      user_id: 'USER_5623',
      amount: 890.00,
      merchant: 'Tienda Online Tech',
      location: 'Online',
      payment_method: 'PayPal',
      risk_score: 0.72,
      risk_category: 'medium',
      is_fraud: false,
      fraud_indicators: ['online_purchase', 'new_device']
    },
    {
      id: 'TXN_12389_067',
      timestamp: '2024-01-15 10:33:22',
      user_id: 'USER_7892',
      amount: 12500.00,
      merchant: 'Concesionario Auto Madrid',
      location: 'Madrid, España',
      payment_method: 'Transferencia bancaria',
      risk_score: 0.94,
      risk_category: 'high',
      is_fraud: true,
      fraud_indicators: ['very_high_amount', 'unusual_merchant_category', 'first_time_merchant']
    },
    {
      id: 'TXN_99874_023',
      timestamp: '2024-01-15 10:31:45',
      user_id: 'USER_3456',
      amount: 67.80,
      merchant: 'Gasolinera Repsol',
      location: 'Zaragoza, España',
      payment_method: 'Tarjeta crédito',
      risk_score: 0.31,
      risk_category: 'low',
      is_fraud: false,
      fraud_indicators: []
    }
  ]
}

export function AnalysisDetail({ analysisId, onBack }: AnalysisDetailProps) {
  const [selectedDetection, setSelectedDetection] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'parameters' | 'output' | 'detections' | 'charts' | 'rows'>('overview')

  const detail = mockAnalysisDetail

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Alto':
        return 'text-red-700 bg-red-100 border-red-200'
      case 'Medio':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'Bajo':
        return 'text-blue-700 bg-blue-100 border-blue-200'
      default:
        return 'text-neutral-700 bg-neutral-100 border-neutral-200'
    }
  }

  return (
    <div className="notebook-container">
      {/* Header */}
      <div className="notebook-cell">
        <div className="notebook-cell-header">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-1 hover:bg-neutral-200 rounded transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">Detalle del Análisis</h1>
              <p className="text-sm text-neutral-600">{detail.fileName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>
        <div className="notebook-cell-content">
          {/* Status and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="metric-value text-green-600">Completado</div>
                  <div className="metric-label">Estado</div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="metric-value">{detail.results.totalAnomalies}</div>
                  <div className="metric-label">Anomalías Detectadas</div>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="metric-value">{(detail.results.averageConfidence * 100).toFixed(1)}%</div>
                  <div className="metric-label">Confianza Promedio</div>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="metric-value">{detail.results.processingTime}</div>
                  <div className="metric-label">Tiempo de Procesamiento</div>
                </div>
                <Clock className="w-8 h-8 text-neutral-500" />
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-neutral-200 mb-6">
            <nav className="flex space-x-8 overflow-x-auto">
              {[
                { id: 'overview', name: 'Resumen', icon: BarChart3 },
                { id: 'parameters', name: 'Parámetros', icon: Settings },
                { id: 'output', name: 'Output', icon: FileText },
                { id: 'detections', name: 'Detecciones', icon: Shield },
                { id: 'charts', name: 'Gráficos', icon: TrendingUp },
                { id: 'rows', name: 'Filas Analizadas', icon: Database }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="notebook-cell">
          <div className="notebook-cell-header">
            <span className="font-medium text-neutral-900">Información General</span>
          </div>
          <div className="notebook-cell-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Input Data */}
              <div className="data-card">
                <h3 className="font-semibold text-neutral-900 mb-4">Datos de Entrada</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Archivo:</span>
                    <span className="font-medium">{detail.fileName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Filas:</span>
                    <span className="font-medium">{detail.inputData.rows.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Columnas:</span>
                    <span className="font-medium">{detail.inputData.columns}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Tamaño:</span>
                    <span className="font-medium">{detail.inputData.size}</span>
                  </div>
                </div>
              </div>

              {/* Model Parameters */}
              <div className="data-card">
                <h3 className="font-semibold text-neutral-900 mb-4">Parámetros del Modelo</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Modelo:</span>
                    <span className="font-medium">{detail.modelName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Umbral:</span>
                    <span className="font-medium">{detail.parameters.threshold}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Tipo:</span>
                    <span className="font-medium">{detail.parameters.model_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Preprocesamiento:</span>
                    <span className="font-medium">{detail.parameters.enable_preprocessing ? 'Sí' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Summary */}
            <div className="mt-6 data-card">
              <h3 className="font-semibold text-neutral-900 mb-4">Resumen de Resultados</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">{detail.results.highRiskTransactions}</div>
                  <div className="text-sm text-red-600">Alto Riesgo</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-700">{detail.results.mediumRiskTransactions}</div>
                  <div className="text-sm text-yellow-600">Riesgo Medio</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{(detail.results.falsePositiveRate * 100).toFixed(1)}%</div>
                  <div className="text-sm text-green-600">Falsos Positivos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'parameters' && (
        <div className="notebook-cell">
          <div className="notebook-cell-header">
            <span className="font-medium text-neutral-900">Configuración del Modelo</span>
            <button className="flex items-center space-x-2 px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors">
              <Copy className="w-4 h-4" />
              <span>Copiar Configuración</span>
            </button>
          </div>
          <div className="notebook-cell-content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Model Parameters */}
              <div className="data-card">
                <h3 className="font-semibold text-neutral-900 mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-orange-500" />
                  Parámetros del Modelo
                </h3>
                <div className="space-y-3">
                  {Object.entries(detail.parameters).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-2 bg-neutral-50 rounded">
                      <span className="text-neutral-600 font-medium">{key.replace(/_/g, ' ')}:</span>
                      <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                        {typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Configuration */}
              <div className="data-card">
                <h3 className="font-semibold text-neutral-900 mb-4 flex items-center">
                  <Database className="w-5 h-5 mr-2 text-blue-500" />
                  Configuración del Pipeline
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-neutral-50 rounded">
                    <span className="text-neutral-600 font-medium">Pipeline:</span>
                    <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                      {detail.configuration.pipeline}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-neutral-50 rounded">
                    <span className="text-neutral-600 font-medium">Versión:</span>
                    <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                      {detail.configuration.version}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-neutral-50 rounded">
                    <span className="text-neutral-600 font-medium">Entorno:</span>
                    <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                      {detail.configuration.environment}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resources */}
              <div className="data-card lg:col-span-2">
                <h3 className="font-semibold text-neutral-900 mb-4">Recursos Utilizados</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{detail.configuration.resources.cpu_cores}</div>
                    <div className="text-sm text-blue-600">CPU Cores</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{detail.configuration.resources.memory_gb} GB</div>
                    <div className="text-sm text-green-600">Memoria RAM</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-700">
                      {detail.configuration.resources.gpu_enabled ? 'SÍ' : 'NO'}
                    </div>
                    <div className="text-sm text-purple-600">GPU Aceleración</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Command Line */}
            <div className="mt-6 p-4 bg-neutral-900 rounded-lg">
              <h4 className="text-white font-medium mb-2">Comando Ejecutado</h4>
              <div className="font-mono text-green-400 text-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-yellow-400">$</span>
                  <span>morpheus run --pipeline {detail.configuration.pipeline}</span>
                </div>
                <div className="ml-4 space-y-1">
                  <div>--input {detail.fileName}</div>
                  {Object.entries(detail.parameters).map(([key, value]) => (
                    <div key={key}>--{key} {String(value)}</div>
                  ))}
                  <div>--output ./results/{detail.id}/</div>
                  <div>--format json</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'output' && (
        <div className="notebook-cell">
          <div className="notebook-cell-header">
            <span className="font-medium text-neutral-900">Salida del Análisis</span>
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors">
                <Copy className="w-4 h-4" />
                <span>Copiar JSON</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                <Download className="w-4 h-4" />
                <span>Descargar</span>
              </button>
            </div>
          </div>
          <div className="notebook-cell-content">
            {/* Output Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="metric-card">
                <div className="metric-value">{detail.results.output.format}</div>
                <div className="metric-label">Formato de Salida</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{detail.results.output.totalSize}</div>
                <div className="metric-label">Tamaño del Archivo</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{detail.results.summary.recordsProcessed.toLocaleString()}</div>
                <div className="metric-label">Registros Procesados</div>
              </div>
            </div>

            {/* Model Performance Metrics */}
            <div className="data-card mb-6">
              <h3 className="font-semibold text-neutral-900 mb-4">Métricas de Rendimiento del Modelo</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-700">{detail.results.summary.modelAccuracy}%</div>
                  <div className="text-sm text-green-600">Precisión</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-700">{(detail.results.summary.recallScore * 100).toFixed(1)}%</div>
                  <div className="text-sm text-blue-600">Recall</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-700">{(detail.results.summary.precisionScore * 100).toFixed(1)}%</div>
                  <div className="text-sm text-purple-600">Precisión</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-xl font-bold text-orange-700">{(detail.results.summary.f1Score * 100).toFixed(1)}%</div>
                  <div className="text-sm text-orange-600">F1-Score</div>
                </div>
              </div>
            </div>

            {/* JSON Output Structure */}
            <div className="data-card">
              <h3 className="font-semibold text-neutral-900 mb-4">Estructura de la Salida JSON</h3>
              <div className="bg-neutral-900 p-4 rounded-lg overflow-x-auto">
                <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
{JSON.stringify(detail.results.output.structure, null, 2)}
                </pre>
              </div>
            </div>

            {/* Sample Output Data */}
            <div className="data-card mt-6">
              <h3 className="font-semibold text-neutral-900 mb-4">Distribución de Detecciones</h3>
              <div className="overflow-hidden">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rango de Confianza</th>
                      <th>Cantidad</th>
                      <th>Porcentaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(detail.results.output.structure.statistics.confidence_distribution).map(([range, count]) => (
                      <tr key={range}>
                        <td className="font-medium">{range}</td>
                        <td>{count}</td>
                        <td>{((count / detail.results.totalAnomalies) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'detections' && (
        <div className="notebook-cell">
          <div className="notebook-cell-header">
            <span className="font-medium text-neutral-900">Detecciones Detalladas</span>
            <span className="text-sm text-neutral-500">{detail.detections.length} elementos</span>
          </div>
          <div className="notebook-cell-content">
            <div className="space-y-4">
              {detail.detections.map((detection) => (
                <div key={detection.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                  <div
                    className="p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                    onClick={() => setSelectedDetection(selectedDetection === detection.id ? null : detection.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(detection.severity)}`}>
                          {detection.severity}
                        </div>
                        <div>
                          <h4 className="font-medium text-neutral-900">{detection.type}</h4>
                          <p className="text-sm text-neutral-600">{detection.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-neutral-900">€{detection.amount.toLocaleString()}</div>
                        <div className="text-sm text-neutral-500">{detection.confidence * 100}% confianza</div>
                      </div>
                    </div>
                  </div>

                  {selectedDetection === detection.id && (
                    <div className="border-t border-neutral-200 bg-neutral-50 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-neutral-900 mb-2">Detalles</h5>
                          <div className="space-y-2 text-sm">
                            <div><strong>Usuario:</strong> {detection.userId}</div>
                            <div><strong>Ubicación:</strong> {detection.location}</div>
                            <div><strong>Timestamp:</strong> {detection.timestamp}</div>
                            <div><strong>Casos similares:</strong> {detection.details.similarCases}</div>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium text-neutral-900 mb-2">Factores de Riesgo</h5>
                          <div className="space-y-1">
                            {detection.details.riskFactors.map((factor, index) => (
                              <div key={index} className="text-sm bg-white px-2 py-1 rounded border">
                                {factor}
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                            <strong>Recomendación:</strong> {detection.details.recommendation}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'charts' && (
        <div className="space-y-6">
          <div className="notebook-cell">
            <div className="notebook-cell-header">
              <span className="font-medium text-neutral-900">Distribución de Riesgos</span>
            </div>
            <div className="notebook-cell-content">
              <div className="chart-container">
                <div className="h-64 flex items-center justify-center bg-neutral-100 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
                    <p className="text-neutral-600">Gráfico de distribución de riesgos</p>
                    <p className="text-sm text-neutral-500">Alto: {detail.charts.riskDistribution.high} | Medio: {detail.charts.riskDistribution.medium} | Bajo: {detail.charts.riskDistribution.low}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="notebook-cell">
            <div className="notebook-cell-header">
              <span className="font-medium text-neutral-900">Timeline de Detecciones</span>
            </div>
            <div className="notebook-cell-content">
              <div className="chart-container">
                <div className="h-64 flex items-center justify-center bg-neutral-100 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
                    <p className="text-neutral-600">Timeline de detecciones a lo largo del tiempo</p>
                    <div className="mt-2 flex justify-center space-x-4 text-sm text-neutral-500">
                      {detail.charts.timelineData.map((point, index) => (
                        <span key={index}>{point.time}: {point.detections}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rows' && (
        <div className="notebook-cell">
          <div className="notebook-cell-header">
            <span className="font-medium text-neutral-900">Filas Analizadas</span>
            <span className="text-sm text-neutral-500">{detail.analyzedRows.length} transacciones</span>
          </div>
          <div className="notebook-cell-content">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID Transacción</th>
                    <th>Timestamp</th>
                    <th>Usuario</th>
                    <th>Monto</th>
                    <th>Comercio</th>
                    <th>Ubicación</th>
                    <th>Método de Pago</th>
                    <th>Puntuación de Riesgo</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                    <th>Indicadores</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.analyzedRows.map((row) => (
                    <tr key={row.id}>
                      <td className="font-mono text-sm">{row.id}</td>
                      <td className="text-sm">{row.timestamp}</td>
                      <td className="font-mono text-sm">{row.user_id}</td>
                      <td className="text-right font-semibold">€{row.amount.toLocaleString()}</td>
                      <td>{row.merchant}</td>
                      <td>{row.location}</td>
                      <td>{row.payment_method}</td>
                      <td className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          row.risk_score >= 0.8 ? 'bg-red-100 text-red-800' :
                          row.risk_score >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {(row.risk_score * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          row.risk_category === 'high' ? 'bg-red-100 text-red-800' :
                          row.risk_category === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {row.risk_category === 'high' ? 'Alto' :
                           row.risk_category === 'medium' ? 'Medio' : 'Bajo'}
                        </span>
                      </td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          row.is_fraud ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {row.is_fraud ? 'Fraude' : 'Normal'}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {row.fraud_indicators.map((indicator, index) => (
                            <span
                              key={index}
                              className="px-1 py-0.5 bg-orange-100 text-orange-700 text-xs rounded"
                            >
                              {indicator.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Stats for Analyzed Rows */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="metric-card">
                <div className="metric-value text-red-600">
                  {detail.analyzedRows.filter(row => row.is_fraud).length}
                </div>
                <div className="metric-label">Transacciones Fraudulentas</div>
              </div>
              <div className="metric-card">
                <div className="metric-value text-orange-600">
                  {detail.analyzedRows.filter(row => row.risk_category === 'high').length}
                </div>
                <div className="metric-label">Alto Riesgo</div>
              </div>
              <div className="metric-card">
                <div className="metric-value text-yellow-600">
                  {detail.analyzedRows.filter(row => row.risk_category === 'medium').length}
                </div>
                <div className="metric-label">Riesgo Medio</div>
              </div>
              <div className="metric-card">
                <div className="metric-value text-blue-600">
                  €{detail.analyzedRows.reduce((sum, row) => sum + row.amount, 0).toLocaleString()}
                </div>
                <div className="metric-label">Monto Total Analizado</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}