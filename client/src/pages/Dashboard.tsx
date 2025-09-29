import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Play, Download } from 'lucide-react'
import { NotebookCell } from '@/components/NotebookCell'
import { FileUpload } from '@/components/FileUpload'
import { ModelSelector } from '@/components/ModelSelector'
import { apiService } from '@/services/api'
import type { MorpheusModel, UploadedFile, ProcessingJob } from '@/types'

// Mock data - replace with actual API calls
const mockModels: MorpheusModel[] = [
  {
    id: 'phishing-detection',
    name: 'Phishing Detection',
    description: 'Detect phishing attempts in email content',
    parameters: [
      {
        name: 'threshold',
        type: 'number',
        required: false,
        defaultValue: 0.8,
        description: 'Detection threshold (0.0 - 1.0)',
      },
      {
        name: 'model_type',
        type: 'select',
        required: true,
        options: ['bert', 'roberta', 'distilbert'],
        description: 'Base model architecture',
      },
    ],
  },
  {
    id: 'sid-detection',
    name: 'Sensitive Information Detection',
    description: 'Identify sensitive data in text',
    parameters: [
      {
        name: 'entities',
        type: 'select',
        required: true,
        options: ['PII', 'Financial', 'Medical', 'All'],
        description: 'Entity types to detect',
      },
      {
        name: 'confidence',
        type: 'number',
        required: false,
        defaultValue: 0.75,
        description: 'Confidence threshold',
      },
    ],
  },
]

export function Dashboard() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [selectedModel, setSelectedModel] = useState<MorpheusModel | null>(null)
  const [parameters, setParameters] = useState<Record<string, any>>({})
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ProcessingJob | null>(null)

  const handleFileUploaded = (file: UploadedFile) => {
    setUploadedFile(file)
    setResult(null)
  }

  const handleModelSelect = (model: MorpheusModel) => {
    setSelectedModel(model)
    // Initialize parameters with default values
    const defaultParams: Record<string, any> = {}
    model.parameters.forEach((param) => {
      if (param.defaultValue !== undefined) {
        defaultParams[param.name] = param.defaultValue
      }
    })
    setParameters(defaultParams)
  }

  const handleParameterChange = (name: string, value: any) => {
    setParameters((prev) => ({ ...prev, [name]: value }))
  }

  const handleProcess = async () => {
    if (!uploadedFile || !selectedModel) return

    setProcessing(true)
    try {
      // Simulate processing - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const mockResult: ProcessingJob = {
        id: Date.now().toString(),
        fileName: uploadedFile.name,
        modelId: selectedModel.id,
        parameters,
        status: 'completed',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        inputData: { rows: 150, columns: 5 },
        outputData: { detections: 12, confidence: 0.92 },
      }

      setResult(mockResult)
    } catch (error) {
      console.error('Processing failed:', error)
    } finally {
      setProcessing(false)
    }
  }

  const canProcess = uploadedFile && selectedModel && !processing

  return (
    <div className="notebook-container">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Morpheus Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Upload files and process them with Nvidia Morpheus models
        </p>
      </div>

      <NotebookCell type="upload">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">File Upload</h2>
        <FileUpload onFileUploaded={handleFileUploaded} />
      </NotebookCell>

      {uploadedFile && (
        <NotebookCell type="code">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Model Configuration</h2>
          <ModelSelector
            models={mockModels}
            selectedModel={selectedModel}
            onModelSelect={handleModelSelect}
            parameters={parameters}
            onParameterChange={handleParameterChange}
          />
        </NotebookCell>
      )}

      {uploadedFile && selectedModel && (
        <NotebookCell
          type="code"
          isRunning={processing}
          onRun={canProcess ? handleProcess : undefined}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Execute Processing</h2>
            <button
              onClick={handleProcess}
              disabled={!canProcess}
              className="flex items-center space-x-2 px-4 py-2 bg-jupyter-orange text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              <span>{processing ? 'Processing...' : 'Run'}</span>
            </button>
          </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-yellow-400">$</span>
              <span>
                morpheus run --model {selectedModel.id} --input {uploadedFile.name}
                {Object.entries(parameters).map(
                  ([key, value]) => ` --${key} ${value}`
                )}
              </span>
            </div>
            {processing && (
              <div className="animate-pulse">
                <p>Loading input data...</p>
                <p>Initializing model...</p>
                <p>Processing records...</p>
              </div>
            )}
          </div>
        </NotebookCell>
      )}

      {result && (
        <NotebookCell type="markdown">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Results</h2>
            <button className="flex items-center space-x-2 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
              <Download className="w-4 h-4" />
              <span>Download CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">Input Data</h3>
              <p className="text-blue-700">
                {result.inputData?.rows} rows, {result.inputData?.columns} columns
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900">Output Results</h3>
              <p className="text-green-700">
                {result.outputData?.detections} detections found
              </p>
              <p className="text-green-600 text-sm">
                Confidence: {(result.outputData?.confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Processing Summary</h3>
            <div className="text-sm text-gray-600">
              <p>Model: {selectedModel?.name}</p>
              <p>Status: <span className="text-green-600 font-medium">Completed</span></p>
              <p>Duration: {new Date(result.endTime!).getTime() - new Date(result.startTime).getTime()}ms</p>
            </div>
          </div>
        </NotebookCell>
      )}
    </div>
  )
}