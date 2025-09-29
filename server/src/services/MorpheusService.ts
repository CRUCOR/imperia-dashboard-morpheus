import { spawn, ChildProcess } from 'child_process'
import axios from 'axios'
import { config } from '@/config'
import { logger } from '@/utils/logger'
import type { MorpheusCommand, MorpheusResponse, MorpheusModel } from '@/types'

export interface IMorpheusService {
  getAvailableModels(): Promise<MorpheusModel[]>
  generateCommand(modelId: string, inputPath: string, outputPath: string, parameters: Record<string, any>): MorpheusCommand
  executeCommand(command: MorpheusCommand): Promise<MorpheusResponse>
  validateModel(modelId: string): Promise<boolean>
}

export class MorpheusService implements IMorpheusService {
  private readonly baseUrl: string
  private readonly timeout: number

  constructor() {
    this.baseUrl = `http://${config.morpheus.host}:${config.morpheus.port}`
    this.timeout = config.morpheus.timeout
  }

  async getAvailableModels(): Promise<MorpheusModel[]> {
    // Static models configuration - these are the available Morpheus models
    // In production, this could be loaded from a configuration file or API
    const availableModels: MorpheusModel[] = [
      {
        id: 'phishing-detection',
        name: 'Phishing Detection',
        description: 'Detect phishing attempts in email content using NLP',
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
            description: 'Base model architecture to use',
          },
          {
            name: 'batch_size',
            type: 'number',
            required: false,
            defaultValue: 32,
            description: 'Processing batch size',
          },
        ],
      },
      {
        id: 'sid-detection',
        name: 'Sensitive Information Detection',
        description: 'Identify personally identifiable information and sensitive data',
        parameters: [
          {
            name: 'entities',
            type: 'select',
            required: true,
            options: ['PII', 'Financial', 'Medical', 'All'],
            description: 'Types of entities to detect',
          },
          {
            name: 'confidence',
            type: 'number',
            required: false,
            defaultValue: 0.75,
            description: 'Minimum confidence score for detection',
          },
          {
            name: 'redact',
            type: 'boolean',
            required: false,
            defaultValue: false,
            description: 'Redact detected sensitive information',
          },
        ],
      },
      {
        id: 'anomaly-detection',
        name: 'Log Anomaly Detection',
        description: 'Detect anomalous patterns in log data',
        parameters: [
          {
            name: 'window_size',
            type: 'number',
            required: false,
            defaultValue: 100,
            description: 'Time window size for analysis',
          },
          {
            name: 'sensitivity',
            type: 'select',
            required: false,
            defaultValue: 'medium',
            options: ['low', 'medium', 'high'],
            description: 'Anomaly detection sensitivity',
          },
        ],
      },
    ]

    try {
      logger.info('Loading available Morpheus models from configuration')
      return availableModels
    } catch (error) {
      logger.error('Failed to load Morpheus models', { error })
      return []
    }
  }

  generateCommand(
    modelId: string,
    inputPath: string,
    outputPath: string,
    parameters: Record<string, any>
  ): MorpheusCommand {
    // Generate the complete Morpheus CLI command
    const args = [
      'run',
      'pipeline-nlp',
      '--model', modelId,
      '--input_file', inputPath,
      '--output_file', outputPath,
    ]

    // Add model-specific parameters
    Object.entries(parameters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        args.push(`--${key}`, String(value))
      }
    })

    logger.info('Generated Morpheus CLI command', {
      modelId,
      inputPath,
      outputPath,
      parameters,
      fullCommand: `${config.morpheus.cliCommand} ${args.join(' ')}`
    })

    return {
      command: config.morpheus.cliCommand,
      args,
      env: {
        MORPHEUS_HOST: config.morpheus.host,
        MORPHEUS_PORT: String(config.morpheus.port),
        MORPHEUS_WORK_DIR: config.morpheus.workingDirectory,
        // Add any additional environment variables needed for Morpheus
        CUDA_VISIBLE_DEVICES: process.env.CUDA_VISIBLE_DEVICES || 'all',
      },
    }
  }

  async executeCommand(morpheusCommand: MorpheusCommand): Promise<MorpheusResponse> {
    return new Promise((resolve) => {
      logger.info('Executing Morpheus CLI command', {
        command: morpheusCommand.command,
        args: morpheusCommand.args,
        env: morpheusCommand.env,
      })

      let stdout = ''
      let stderr = ''

      // Execute the morpheus CLI command directly
      // This assumes morpheus CLI is available in the system PATH or via SSH/remote execution
      const child: ChildProcess = spawn(morpheusCommand.command, morpheusCommand.args, {
        env: { ...process.env, ...morpheusCommand.env },
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true, // Enable shell to handle complex commands
      })

      child.stdout?.on('data', (data) => {
        const output = data.toString()
        stdout += output
        logger.debug('Morpheus stdout', { output: output.trim() })
      })

      child.stderr?.on('data', (data) => {
        const output = data.toString()
        stderr += output
        logger.debug('Morpheus stderr', { output: output.trim() })
      })

      child.on('close', (code) => {
        const success = code === 0

        if (success) {
          logger.info('Morpheus CLI command completed successfully', {
            exitCode: code,
            outputLines: stdout.split('\n').length
          })
        } else {
          logger.error('Morpheus CLI command failed', {
            exitCode: code,
            stderr: stderr.trim(),
            stdout: stdout.trim()
          })
        }

        resolve({
          success,
          exitCode: code || 0,
          stdout,
          stderr,
          data: success ? this.parseOutput(stdout) : undefined,
          error: success ? undefined : stderr || `Command execution failed with exit code ${code}`,
        })
      })

      child.on('error', (error) => {
        logger.error('Morpheus CLI command execution error', {
          error: error.message,
          command: morpheusCommand.command,
          args: morpheusCommand.args
        })
        resolve({
          success: false,
          error: `Failed to execute command: ${error.message}`,
          stderr,
          stdout,
        })
      })

      // Set timeout for long-running processes
      const timeout = setTimeout(() => {
        if (!child.killed) {
          logger.warn('Morpheus CLI command timeout, killing process', {
            command: morpheusCommand.command,
            timeout: this.timeout
          })
          child.kill('SIGTERM')

          // Force kill if SIGTERM doesn't work
          setTimeout(() => {
            if (!child.killed) {
              child.kill('SIGKILL')
            }
          }, 5000)

          resolve({
            success: false,
            error: `Command execution timeout after ${this.timeout}ms`,
            stderr,
            stdout,
          })
        }
      }, this.timeout)

      // Clear timeout when process finishes
      child.on('close', () => {
        clearTimeout(timeout)
      })
    })
  }

  async validateModel(modelId: string): Promise<boolean> {
    try {
      const models = await this.getAvailableModels()
      return models.some(model => model.id === modelId)
    } catch (error) {
      logger.error('Failed to validate model', { modelId, error })
      return false
    }
  }

  private parseOutput(stdout: string): any {
    try {
      // Try to parse as JSON first
      const lines = stdout.trim().split('\n')
      const lastLine = lines[lines.length - 1]

      if (lastLine.startsWith('{') || lastLine.startsWith('[')) {
        return JSON.parse(lastLine)
      }

      // Parse structured output
      return {
        processedRecords: this.extractNumber(stdout, /Processed (\d+) records/),
        detections: this.extractNumber(stdout, /Found (\d+) detections/),
        errors: this.extractNumber(stdout, /(\d+) errors?/),
        warnings: this.extractNumber(stdout, /(\d+) warnings?/),
        executionTime: this.extractNumber(stdout, /Execution time: ([\d.]+)s/),
      }
    } catch (error) {
      logger.warn('Failed to parse Morpheus output', { error, stdout })
      return { rawOutput: stdout }
    }
  }

  private extractNumber(text: string, regex: RegExp): number | undefined {
    const match = text.match(regex)
    return match ? parseFloat(match[1]) : undefined
  }
}