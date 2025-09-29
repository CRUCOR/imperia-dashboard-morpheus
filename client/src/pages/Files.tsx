import { useState } from 'react'
import {
  Search,
  Upload,
  Download,
  Eye,
  Trash2,
  FileText,
  Database,
  MoreHorizontal,
  SortAsc,
  Filter,
  RefreshCw,
  FolderOpen,
  AlertCircle
} from 'lucide-react'
import { clsx } from 'clsx'

interface FileItem {
  id: string
  name: string
  type: 'csv' | 'json' | 'txt' | 'log'
  size: number
  uploadDate: string
  status: 'uploaded' | 'processing' | 'analyzed' | 'error'
  rows?: number
  columns?: number
  description?: string
  tags: string[]
}

const mockFiles: FileItem[] = [
  {
    id: '1',
    name: 'transacciones_financieras.csv',
    type: 'csv',
    size: 2457600, // 2.4MB
    uploadDate: '2024-01-15T10:30:00Z',
    status: 'analyzed',
    rows: 15847,
    columns: 12,
    description: 'Dataset de transacciones bancarias para detección de fraude',
    tags: ['finanzas', 'fraude', 'transacciones']
  },
  {
    id: '2',
    name: 'logs_red_corporativa.json',
    type: 'json',
    size: 5242880, // 5MB
    uploadDate: '2024-01-15T09:15:00Z',
    status: 'processing',
    rows: 8920,
    columns: 8,
    description: 'Logs de actividad de red corporativa',
    tags: ['red', 'seguridad', 'logs']
  },
  {
    id: '3',
    name: 'emails_empresariales.csv',
    type: 'csv',
    size: 1048576, // 1MB
    uploadDate: '2024-01-15T08:45:00Z',
    status: 'analyzed',
    rows: 3456,
    columns: 5,
    description: 'Emails corporativos para análisis de phishing',
    tags: ['email', 'phishing', 'seguridad']
  },
  {
    id: '4',
    name: 'datos_sensibles_pii.csv',
    type: 'csv',
    size: 3145728, // 3MB
    uploadDate: '2024-01-14T16:20:00Z',
    status: 'analyzed',
    rows: 12340,
    columns: 9,
    description: 'Dataset con información personal para análisis de privacidad',
    tags: ['pii', 'privacidad', 'gdpr']
  },
  {
    id: '5',
    name: 'trafico_web.log',
    type: 'log',
    size: 7340032, // 7MB
    uploadDate: '2024-01-14T14:10:00Z',
    status: 'error',
    description: 'Logs de tráfico web del servidor principal',
    tags: ['web', 'tráfico', 'servidor']
  }
]

export function Files() {
  const [files] = useState<FileItem[]>(mockFiles)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'csv':
        return <Database className="w-5 h-5 text-green-500" />
      case 'json':
        return <FileText className="w-5 h-5 text-blue-500" />
      case 'txt':
      case 'log':
        return <FileText className="w-5 h-5 text-neutral-500" />
      default:
        return <FileText className="w-5 h-5 text-neutral-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'analyzed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'uploaded':
        return 'bg-blue-100 text-blue-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-neutral-100 text-neutral-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'analyzed':
        return 'Analizado'
      case 'processing':
        return 'Procesando'
      case 'uploaded':
        return 'Subido'
      case 'error':
        return 'Error'
      default:
        return status
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

  const filteredFiles = files
    .filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = filterStatus === 'all' || file.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'size':
          return b.size - a.size
        case 'date':
        default:
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      }
    })

  const handleSelectFile = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const handleSelectAll = () => {
    setSelectedFiles(
      selectedFiles.length === filteredFiles.length
        ? []
        : filteredFiles.map(file => file.id)
    )
  }

  return (
    <div className="notebook-container">
      {/* Header */}
      <div className="notebook-cell">
        <div className="notebook-cell-header">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Gestión de Archivos</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Administra tus datasets y archivos de entrada
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors">
              <RefreshCw className="w-4 h-4" />
              <span>Actualizar</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
              <Upload className="w-4 h-4" />
              <span>Subir Archivo</span>
            </button>
          </div>
        </div>
        <div className="notebook-cell-content">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="metric-card">
              <div className="metric-value">{files.length}</div>
              <div className="metric-label">Total de Archivos</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{files.filter(f => f.status === 'analyzed').length}</div>
              <div className="metric-label">Analizados</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{files.filter(f => f.status === 'processing').length}</div>
              <div className="metric-label">En Proceso</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">
                {formatFileSize(files.reduce((total, file) => total + file.size, 0))}
              </div>
              <div className="metric-label">Almacenamiento Total</div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar archivos, descripción o etiquetas..."
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
                <option value="uploaded">Subidos</option>
                <option value="processing">Procesando</option>
                <option value="analyzed">Analizados</option>
                <option value="error">Con errores</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="date">Fecha</option>
                <option value="name">Nombre</option>
                <option value="size">Tamaño</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="notebook-cell">
        <div className="notebook-cell-header">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
            />
            <span className="font-medium text-neutral-900">
              {selectedFiles.length > 0 ? `${selectedFiles.length} seleccionados` : 'Lista de Archivos'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {selectedFiles.length > 0 && (
              <>
                <button className="p-2 text-neutral-400 hover:text-neutral-600 rounded transition-colors">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 text-neutral-400 hover:text-red-600 rounded transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <span className="text-sm text-neutral-500">{filteredFiles.length} archivos</span>
          </div>
        </div>
        <div className="notebook-cell-content">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900">No se encontraron archivos</h3>
              <p className="text-neutral-500 mt-1">
                {searchTerm || filterStatus !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Sube tu primer archivo para comenzar el análisis'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className={clsx(
                    'p-4 border rounded-lg transition-colors',
                    selectedFiles.includes(file.id)
                      ? 'border-orange-200 bg-orange-50'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  )}
                >
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => handleSelectFile(file.id)}
                      className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                    />

                    <div className="flex-shrink-0">
                      {getFileIcon(file.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-neutral-900 truncate">
                          {file.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={clsx(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            getStatusColor(file.status)
                          )}>
                            {getStatusText(file.status)}
                          </span>
                          {file.status === 'error' && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>

                      {file.description && (
                        <p className="text-sm text-neutral-600 mb-2">{file.description}</p>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-neutral-500 mb-2">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{formatDate(file.uploadDate)}</span>
                        {file.rows && file.columns && (
                          <>
                            <span>•</span>
                            <span>{file.rows.toLocaleString()} filas, {file.columns} columnas</span>
                          </>
                        )}
                      </div>

                      {file.tags.length > 0 && (
                        <div className="flex items-center space-x-2">
                          {file.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
                        title="Descargar"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
                        title="Más opciones"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
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