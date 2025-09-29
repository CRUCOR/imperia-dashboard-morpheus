import { useState } from 'react'
import {
  Activity,
  BarChart3,
  Database,
  Download,
  Play,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react'

// Datos mock para análisis de Morpheus Nvidia
const mockDatasetInfo = {
  name: 'dataset_transacciones_financieras.csv',
  size: '2.4 MB',
  rows: 15847,
  columns: 12,
  uploadTime: '2024-01-15 10:30:00',
  status: 'processed'
}

const mockAnalysisResults = {
  totalAnomalies: 234,
  suspiciousTransactions: 89,
  confidenceScore: 94.2,
  threatLevel: 'Medium',
  processingTime: '2.3s',
  modelsUsed: ['Fraud Detection', 'Anomaly Detection', 'Behavioral Analysis']
}

const mockMetrics = [
  { label: 'Anomalías Detectadas', value: '234', change: '+12%', type: 'warning' },
  { label: 'Transacciones Procesadas', value: '15,847', change: '+5%', type: 'success' },
  { label: 'Precisión del Modelo', value: '94.2%', change: '+1.2%', type: 'success' },
  { label: 'Tiempo de Procesamiento', value: '2.3s', change: '-0.5s', type: 'success' }
]

const mockDetections = [
  { id: 1, type: 'Fraude Potencial', severity: 'Alto', confidence: 0.92, timestamp: '10:45:23', details: 'Transacción fuera de patrón normal' },
  { id: 2, type: 'Anomalía de Comportamiento', severity: 'Medio', confidence: 0.78, timestamp: '10:43:15', details: 'Patrón de acceso inusual' },
  { id: 3, type: 'Actividad Sospechosa', severity: 'Alto', confidence: 0.89, timestamp: '10:41:07', details: 'Múltiples transacciones en corto tiempo' },
  { id: 4, type: 'Detección de Riesgo', severity: 'Bajo', confidence: 0.65, timestamp: '10:39:42', details: 'Ubicación geográfica inusual' },
  { id: 5, type: 'Fraude Potencial', severity: 'Alto', confidence: 0.95, timestamp: '10:37:18', details: 'Monto fuera del rango típico' }
]

const mockModelsStatus = [
  { name: 'Fraud Detection v2.1', status: 'active', accuracy: 94.2, lastUpdate: '2024-01-15' },
  { name: 'Anomaly Detection v1.8', status: 'active', accuracy: 91.7, lastUpdate: '2024-01-14' },
  { name: 'Behavioral Analysis v3.0', status: 'training', accuracy: 89.3, lastUpdate: '2024-01-13' }
]

export function Dashboard() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleRunAnalysis = () => {
    setIsAnalyzing(true)
    setTimeout(() => setIsAnalyzing(false), 3000)
  }

  return (
    <div className="notebook-container">
      {/* Header Overview */}
      <div className="notebook-cell">
        <div className="notebook-cell-header">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-neutral-600" />
            <span className="font-medium text-neutral-900">Resumen del Dataset</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="status-dot success"></span>
            <span className="text-sm text-neutral-600">Procesado</span>
          </div>
        </div>
        <div className="notebook-cell-content">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="data-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Archivo</p>
                  <p className="font-semibold text-neutral-900">{mockDatasetInfo.name}</p>
                </div>
                <Database className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-xs text-neutral-500 mt-2">{mockDatasetInfo.size}</p>
            </div>
            <div className="data-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Filas</p>
                  <p className="font-semibold text-neutral-900">{mockDatasetInfo.rows.toLocaleString()}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-xs text-neutral-500 mt-2">{mockDatasetInfo.columns} columnas</p>
            </div>
            <div className="data-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Estado</p>
                  <p className="font-semibold text-green-600">Completado</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-xs text-neutral-500 mt-2">Hace 2 horas</p>
            </div>
            <div className="data-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-500">Tiempo</p>
                  <p className="font-semibold text-neutral-900">{mockAnalysisResults.processingTime}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-xs text-neutral-500 mt-2">Procesamiento</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="notebook-cell">
        <div className="notebook-cell-header">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-neutral-600" />
            <span className="font-medium text-neutral-900">Métricas de Análisis</span>
          </div>
        </div>
        <div className="notebook-cell-content">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {mockMetrics.map((metric, index) => (
              <div key={index} className="metric-card">
                <div className="metric-value">{metric.value}</div>
                <div className="metric-label">{metric.label}</div>
                <div className={`metric-change ${metric.type === 'success' ? 'positive' : metric.type === 'warning' ? 'negative' : ''}`}>
                  {metric.change}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis Execution */}
      <div className="notebook-cell">
        <div className="notebook-cell-header">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-neutral-600" />
            <span className="font-medium text-neutral-900">Ejecución de Análisis</span>
          </div>
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>{isAnalyzing ? 'Analizando...' : 'Ejecutar Análisis'}</span>
          </button>
        </div>
        <div className="notebook-cell-content">
          <div className="notebook-cell-code">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-yellow-400">$</span>
              <span>morpheus run --pipeline fraud_detection --input {mockDatasetInfo.name} --confidence 0.85</span>
            </div>
            {isAnalyzing && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-3 h-3 border border-green-400 border-t-transparent rounded-full"></div>
                  <span>Cargando datos de entrada...</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-3 h-3 border border-green-400 border-t-transparent rounded-full"></div>
                  <span>Inicializando modelos de Morpheus...</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-3 h-3 border border-green-400 border-t-transparent rounded-full"></div>
                  <span>Procesando {mockDatasetInfo.rows.toLocaleString()} registros...</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-3 h-3 border border-green-400 border-t-transparent rounded-full"></div>
                  <span>Ejecutando detección de anomalías...</span>
                </div>
              </div>
            )}
            {!isAnalyzing && (
              <div className="space-y-1 text-green-400">
                <p>✓ Análisis completado exitosamente</p>
                <p>✓ {mockAnalysisResults.totalAnomalies} anomalías detectadas</p>
                <p>✓ Precisión del modelo: {mockAnalysisResults.confidenceScore}%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detection Results */}
      <div className="notebook-cell">
        <div className="notebook-cell-header">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-neutral-600" />
            <span className="font-medium text-neutral-900">Detecciones de Seguridad</span>
          </div>
          <button className="flex items-center space-x-2 px-3 py-1 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors">
            <Download className="w-4 h-4" />
            <span>Exportar Resultados</span>
          </button>
        </div>
        <div className="notebook-cell-content">
          <div className="space-y-3">
            {mockDetections.map((detection) => (
              <div key={detection.id} className="p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`status-dot ${detection.severity === 'Alto' ? 'error' : detection.severity === 'Medio' ? 'warning' : 'info'}`}></div>
                    <div>
                      <h4 className="font-medium text-neutral-900">{detection.type}</h4>
                      <p className="text-sm text-neutral-600">{detection.details}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-neutral-900">
                      {(detection.confidence * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-neutral-500">{detection.timestamp}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Models Status */}
      <div className="notebook-cell">
        <div className="notebook-cell-header">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-neutral-600" />
            <span className="font-medium text-neutral-900">Estado de Modelos</span>
          </div>
        </div>
        <div className="notebook-cell-content">
          <div className="overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>Estado</th>
                  <th>Precisión</th>
                  <th>Última Actualización</th>
                </tr>
              </thead>
              <tbody>
                {mockModelsStatus.map((model, index) => (
                  <tr key={index}>
                    <td className="font-medium">{model.name}</td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        model.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {model.status === 'active' ? 'Activo' : 'Entrenando'}
                      </span>
                    </td>
                    <td>{model.accuracy}%</td>
                    <td>{model.lastUpdate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}