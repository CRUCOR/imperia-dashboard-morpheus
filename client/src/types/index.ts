export interface MorpheusModel {
  id: string
  name: string
  description: string
  parameters: ModelParameter[]
}

export interface ModelParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'select'
  required: boolean
  defaultValue?: any
  options?: string[]
  description: string
}

export interface ProcessingJob {
  id: string
  fileName: string
  modelId: string
  parameters: Record<string, any>
  status: 'pending' | 'processing' | 'completed' | 'failed'
  startTime: string
  endTime?: string
  inputData?: any
  outputData?: any
  error?: string
}

export interface ProcessingResult {
  success: boolean
  data?: any
  error?: string
  csvPath?: string
}

export interface UploadedFile {
  name: string
  size: number
  type: string
  path: string
}