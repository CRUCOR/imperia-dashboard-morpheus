import { useState } from 'react'
import {
  Search,
  Download,
  Eye,
  Share2,
  Archive,
  BarChart3,
  Filter,
  Calendar,
  FileText,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react'
import { clsx } from 'clsx'

interface ResultItem {
  id: string
  name: string
  analysisType: 'fraud-detection' | 'anomaly-detection' | 'phishing-detection' | 'pii-detection'
  sourceFile: string
  createdDate: string
  status: 'completed' | 'processing' | 'failed'
  format: 'csv' | 'json' | 'pdf' | 'xlsx'
  size: number
  summary: {
    totalRecords: number
    detections: number
    confidence: number
    processingTime: string
  }
  tags: string[]
  description?: string
}

const mockResults: ResultItem[] = [
  {
    id: '1',
    name: 'Análisis_Fraude_Transacciones_20240115',
    analysisType: 'fraud-detection',
    sourceFile: 'transacciones_financieras.csv',
    createdDate: '2024-01-15T10:32:15Z',
    status: 'completed',
    format: 'csv',
    size: 1024000, // 1MB
    summary: {
      totalRecords: 15847,
      detections: 234,
      confidence: 94.2,
      processingTime: '2.3s'
    },
    tags: ['finanzas', 'fraude', 'alta-prioridad'],
    description: 'Detección de transacciones fraudulentas en dataset bancario'
  },
  {
    id: '2',
    name: 'Detección_Phishing_Emails_20240115',
    analysisType: 'phishing-detection',
    sourceFile: 'emails_empresariales.csv',
    createdDate: '2024-01-15T09:47:30Z',
    status: 'completed',
    format: 'json',
    size: 512000, // 512KB
    summary: {
      totalRecords: 3456,
      detections: 67,
      confidence: 91.7,
      processingTime: '1.8s'
    },
    tags: ['email', 'phishing', 'seguridad'],
    description: 'Análisis de emails corporativos para detectar intentos de phishing'
  },
  {
    id: '3',
    name: 'Análisis_PII_Datos_Sensibles_20240114',
    analysisType: 'pii-detection',
    sourceFile: 'datos_sensibles_pii.csv',
    createdDate: '2024-01-14T17:13:45Z',
    status: 'completed',
    format: 'xlsx',
    size: 2048000, // 2MB
    summary: {
      totalRecords: 12340,
      detections: 445,
      confidence: 88.5,
      processingTime: '3.1s'
    },
    tags: ['pii', 'privacidad', 'gdpr', 'cumplimiento'],
    description: 'Identificación de información personal en dataset de usuarios'
  },
  {
    id: '4',
    name: 'Anomalías_Red_Corporativa_20240115',
    analysisType: 'anomaly-detection',
    sourceFile: 'logs_red_corporativa.json',
    createdDate: '2024-01-15T11:28:12Z',
    status: 'processing',
    format: 'csv',
    size: 0,
    summary: {
      totalRecords: 8920,
      detections: 0,
      confidence: 0,
      processingTime: ''
    },
    tags: ['red', 'anomalías', 'infraestructura'],
    description: 'Análisis de patrones anómalos en logs de red corporativa'
  },
  {
    id: '5',
    name: 'Fraude_Fallido_20240114',
    analysisType: 'fraud-detection',
    sourceFile: 'datos_corruptos.csv',
    createdDate: '2024-01-14T15:22:08Z',
    status: 'failed',
    format: 'csv',
    size: 0,
    summary: {
      totalRecords: 0,
      detections: 0,
      confidence: 0,
      processingTime: ''
    },
    tags: ['fraude', 'error', 'datos-corruptos'],
    description: 'Análisis fallido por datos de entrada corruptos'
  }
]

export function Results() {
  const [results] = useState<ResultItem[]>(mockResults)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedResults, setSelectedResults] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  const getAnalysisTypeIcon = (type: string) => {
    switch (type) {
      case 'fraud-detection':
        return <Shield className="w-5 h-5 text-red-500" />
      case 'anomaly-detection':
        return <TrendingUp className="w-5 h-5 text-orange-500" />
      case 'phishing-detection':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'pii-detection':
        return <FileText className="w-5 h-5 text-blue-500" />
      default:
        return <BarChart3 className="w-5 h-5 text-neutral-500" />
    }
  }

  const getAnalysisTypeName = (type: string) => {
    switch (type) {
      case 'fraud-detection':
        return 'Detección de Fraude'
      case 'anomaly-detection':
        return 'Detección de Anomalías'
      case 'phishing-detection':
        return 'Detección de Phishing'
      case 'pii-detection':
        return 'Detección de PII'
      default:
        return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-neutral-100 text-neutral-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado'
      case 'processing':
        return 'Procesando'
      case 'failed':
        return 'Fallido'
      default:
        return status
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv':
        return '📊'
      case 'json':
        return '📋'
      case 'pdf':
        return '📄'
      case 'xlsx':
        return '📈'
      default:
        return '📁'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredResults = results
    .filter(result => {
      const matchesSearch = result.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           result.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           result.sourceFile.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           result.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = filterStatus === 'all' || result.status === filterStatus
      const matchesType = filterType === 'all' || result.analysisType === filterType
      return matchesSearch && matchesStatus && matchesType
    })
    .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())

  const handleSelectResult = (resultId: string) => {
    setSelectedResults(prev =>
      prev.includes(resultId)
        ? prev.filter(id => id !== resultId)
        : [...prev, resultId]
    )
  }

  const handleSelectAll = () => {
    setSelectedResults(
      selectedResults.length === filteredResults.length
        ? []
        : filteredResults.map(result => result.id)
    )
  }

  const completedResults = results.filter(r => r.status === 'completed')
  const totalDetections = completedResults.reduce((sum, r) => sum + r.summary.detections, 0)
  const averageConfidence = completedResults.length > 0
    ? completedResults.reduce((sum, r) => sum + r.summary.confidence, 0) / completedResults.length
    : 0

  return (
    <div className="notebook-container">
      {/* Header */}
      <div className="notebook-cell">
        <div className="notebook-cell-header">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Resultados de Análisis</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Gestiona y exporta los resultados de tus análisis
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors">
              <Archive className="w-4 h-4" />
              <span>Archivar</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
              <Download className="w-4 h-4" />
              <span>Exportar Todo</span>
            </button>
          </div>
        </div>
        <div className="notebook-cell-content">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="metric-card">
              <div className="metric-value">{results.length}</div>
              <div className="metric-label">Total de Resultados</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{completedResults.length}</div>
              <div className="metric-label">Análisis Completados</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{totalDetections.toLocaleString()}</div>
              <div className="metric-label">Detecciones Totales</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{averageConfidence.toFixed(1)}%</div>
              <div className="metric-label">Confianza Promedio</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar resultados, archivos fuente o etiquetas..."
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="completed">Completados</option>
                <option value="processing">Procesando</option>
                <option value="failed">Fallidos</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">Todos los tipos</option>
                <option value="fraud-detection">Detección de Fraude</option>
                <option value="anomaly-detection">Detección de Anomalías</option>
                <option value="phishing-detection">Detección de Phishing</option>
                <option value="pii-detection">Detección de PII</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="notebook-cell">
        <div className="notebook-cell-header">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedResults.length === filteredResults.length && filteredResults.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
            />
            <span className="font-medium text-neutral-900">
              {selectedResults.length > 0 ? `${selectedResults.length} seleccionados` : 'Lista de Resultados'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {selectedResults.length > 0 && (
              <>
                <button className="p-2 text-neutral-400 hover:text-neutral-600 rounded transition-colors">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 text-neutral-400 hover:text-neutral-600 rounded transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
                <button className="p-2 text-neutral-400 hover:text-neutral-600 rounded transition-colors">
                  <Archive className="w-4 h-4" />
                </button>
              </>
            )}
            <span className="text-sm text-neutral-500">{filteredResults.length} resultados</span>
          </div>
        </div>
        <div className="notebook-cell-content">
          {filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900">No se encontraron resultados</h3>
              <p className="text-neutral-500 mt-1">
                {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Los resultados aparecerán aquí después de completar los análisis'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((result) => (
                <div
                  key={result.id}
                  className={clsx(
                    'p-4 border rounded-lg transition-colors',
                    selectedResults.includes(result.id)
                      ? 'border-orange-200 bg-orange-50'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  )}
                >
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedResults.includes(result.id)}
                      onChange={() => handleSelectResult(result.id)}
                      className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500 mt-1"
                    />

                    <div className="flex-shrink-0 mt-0.5">
                      {getAnalysisTypeIcon(result.analysisType)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-neutral-900 truncate">
                          {result.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={clsx(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            getStatusColor(result.status)
                          )}>
                            {getStatusText(result.status)}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {getFormatIcon(result.format)} {result.format.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-neutral-600 mb-2">
                        <span className="font-medium">{getAnalysisTypeName(result.analysisType)}</span>
                        <span>•</span>
                        <span>Fuente: {result.sourceFile}</span>
                        <span>•</span>
                        <span>{formatDate(result.createdDate)}</span>
                      </div>

                      {result.description && (
                        <p className="text-sm text-neutral-600 mb-3">{result.description}</p>
                      )}

                      {result.status === 'completed' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 p-3 bg-neutral-50 rounded-lg">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-neutral-900">
                              {result.summary.totalRecords.toLocaleString()}
                            </div>
                            <div className="text-xs text-neutral-500">Registros</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-orange-600">
                              {result.summary.detections}
                            </div>
                            <div className="text-xs text-neutral-500">Detecciones</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">
                              {result.summary.confidence.toFixed(1)}%
                            </div>
                            <div className="text-xs text-neutral-500">Confianza</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-blue-600">
                              {result.summary.processingTime}
                            </div>
                            <div className="text-xs text-neutral-500">Tiempo</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {result.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center space-x-1">
                          {result.size > 0 && (
                            <span className="text-xs text-neutral-500">{formatFileSize(result.size)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {result.status === 'completed' && (
                        <>
                          <button
                            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
                            title="Descargar"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
                            title="Compartir"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}