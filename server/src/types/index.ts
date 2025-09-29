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
  filePath: string
  modelId: string
  parameters: Record<string, any>
  status: JobStatus
  startTime: Date
  endTime?: Date
  inputData?: any
  outputData?: any
  error?: string
  csvOutputPath?: string
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface UploadedFile {
  id: string
  originalName: string
  filename: string
  path: string
  size: number
  mimetype: string
  uploadTime: Date
}

export interface ProcessingRequest {
  filePath: string
  modelId: string
  parameters: Record<string, any>
}

export interface ProcessingResult {
  success: boolean
  data?: any
  error?: string
  outputPath?: string
}

export interface MorpheusCommand {
  command: string
  args: string[]
  env?: Record<string, string>
}

export interface MorpheusResponse {
  success: boolean
  data?: any
  error?: string
  exitCode?: number
  stdout?: string
  stderr?: string
}