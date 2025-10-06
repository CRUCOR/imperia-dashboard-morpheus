/**
 * Database Service
 * Handles all database operations
 */

import { pool } from '../config/database';
import { Analysis, AnalysisMetric, FileMetadata, ABPParameters } from '../models';

export class DatabaseService {
  /**
   * Create a new analysis record
   */
  async createAnalysis(
    id: string,
    modelName: string,
    fileMetadata?: FileMetadata,
    modelParameters?: ABPParameters
  ): Promise<void> {
    await pool.query(
      `INSERT INTO analyses (id, model_name, status, file_metadata, model_parameters, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        id,
        modelName,
        'processing',
        fileMetadata ? JSON.stringify(fileMetadata) : null,
        modelParameters ? JSON.stringify(modelParameters) : null
      ]
    );
  }

  /**
   * Update analysis with input data
   */
  async updateAnalysisInput(id: string, inputData: any): Promise<void> {
    await pool.query(
      `UPDATE analyses
       SET input_data = $1
       WHERE id = $2`,
      [JSON.stringify(inputData), id]
    );
  }

  /**
   * Update analysis with result
   */
  async updateAnalysisResult(
    id: string,
    status: string,
    result: any,
    duration: number
  ): Promise<void> {
    await pool.query(
      `UPDATE analyses
       SET status = $1, result = $2, duration_ms = $3, completed_at = NOW()
       WHERE id = $4`,
      [status, JSON.stringify(result), duration, id]
    );
  }

  /**
   * Update analysis with error
   */
  async updateAnalysisError(id: string, error: string): Promise<void> {
    await pool.query(
      `UPDATE analyses
       SET status = $1, error = $2, completed_at = NOW()
       WHERE id = $3`,
      ['failed', error, id]
    );
  }

  /**
   * Get analysis by ID
   */
  async getAnalysisById(id: string): Promise<Analysis | null> {
    const result = await pool.query(
      `SELECT * FROM analyses WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Insert analysis metric
   */
  async insertAnalysisMetric(
    analysisId: string,
    gpuUsage: number,
    gpuMemMb: number,
    cpuUsage: number,
    ramMb: number,
    durationMs: number,
    throughput: number
  ): Promise<void> {
    await pool.query(
      `INSERT INTO analysis_metrics
       (analysis_id, gpu_usage, gpu_mem_mb, cpu_usage, ram_mb, duration_ms, throughput, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [analysisId, gpuUsage, gpuMemMb, cpuUsage, ramMb, durationMs, throughput]
    );
  }

  /**
   * Get analysis metrics by analysis ID
   */
  async getAnalysisMetrics(analysisId: string): Promise<AnalysisMetric[]> {
    const result = await pool.query(
      `SELECT * FROM analysis_metrics
       WHERE analysis_id = $1
       ORDER BY timestamp ASC`,
      [analysisId]
    );

    return result.rows;
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * List analyses with pagination
   */
  async listAnalyses(limit: number, offset: number): Promise<Analysis[]> {
    const result = await pool.query(
      `SELECT * FROM analyses
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  }
}

export default new DatabaseService();
