import { v4 as uuidv4 } from 'uuid'
import type { ProcessingJob, JobStatus } from '@/types'

export class Job implements ProcessingJob {
  public readonly id: string
  public fileName: string
  public filePath: string
  public modelId: string
  public parameters: Record<string, any>
  public status: JobStatus
  public startTime: Date
  public endTime?: Date
  public inputData?: any
  public outputData?: any
  public error?: string
  public csvOutputPath?: string

  constructor(
    fileName: string,
    filePath: string,
    modelId: string,
    parameters: Record<string, any>
  ) {
    this.id = uuidv4()
    this.fileName = fileName
    this.filePath = filePath
    this.modelId = modelId
    this.parameters = parameters
    this.status = 'pending'
    this.startTime = new Date()
  }

  public start(): void {
    this.status = 'processing'
    this.startTime = new Date()
  }

  public complete(outputData?: any, csvOutputPath?: string): void {
    this.status = 'completed'
    this.endTime = new Date()
    this.outputData = outputData
    this.csvOutputPath = csvOutputPath
  }

  public fail(error: string): void {
    this.status = 'failed'
    this.endTime = new Date()
    this.error = error
  }

  public getDuration(): number | null {
    if (!this.endTime) return null
    return this.endTime.getTime() - this.startTime.getTime()
  }

  public isCompleted(): boolean {
    return this.status === 'completed'
  }

  public isFailed(): boolean {
    return this.status === 'failed'
  }

  public isProcessing(): boolean {
    return this.status === 'processing'
  }

  public toJSON(): ProcessingJob {
    return {
      id: this.id,
      fileName: this.fileName,
      filePath: this.filePath,
      modelId: this.modelId,
      parameters: this.parameters,
      status: this.status,
      startTime: this.startTime,
      endTime: this.endTime,
      inputData: this.inputData,
      outputData: this.outputData,
      error: this.error,
      csvOutputPath: this.csvOutputPath,
    }
  }
}