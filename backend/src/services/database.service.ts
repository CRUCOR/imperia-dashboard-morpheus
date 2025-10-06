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
   * Stores statistics and metadata in analyses table
   * Predictions are stored separately in predictions table to avoid JSONB 256MB limit
   */
  async updateAnalysisResult(
    id: string,
    status: string,
    result: any,
    duration: number
  ): Promise<void> {
    // Store only statistics and metadata in analyses table
    const resultForDb = {
      analysisId: result.analysisId,
      model: result.model,
      num_rows: result.num_rows,
      statistics: result.statistics,
      metadata: result.metadata,
      predictions_stored_separately: true
    };

    await pool.query(
      `UPDATE analyses
       SET status = $1, result = $2, duration_ms = $3, completed_at = NOW()
       WHERE id = $4`,
      [status, JSON.stringify(resultForDb), duration, id]
    );
  }

  /**
   * Insert predictions in batch (efficient bulk insert)
   * Uses batch inserts with 1000 predictions per query for optimal performance
   */
  async insertPredictionsBatch(
    analysisId: string,
    predictions: any[]
  ): Promise<void> {
    if (predictions.length === 0) return;

    const batchSize = 1000;
    const totalBatches = Math.ceil(predictions.length / batchSize);

    console.log(`[${analysisId}] Inserting ${predictions.length} predictions in ${totalBatches} batches...`);

    for (let i = 0; i < predictions.length; i += batchSize) {
      const batch = predictions.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;

      // Build VALUES clause for batch insert
      const values: any[] = [];
      const placeholders: string[] = [];
      let paramIndex = 1;

      batch.forEach((pred) => {
        placeholders.push(
          `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8})`
        );
        values.push(
          analysisId,
          pred.row_id,
          pred.prediction.is_mining,
          pred.prediction.mining_probability,
          pred.prediction.regular_probability,
          pred.prediction.confidence,
          pred.prediction.anomaly_score,
          JSON.stringify(pred.prediction.detected_patterns || []),
          JSON.stringify(pred.packet_info || {})
        );
        paramIndex += 9;
      });

      const query = `
        INSERT INTO predictions (
          analysis_id, row_id, is_mining, mining_probability, regular_probability,
          confidence, anomaly_score, detected_patterns, packet_info
        ) VALUES ${placeholders.join(', ')}
      `;

      await pool.query(query, values);
      
      if (batchNum % 10 === 0 || batchNum === totalBatches) {
        console.log(`[${analysisId}] Inserted batch ${batchNum}/${totalBatches} (${Math.min(i + batchSize, predictions.length)}/${predictions.length} predictions)`);
      }
    }

    console.log(`[${analysisId}] ✓ All ${predictions.length} predictions inserted successfully`);
  }

  /**
   * Get predictions for an analysis with pagination
   */
  async getPredictions(
    analysisId: string,
    limit: number = 1000,
    offset: number = 0,
    miningOnly: boolean = false
  ): Promise<any[]> {
    let query = `
      SELECT 
        row_id,
        is_mining,
        mining_probability,
        regular_probability,
        confidence,
        anomaly_score,
        detected_patterns,
        packet_info
      FROM predictions
      WHERE analysis_id = $1
    `;

    const params: any[] = [analysisId];
    let paramIndex = 2;

    if (miningOnly) {
      query += ` AND is_mining = true`;
    }

    query += ` ORDER BY row_id ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Transform to match original prediction format
    return result.rows.map(row => ({
      row_id: row.row_id,
      prediction: {
        is_mining: row.is_mining,
        mining_probability: row.mining_probability,
        regular_probability: row.regular_probability,
        confidence: row.confidence,
        anomaly_score: row.anomaly_score,
        detected_patterns: row.detected_patterns
      },
      packet_info: row.packet_info
    }));
  }

  /**
   * Get total predictions count for an analysis
   */
  async getPredictionsCount(
    analysisId: string,
    miningOnly: boolean = false
  ): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM predictions WHERE analysis_id = $1';
    
    if (miningOnly) {
      query += ' AND is_mining = true';
    }

    const result = await pool.query(query, [analysisId]);
    return parseInt(result.rows[0].count);
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

    const analysis = result.rows[0];
    
    // Get metrics for this analysis
    const metricsResult = await pool.query(
      `SELECT timestamp, gpu_usage, gpu_mem_mb as gpu_memory, cpu_usage, ram_mb
       FROM analysis_metrics
       WHERE analysis_id = $1
       ORDER BY timestamp ASC`,
      [id]
    );

    // Transform metrics into the format expected by frontend
    if (metricsResult.rows.length > 0) {
      const metrics = {
        gpu_usage: metricsResult.rows.map(row => ({
          timestamp: row.timestamp,
          usage: row.gpu_usage
        })),
        gpu_memory: metricsResult.rows.map(row => ({
          timestamp: row.timestamp,
          memory: row.gpu_memory
        })),
        cpu_usage: metricsResult.rows.map(row => ({
          timestamp: row.timestamp,
          usage: row.cpu_usage
        })),
        ram_mb: metricsResult.rows.map(row => ({
          timestamp: row.timestamp,
          memory: row.ram_mb
        }))
      };
      
      analysis.metrics = metrics;
    }

    return analysis;
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
   * Excludes input_data and result to reduce payload size
   */
  async listAnalyses(limit: number, offset: number): Promise<Analysis[]> {
    const result = await pool.query(
      `SELECT 
         id,
         model_name,
         status,
         CASE 
           WHEN input_data IS NOT NULL AND input_data->>'num_rows' IS NOT NULL 
           THEN jsonb_build_object('num_rows', (input_data->>'num_rows')::int)
           ELSE NULL 
         END as input_data,
         CASE 
           WHEN result IS NOT NULL AND result->>'num_rows' IS NOT NULL 
           THEN jsonb_build_object('num_rows', (result->>'num_rows')::int)
           ELSE NULL 
         END as result,
         duration_ms,
         error,
         file_metadata,
         model_parameters,
         created_at,
         completed_at
       FROM analyses
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  }
}

export default new DatabaseService();
