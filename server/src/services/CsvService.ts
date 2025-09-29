import fs from 'fs/promises'
import path from 'path'
import csvParser from 'csv-parser'
import createCsvWriter from 'csv-writer'
import { createReadStream } from 'fs'
import { logger } from '@/utils/logger'
import { config } from '@/config'

export interface ICsvService {
  readCsv(filePath: string): Promise<any[]>
  writeCsv(filePath: string, data: any[], headers: string[]): Promise<void>
  mergeCsvData(inputData: any[], outputData: any[]): Promise<any[]>
  generateOutputFileName(originalFileName: string, modelId: string): string
}

export class CsvService implements ICsvService {
  async readCsv(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = []

      createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          logger.info(`Successfully read CSV file: ${filePath}`, {
            recordCount: results.length,
          })
          resolve(results)
        })
        .on('error', (error) => {
          logger.error(`Failed to read CSV file: ${filePath}`, { error })
          reject(error)
        })
    })
  }

  async writeCsv(filePath: string, data: any[], headers: string[]): Promise<void> {
    try {
      // Ensure output directory exists
      const dir = path.dirname(filePath)
      await fs.mkdir(dir, { recursive: true })

      const csvWriter = createCsvWriter.createObjectCsvWriter({
        path: filePath,
        header: headers.map(header => ({
          id: header,
          title: header,
        })),
      })

      await csvWriter.writeRecords(data)

      logger.info(`Successfully wrote CSV file: ${filePath}`, {
        recordCount: data.length,
        headers: headers.length,
      })
    } catch (error) {
      logger.error(`Failed to write CSV file: ${filePath}`, { error })
      throw error
    }
  }

  async mergeCsvData(inputData: any[], outputData: any[]): Promise<any[]> {
    try {
      // Ensure both datasets have the same length
      const minLength = Math.min(inputData.length, outputData.length)

      const mergedData = []
      for (let i = 0; i < minLength; i++) {
        mergedData.push({
          ...inputData[i],
          ...outputData[i],
          _row_index: i,
          _merged_at: new Date().toISOString(),
        })
      }

      // Add remaining records if datasets have different lengths
      if (inputData.length > minLength) {
        for (let i = minLength; i < inputData.length; i++) {
          mergedData.push({
            ...inputData[i],
            _row_index: i,
            _merged_at: new Date().toISOString(),
            _note: 'No corresponding output data',
          })
        }
      }

      if (outputData.length > minLength) {
        for (let i = minLength; i < outputData.length; i++) {
          mergedData.push({
            ...outputData[i],
            _row_index: i,
            _merged_at: new Date().toISOString(),
            _note: 'No corresponding input data',
          })
        }
      }

      logger.info('Successfully merged CSV data', {
        inputRecords: inputData.length,
        outputRecords: outputData.length,
        mergedRecords: mergedData.length,
      })

      return mergedData
    } catch (error) {
      logger.error('Failed to merge CSV data', { error })
      throw error
    }
  }

  generateOutputFileName(originalFileName: string, modelId: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const baseName = path.parse(originalFileName).name
    return `${baseName}_${modelId}_${timestamp}.csv`
  }

  async parseJsonToCsv(jsonFilePath: string): Promise<any[]> {
    try {
      const content = await fs.readFile(jsonFilePath, 'utf8')
      const data = JSON.parse(content)

      // Handle different JSON structures
      if (Array.isArray(data)) {
        return data
      }

      if (typeof data === 'object' && data !== null) {
        // If it's a single object, wrap it in an array
        return [data]
      }

      throw new Error('Invalid JSON structure: Expected array or object')
    } catch (error) {
      logger.error(`Failed to parse JSON file: ${jsonFilePath}`, { error })
      throw error
    }
  }

  async getFileHeaders(filePath: string): Promise<string[]> {
    const ext = path.extname(filePath).toLowerCase()

    switch (ext) {
      case '.csv':
        const csvData = await this.readCsv(filePath)
        return csvData.length > 0 ? Object.keys(csvData[0]) : []

      case '.json':
        const jsonData = await this.parseJsonToCsv(filePath)
        return jsonData.length > 0 ? Object.keys(jsonData[0]) : []

      case '.txt':
        // For text files, assume each line is a record with single 'content' field
        return ['content']

      default:
        throw new Error(`Unsupported file format: ${ext}`)
    }
  }

  async convertToStandardFormat(filePath: string): Promise<any[]> {
    const ext = path.extname(filePath).toLowerCase()

    switch (ext) {
      case '.csv':
        return this.readCsv(filePath)

      case '.json':
        return this.parseJsonToCsv(filePath)

      case '.txt':
        const content = await fs.readFile(filePath, 'utf8')
        const lines = content.split('\n').filter(line => line.trim())
        return lines.map((line, index) => ({
          id: index + 1,
          content: line.trim(),
        }))

      default:
        throw new Error(`Unsupported file format: ${ext}`)
    }
  }
}