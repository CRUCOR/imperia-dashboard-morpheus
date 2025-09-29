import { useState } from 'react'
import { ChevronDown, Settings } from 'lucide-react'
import { clsx } from 'clsx'
import type { MorpheusModel, ModelParameter } from '@/types'

interface ModelSelectorProps {
  models: MorpheusModel[]
  selectedModel: MorpheusModel | null
  onModelSelect: (model: MorpheusModel) => void
  parameters: Record<string, any>
  onParameterChange: (name: string, value: any) => void
}

export function ModelSelector({
  models,
  selectedModel,
  onModelSelect,
  parameters,
  onParameterChange,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const renderParameterInput = (param: ModelParameter) => {
    const value = parameters[param.name] ?? param.defaultValue ?? ''

    switch (param.type) {
      case 'boolean':
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => onParameterChange(param.name, e.target.checked)}
              className="rounded border-gray-300 text-jupyter-orange focus:ring-jupyter-orange"
            />
            <span className="ml-2 text-sm text-gray-700">{param.description}</span>
          </label>
        )

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => onParameterChange(param.name, parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-jupyter-orange focus:border-jupyter-orange"
            placeholder={param.description}
          />
        )

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => onParameterChange(param.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-jupyter-orange focus:border-jupyter-orange"
          >
            <option value="">Select {param.name}</option>
            {param.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onParameterChange(param.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-jupyter-orange focus:border-jupyter-orange"
            placeholder={param.description}
          />
        )
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Morpheus Model
        </label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-full bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-jupyter-orange focus:border-jupyter-orange"
        >
          <span className="block truncate">
            {selectedModel ? selectedModel.name : 'Choose a model...'}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
            {models.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => {
                  onModelSelect(model)
                  setIsOpen(false)
                }}
                className={clsx(
                  'relative cursor-pointer select-none py-2 pl-3 pr-9 w-full text-left hover:bg-gray-50',
                  selectedModel?.id === model.id ? 'bg-jupyter-orange text-white' : 'text-gray-900'
                )}
              >
                <div>
                  <span className="block font-medium">{model.name}</span>
                  <span className="block text-sm opacity-75">{model.description}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedModel && selectedModel.parameters.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Settings className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-sm font-medium text-gray-700">Model Parameters</h3>
          </div>
          <div className="space-y-3">
            {selectedModel.parameters.map((param) => (
              <div key={param.name}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {param.name}
                  {param.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderParameterInput(param)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}