/**
 * Database Service
 * Handles all database operations
 */

import { pool } from '../config/database';
import { Analysis, AnalysisMetric, Webhook, WebhookDelivery, CreateWebhookRequest } from '../models';

export class DatabaseService {
  /**
   * Create a new analysis record
   */
  async createAnalysis(id: string, modelName: string): Promise<void> {
    await pool.query(
      `INSERT INTO analyses (id, model_name, status, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [id, modelName, 'processing']
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

  // ==================== WEBHOOK METHODS ====================

  /**
   * Create a new webhook
   */
  async createWebhook(data: CreateWebhookRequest): Promise<Webhook> {
    const result = await pool.query(
      `INSERT INTO webhooks (url, events, secret, active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.url, data.events, data.secret || null, true]
    );

    return result.rows[0];
  }

  /**
   * Get all active webhooks
   */
  async getActiveWebhooks(): Promise<Webhook[]> {
    const result = await pool.query(
      `SELECT * FROM webhooks WHERE active = true`
    );

    return result.rows;
  }

  /**
   * Get webhooks by event type
   */
  async getWebhooksByEvent(event: string): Promise<Webhook[]> {
    const result = await pool.query(
      `SELECT * FROM webhooks
       WHERE active = true AND $1 = ANY(events)`,
      [event]
    );

    return result.rows;
  }

  /**
   * Get webhook by ID
   */
  async getWebhookById(id: number): Promise<Webhook | null> {
    const result = await pool.query(
      `SELECT * FROM webhooks WHERE id = $1`,
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(id: number): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM webhooks WHERE id = $1`,
      [id]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Update webhook active status
   */
  async updateWebhookStatus(id: number, active: boolean): Promise<void> {
    await pool.query(
      `UPDATE webhooks
       SET active = $1, updated_at = NOW()
       WHERE id = $2`,
      [active, id]
    );
  }

  /**
   * Log webhook delivery
   */
  async logWebhookDelivery(
    webhookId: number,
    analysisId: string,
    event: string,
    payload: any,
    statusCode?: number,
    responseBody?: string,
    success: boolean = false,
    error?: string
  ): Promise<void> {
    await pool.query(
      `INSERT INTO webhook_deliveries
       (webhook_id, analysis_id, event, payload, status_code, response_body, success, error)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [webhookId, analysisId, event, JSON.stringify(payload), statusCode, responseBody, success, error]
    );
  }

  /**
   * Get webhook deliveries for a webhook
   */
  async getWebhookDeliveries(webhookId: number, limit: number = 50): Promise<WebhookDelivery[]> {
    const result = await pool.query(
      `SELECT * FROM webhook_deliveries
       WHERE webhook_id = $1
       ORDER BY delivered_at DESC
       LIMIT $2`,
      [webhookId, limit]
    );

    return result.rows;
  }
}

export default new DatabaseService();
