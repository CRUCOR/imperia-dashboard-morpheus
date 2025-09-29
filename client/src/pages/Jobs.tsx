import { useState } from 'react'
import { Download, Eye, Clock, CheckCircle, XCircle, Loader } from 'lucide-react'
import { clsx } from 'clsx'
import type { ProcessingJob } from '@/types'

// Mock data - replace with actual API calls
const mockJobs: ProcessingJob[] = [
  {
    id: '1',
    fileName: 'emails_dataset.csv',
    modelId: 'phishing-detection',
    parameters: { threshold: 0.8, model_type: 'bert' },
    status: 'completed',
    startTime: '2024-01-15T10:30:00Z',
    endTime: '2024-01-15T10:32:15Z',
    inputData: { rows: 500, columns: 3 },
    outputData: { detections: 45, confidence: 0.89 },
  },
  {
    id: '2',
    fileName: 'documents.json',
    modelId: 'sid-detection',
    parameters: { entities: 'PII', confidence: 0.75 },
    status: 'processing',
    startTime: '2024-01-15T11:15:00Z',
    inputData: { rows: 200, columns: 2 },
  },
  {
    id: '3',
    fileName: 'logs.txt',
    modelId: 'phishing-detection',
    parameters: { threshold: 0.9, model_type: 'roberta' },
    status: 'failed',
    startTime: '2024-01-15T09:45:00Z',
    endTime: '2024-01-15T09:47:30Z',
    error: 'Invalid input format: Expected CSV, got TXT',
  },
]

export function Jobs() {
  const [jobs] = useState<ProcessingJob[]>(mockJobs)

  const getStatusIcon = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'processing':
        return <Loader className="w-5 h-5 text-yellow-500 animate-spin" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'processing':
        return 'Processing'
      case 'failed':
        return 'Failed'
      default:
        return 'Pending'
    }
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return 'In progress'
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime()
    return `${Math.round(duration / 1000)}s`
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Processing Jobs</h1>
        <p className="text-gray-600 mt-1">
          View and manage your Morpheus processing jobs
        </p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {jobs.map((job) => (
            <li key={job.id}>
              <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    {getStatusIcon(job.status)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {job.fileName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(job.startTime).toLocaleString()}
                      </p>
                    </div>

                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span>Model: {job.modelId}</span>
                      <span>•</span>
                      <span>Duration: {formatDuration(job.startTime, job.endTime)}</span>
                      <span>•</span>
                      <span
                        className={clsx(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          job.status === 'completed' && 'bg-green-100 text-green-800',
                          job.status === 'processing' && 'bg-yellow-100 text-yellow-800',
                          job.status === 'failed' && 'bg-red-100 text-red-800',
                          job.status === 'pending' && 'bg-gray-100 text-gray-800'
                        )}
                      >
                        {getStatusText(job.status)}
                      </span>
                    </div>

                    {job.error && (
                      <p className="mt-1 text-sm text-red-600">
                        Error: {job.error}
                      </p>
                    )}

                    {job.outputData && (
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                        <span>
                          {job.outputData.detections} detections
                        </span>
                        <span>•</span>
                        <span>
                          {(job.outputData.confidence * 100).toFixed(1)}% confidence
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Eye className="w-4 h-4" />
                  </button>
                  {job.status === 'completed' && (
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No jobs yet</h3>
          <p className="text-gray-500 mt-1">
            Start by uploading a file and selecting a model on the dashboard.
          </p>
        </div>
      )}
    </div>
  )
}