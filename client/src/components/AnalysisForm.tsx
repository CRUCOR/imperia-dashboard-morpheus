import { useState } from 'react'
import { Play, Upload, Settings } from 'lucide-react'

interface AnalysisModel {
  id: string
  name: string
  description: string
  parameters: Array<{
    name: string
    type: 'number' | 'select' | 'boolean' | 'text'
    label: string
    required: boolean
    defaultValue?: any
    options?: string[]
    min?: number
    max?: number
    step?: number
  }>
}

interface AnalysisFormProps {
  onSubmit: (model: string, parameters: Record<string, any>, file: File | null) => void
  isLoading?: boolean
}

const availableModels: AnalysisModel[] = [
  {
    id: 'fraud-detection',
    name: 'Detección de Fraude',
    description: 'Identifica transacciones fraudulentas en datos financieros',
    parameters: [
      {
        name: 'threshold',
        type: 'number',
        label: 'Umbral de Detección',
        required: true,
        defaultValue: 0.85,
        min: 0.1,
        max: 1.0,
        step: 0.01
      },
      {
        name: 'model_type',
        type: 'select',
        label: 'Tipo de Modelo',
        required: true,
        defaultValue: 'bert',
        options: ['bert', 'roberta', 'distilbert']
      },
      {
        name: 'enable_preprocessing',
        type: 'boolean',
        label: 'Habilitar Preprocesamiento',
        required: false,
        defaultValue: true
      }
    ]
  },
  {
    id: 'anomaly-detection',
    name: 'Detección de Anomalías',
    description: 'Encuentra patrones inusuales en logs de red y sistemas',
    parameters: [
      {
        name: 'sensitivity',
        type: 'number',
        label: 'Sensibilidad',
        required: true,
        defaultValue: 0.8,
        min: 0.1,
        max: 1.0,
        step: 0.1
      },
      {
        name: 'window_size',
        type: 'number',
        label: 'Tamaño de Ventana (minutos)',
        required: true,
        defaultValue: 60,
        min: 1,
        max: 1440
      },
      {
        name: 'algorithm',
        type: 'select',
        label: 'Algoritmo',
        required: true,
        defaultValue: 'isolation_forest',
        options: ['isolation_forest', 'one_class_svm', 'autoencoder']
      }
    ]
  },
  {
    id: 'phishing-detection',
    name: 'Detección de Phishing',
    description: 'Analiza emails y URLs para identificar intentos de phishing',
    parameters: [
      {
        name: 'confidence_threshold',
        type: 'number',
        label: 'Umbral de Confianza',
        required: true,
        defaultValue: 0.9,
        min: 0.5,
        max: 1.0,
        step: 0.01
      },
      {
        name: 'check_urls',
        type: 'boolean',
        label: 'Verificar URLs',
        required: false,
        defaultValue: true
      },
      {
        name: 'language',
        type: 'select',
        label: 'Idioma',
        required: true,
        defaultValue: 'es',
        options: ['es', 'en', 'auto']
      }
    ]
  },
  {
    id: 'pii-detection',
    name: 'Detección de Información Personal',
    description: 'Identifica datos sensibles como PII, números de tarjetas, etc.',
    parameters: [
      {
        name: 'entity_types',
        type: 'select',
        label: 'Tipos de Entidades',
        required: true,
        defaultValue: 'all',
        options: ['all', 'pii', 'financial', 'medical', 'custom']
      },
      {
        name: 'confidence_level',
        type: 'number',
        label: 'Nivel de Confianza',
        required: true,
        defaultValue: 0.75,
        min: 0.1,
        max: 1.0,
        step: 0.01
      },
      {
        name: 'mask_output',
        type: 'boolean',
        label: 'Enmascarar Resultados',
        required: false,
        defaultValue: false
      }
    ]
  }
]

export function AnalysisForm({ onSubmit, isLoading = false }: AnalysisFormProps) {
  const [selectedModel, setSelectedModel] = useState<AnalysisModel | null>(null)
  const [parameters, setParameters] = useState<Record<string, any>>({})
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleModelSelect = (modelId: string) => {
    const model = availableModels.find(m => m.id === modelId)
    if (model) {
      setSelectedModel(model)
      // Initialize parameters with default values
      const defaultParams: Record<string, any> = {}
      model.parameters.forEach(param => {
        if (param.defaultValue !== undefined) {
          defaultParams[param.name] = param.defaultValue
        }
      })
      setParameters(defaultParams)
    }
  }

  const handleParameterChange = (name: string, value: any) => {
    setParameters(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedModel) {
      onSubmit(selectedModel.id, parameters, selectedFile)
    }
  }

  const canSubmit = selectedModel && selectedFile && !isLoading

  return (
    <div className="notebook-cell">
      <div className="notebook-cell-header">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-neutral-600" />
          <span className="font-medium text-neutral-900">Configurar Análisis</span>
        </div>
      </div>
      <div className="notebook-cell-content">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Archivo de Datos
            </label>
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-neutral-400 transition-colors">
              <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <div className="text-sm text-neutral-600">
                {selectedFile ? (
                  <div>
                    <p className="font-medium text-neutral-900">{selectedFile.name}</p>
                    <p className="text-xs text-neutral-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p>Arrastra un archivo aquí o <label htmlFor="file-upload" className="text-orange-600 hover:text-orange-500 cursor-pointer">busca uno</label></p>
                    <p className="text-xs text-neutral-500 mt-1">CSV, JSON, TXT hasta 100MB</p>
                  </div>
                )}
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".csv,.json,.txt,.log"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Modelo de Análisis
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableModels.map((model) => (
                <div
                  key={model.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedModel?.id === model.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                  onClick={() => handleModelSelect(model.id)}
                >
                  <h3 className="font-medium text-neutral-900">{model.name}</h3>
                  <p className="text-sm text-neutral-600 mt-1">{model.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Parameters */}
          {selectedModel && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-4">
                Parámetros del Modelo
              </label>
              <div className="space-y-4 bg-neutral-50 p-4 rounded-lg">
                {selectedModel.parameters.map((param) => (
                  <div key={param.name}>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      {param.label}
                      {param.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {param.type === 'number' && (
                      <input
                        type="number"
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        value={parameters[param.name] || param.defaultValue || ''}
                        onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required={param.required}
                      />
                    )}

                    {param.type === 'select' && (
                      <select
                        value={parameters[param.name] || param.defaultValue || ''}
                        onChange={(e) => handleParameterChange(param.name, e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required={param.required}
                      >
                        {param.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}

                    {param.type === 'boolean' && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={parameters[param.name] ?? param.defaultValue ?? false}
                          onChange={(e) => handleParameterChange(param.name, e.target.checked)}
                          className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-neutral-600">Activar esta opción</span>
                      </div>
                    )}

                    {param.type === 'text' && (
                      <input
                        type="text"
                        value={parameters[param.name] || param.defaultValue || ''}
                        onChange={(e) => handleParameterChange(param.name, e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required={param.required}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
            <div className="text-sm text-neutral-500">
              {selectedFile && selectedModel && (
                <span>✓ Listo para ejecutar análisis</span>
              )}
            </div>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex items-center space-x-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>{isLoading ? 'Ejecutando...' : 'Ejecutar Análisis'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}