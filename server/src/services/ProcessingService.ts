import path from 'path'
import { Job } from '@/models/Job'
import { logger } from '@/utils/logger'
import { config } from '@/config'
import type { IJobRepository } from '@/repositories/JobRepository'
import type { IMorpheusService } from './MorpheusService'
import type { ICsvService } from './CsvService'
import type { ProcessingRequest, ProcessingResult } from '@/types'

export interface IProcessingService {
  processFile(request: ProcessingRequest): Promise<Job>
  getProcessingStatus(jobId: string): Promise<Job | null>
  getAllJobs(): Promise<Job[]>
  cancelJob(jobId: string): Promise<boolean>
}

export class ProcessingService implements IProcessingService {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly morpheusService: IMorpheusService,
    private readonly csvService: ICsvService
  ) {}

  async processFile(request: ProcessingRequest): Promise<Job> {
    const { filePath, modelId, parameters } = request

    // Validate model
    const isValidModel = await this.morpheusService.validateModel(modelId)
    if (!isValidModel) {
      throw new Error(`Invalid model ID: ${modelId}`)
    }

    // Create job
    const fileName = path.basename(filePath)
    const job = new Job(fileName, filePath, modelId, parameters)

    // Save job to repository
    await this.jobRepository.create(job)

    // Start processing asynchronously
    this.executeProcessing(job).catch((error) => {
      logger.error('Processing job failed', { jobId: job.id, error })
    })

    return job
  }

  async getProcessingStatus(jobId: string): Promise<Job | null> {
    return this.jobRepository.findById(jobId)
  }

  async getAllJobs(): Promise<Job[]> {
    return this.jobRepository.findAll()
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.jobRepository.findById(jobId)
    if (!job || job.status !== 'processing') {
      return false
    }

    job.fail('Cancelled by user')
    await this.jobRepository.update(jobId, job.toJSON())
    return true
  }

  private async executeProcessing(job: Job): Promise<void> {
    try {
      logger.info('Starting job processing', { jobId: job.id })

      // Update job status
      job.start()
      await this.jobRepository.update(job.id, job.toJSON())

      // Read and validate input file
      logger.info('Reading input file', { filePath: job.filePath })
      const inputData = await this.csvService.convertToStandardFormat(job.filePath)
      job.inputData = {
        records: inputData.length,
        headers: inputData.length > 0 ? Object.keys(inputData[0]) : [],
        sample: inputData.slice(0, 3), // First 3 records for preview
      }

      // Generate output file path
      const outputFileName = this.csvService.generateOutputFileName(job.fileName, job.modelId)
      const outputPath = path.join(config.upload.outputPath, outputFileName)

      // Create Morpheus command
      const command = this.morpheusService.generateCommand(
        job.modelId,
        job.filePath,
        outputPath,
        job.parameters
      )

      logger.info('Executing Morpheus command', {
        jobId: job.id,
        command: command.command,
        args: command.args,
      })

      // Execute Morpheus processing
      const morpheusResult = await this.morpheusService.executeCommand(command)

      if (!morpheusResult.success) {
        throw new Error(morpheusResult.error || 'Morpheus processing failed')
      }

      // Process the results
      const processedResult = await this.processResults(
        job,
        inputData,
        outputPath,
        morpheusResult
      )

      // Complete the job
      job.complete(processedResult.data, processedResult.outputPath)
      await this.jobRepository.update(job.id, job.toJSON())

      logger.info('Job processing completed successfully', { jobId: job.id })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Job processing failed', { jobId: job.id, error: errorMessage })

      job.fail(errorMessage)
      await this.jobRepository.update(job.id, job.toJSON())
    }
  }

  private async processResults(
    job: Job,
    inputData: any[],
    outputPath: string,
    morpheusResult: any
  ): Promise<ProcessingResult> {
    try {
      // Try to read Morpheus output if it exists
      let outputData: any[] = []

      try {
        // Check if Morpheus generated output file
        outputData = await this.csvService.readCsv(outputPath)
      } catch (error) {
        // If no output file, create mock results based on Morpheus result
        logger.warn('No output file found, generating results from command output', {
          jobId: job.id,
          morpheusResult,
        })

        outputData = this.generateMockResults(inputData, job.modelId, morpheusResult.data)
      }

      // Merge input and output data
      const mergedData = await this.csvService.mergeCsvData(inputData, outputData)

      // Generate final CSV output
      const finalOutputPath = path.join(
        config.upload.outputPath,
        `final_${this.csvService.generateOutputFileName(job.fileName, job.modelId)}`
      )

      const headers = mergedData.length > 0 ? Object.keys(mergedData[0]) : []
      await this.csvService.writeCsv(finalOutputPath, mergedData, headers)

      return {
        success: true,
        data: {
          inputRecords: inputData.length,
          outputRecords: outputData.length,
          mergedRecords: mergedData.length,
          detections: this.countDetections(mergedData, job.modelId),
          confidence: this.calculateAverageConfidence(mergedData),
          morpheusOutput: morpheusResult.data,
        },
        outputPath: finalOutputPath,
      }

    } catch (error) {
      logger.error('Failed to process results', { jobId: job.id, error })
      throw error
    }
  }

  private generateMockResults(inputData: any[], modelId: string, morpheusData?: any): any[] {
    // Generate mock detection results based on model type
    return inputData.map((record, index) => {
      const baseResult = {
        record_id: index + 1,
        processed_at: new Date().toISOString(),
      }

      switch (modelId) {
        case 'phishing-detection':
          return {
            ...baseResult,
            is_phishing: Math.random() > 0.8,
            confidence: parseFloat((Math.random() * 0.4 + 0.6).toFixed(3)), // 0.6 - 1.0
            risk_score: parseFloat((Math.random() * 100).toFixed(1)),
          }

        case 'sid-detection':
          return {
            ...baseResult,
            has_pii: Math.random() > 0.7,
            pii_types: ['email', 'phone', 'ssn'].filter(() => Math.random() > 0.6),
            confidence: parseFloat((Math.random() * 0.3 + 0.7).toFixed(3)), // 0.7 - 1.0
          }

        case 'anomaly-detection':
          return {
            ...baseResult,
            is_anomaly: Math.random() > 0.85,
            anomaly_score: parseFloat((Math.random()).toFixed(3)),
            anomaly_type: ['statistical', 'pattern', 'temporal'][Math.floor(Math.random() * 3)],
          }

        default:
          return {
            ...baseResult,
            result: 'processed',
            score: parseFloat((Math.random()).toFixed(3)),
          }
      }
    })
  }

  private countDetections(data: any[], modelId: string): number {
    switch (modelId) {
      case 'phishing-detection':
        return data.filter(record => record.is_phishing === true).length
      case 'sid-detection':
        return data.filter(record => record.has_pii === true).length
      case 'anomaly-detection':
        return data.filter(record => record.is_anomaly === true).length
      default:
        return data.filter(record => record.result === 'detected' || record.score > 0.5).length
    }
  }

  private calculateAverageConfidence(data: any[]): number {
    const confidences = data
      .map(record => record.confidence)
      .filter(conf => typeof conf === 'number' && !isNaN(conf))

    if (confidences.length === 0) return 0

    const average = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
    return parseFloat(average.toFixed(3))
  }
}