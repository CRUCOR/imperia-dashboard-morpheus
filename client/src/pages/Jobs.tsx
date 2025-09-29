import { useState } from 'react'
import { Download, Eye, Clock, CheckCircle, XCircle, Loader, RefreshCw, Search } from 'lucide-react'
import { clsx } from 'clsx'
import type { ProcessingJob } from '@/types'

// Datos mock en español con escenarios de Morpheus Nvidia
const mockJobs: ProcessingJob[] = [
  {
    id: '1',
    fileName: 'transacciones_financieras.csv',
    modelId: 'deteccion-fraude',
    parameters: { threshold: 0.85, model_type: 'bert' },
    status: 'completed',
    startTime: '2024-01-15T10:30:00Z',
    endTime: '2024-01-15T10:32:15Z',
    inputData: { rows: 15847, columns: 12 },
    outputData: { detections: 234, confidence: 0.94 },
  },
  {
    id: '2',
    fileName: 'logs_red_corporativa.json',
    modelId: 'deteccion-anomalias',
    parameters: { entities: 'Network', confidence: 0.78 },
    status: 'processing',
    startTime: '2024-01-15T11:15:00Z',
    inputData: { rows: 8920, columns: 8 },
  },
  {
    id: '3',
    fileName: 'emails_empresariales.csv',
    modelId: 'deteccion-phishing',
    parameters: { threshold: 0.9, model_type: 'roberta' },
    status: 'completed',
    startTime: '2024-01-15T09:45:00Z',
    endTime: '2024-01-15T09:47:30Z',
    inputData: { rows: 3456, columns: 5 },
    outputData: { detections: 67, confidence: 0.91 },
  },
  {
    id: '4',
    fileName: 'trafico_web.log',
    modelId: 'analisis-comportamiento',
    parameters: { threshold: 0.8, model_type: 'distilbert' },
    status: 'failed',
    startTime: '2024-01-15T08:20:00Z',
    endTime: '2024-01-15T08:22:15Z',
    error: 'Formato de entrada inválido: Se esperaba CSV, se recibió LOG',
  },
  {
    id: '5',
    fileName: 'datos_sensibles_pii.csv',
    modelId: 'deteccion-informacion-sensible',
    parameters: { entities: 'PII', confidence: 0.75 },
    status: 'completed',
    startTime: '2024-01-15T07:10:00Z',
    endTime: '2024-01-15T07:13:45Z',
    inputData: { rows: 12340, columns: 9 },
    outputData: { detections: 445, confidence: 0.88 },
  },
]

export function Jobs() {
  const [jobs] = useState<ProcessingJob[]>(mockJobs)
  const [searchTerm, setSearchTerm] = useState('')

  const getStatusIcon = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'processing':
        return <Loader className="w-5 h-5 text-orange-500 animate-spin" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-neutral-500" />
    }
  }

  const getStatusText = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'completed':
        return 'Completado'
      case 'processing':
        return 'Procesando'
      case 'failed':
        return 'Fallido'
      default:
        return 'Pendiente'
    }
  }

  const getModelName = (modelId: string) => {
    const models: Record<string, string> = {
      'deteccion-fraude': 'Detección de Fraude',
      'deteccion-anomalias': 'Detección de Anomalías',
      'deteccion-phishing': 'Detección de Phishing',
      'analisis-comportamiento': 'Análisis de Comportamiento',
      'deteccion-informacion-sensible': 'Detección de Información Sensible'
    }
    return models[modelId] || modelId
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return 'En progreso'
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime()
    return `${Math.round(duration / 1000)}s`
  }

  const filteredJobs = jobs.filter(job =>
    job.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getModelName(job.modelId).toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="notebook-container">
      {/* Header */}
      <div className="notebook-cell">
        <div className="notebook-cell-header">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Historial de Análisis</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Gestiona y revisa tus trabajos de procesamiento con Morpheus
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors">
              <RefreshCw className="w-4 h-4" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>
        <div className="notebook-cell-content">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por archivo o modelo..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="metric-card">
              <div className="metric-value">{jobs.length}</div>
              <div className="metric-label">Total de Trabajos</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{jobs.filter(j => j.status === 'completed').length}</div>
              <div className="metric-label">Completados</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{jobs.filter(j => j.status === 'processing').length}</div>
              <div className="metric-label">En Proceso</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{jobs.filter(j => j.status === 'failed').length}</div>
              <div className="metric-label">Fallidos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="notebook-cell">
        <div className="notebook-cell-header">
          <span className="font-medium text-neutral-900">Lista de Trabajos</span>
          <span className="text-sm text-neutral-500">{filteredJobs.length} resultados</span>
        </div>
        <div className="notebook-cell-content">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900">No se encontraron trabajos</h3>
              <p className="text-neutral-500 mt-1">
                {searchTerm ? 'Intenta ajustar tu búsqueda' : 'Comienza subiendo un archivo y seleccionando un modelo en el panel principal.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <div key={job.id} className="p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        {getStatusIcon(job.status)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-neutral-900 truncate">
                            {job.fileName}
                          </h3>
                          <span className="text-xs text-neutral-500">
                            {new Date(job.startTime).toLocaleString('es-ES')}
                          </span>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-neutral-600 mb-2">
                          <span className="font-medium">{getModelName(job.modelId)}</span>
                          <span>•</span>
                          <span>Duración: {formatDuration(job.startTime, job.endTime)}</span>
                          <span>•</span>
                          <span
                            className={clsx(
                              'px-2 py-1 rounded-full text-xs font-medium',
                              job.status === 'completed' && 'bg-green-100 text-green-800',
                              job.status === 'processing' && 'bg-orange-100 text-orange-800',
                              job.status === 'failed' && 'bg-red-100 text-red-800',
                              job.status === 'pending' && 'bg-neutral-100 text-neutral-800'
                            )}
                          >
                            {getStatusText(job.status)}
                          </span>
                        </div>

                        {job.inputData && (
                          <div className="text-xs text-neutral-500 mb-1">
                            Entrada: {job.inputData.rows.toLocaleString()} filas, {job.inputData.columns} columnas
                          </div>
                        )}

                        {job.error && (
                          <p className="text-sm text-red-600 bg-red-50 p-2 rounded mt-2">
                            <strong>Error:</strong> {job.error}
                          </p>
                        )}

                        {job.outputData && (
                          <div className="flex items-center space-x-4 text-sm text-neutral-600 bg-neutral-50 p-2 rounded mt-2">
                            <span className="font-medium text-green-700">
                              {job.outputData.detections} detecciones
                            </span>
                            <span>•</span>
                            <span className="font-medium text-blue-700">
                              {(job.outputData.confidence * 100).toFixed(1)}% confianza
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors" title="Ver detalles">
                        <Eye className="w-4 h-4" />
                      </button>
                      {job.status === 'completed' && (
                        <button className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors" title="Descargar resultados">
                          <Download className="w-4 h-4" />
                        </button>
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