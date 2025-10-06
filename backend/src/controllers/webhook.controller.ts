/**
 * Webhook Controller
 * Handles HTTP requests for webhook operations
 */

import { Request, Response } from 'express';
import { webhookService } from '../services';

export class WebhookController {
  /**
   * POST /webhooks
   * Create a new webhook subscription
   */
  async createWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { url, events, secret } = req.body;

      if (!url || !events || !Array.isArray(events)) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'URL and events array are required'
        });
        return;
      }

      // Validate events
      const validEvents = ['status_change', 'analysis_completed', 'analysis_failed'];
      const invalidEvents = events.filter(e => !validEvents.includes(e));

      if (invalidEvents.length > 0) {
        res.status(400).json({
          error: 'Invalid events',
          message: `Invalid events: ${invalidEvents.join(', ')}. Valid events: ${validEvents.join(', ')}`
        });
        return;
      }

      const webhook = await webhookService.createWebhook({ url, events, secret });

      res.status(201).json(webhook);
    } catch (error) {
      console.error('Error in createWebhook:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /webhooks
   * List all active webhooks
   */
  async listWebhooks(req: Request, res: Response): Promise<void> {
    try {
      const webhooks = await webhookService.listWebhooks();
      res.status(200).json({ webhooks });
    } catch (error) {
      console.error('Error in listWebhooks:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /webhooks/:id
   * Get webhook by ID
   */
  async getWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const webhook = await webhookService.getWebhook(parseInt(id));

      if (!webhook) {
        res.status(404).json({ error: 'Webhook not found' });
        return;
      }

      res.status(200).json(webhook);
    } catch (error) {
      console.error('Error in getWebhook:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /webhooks/:id
   * Delete a webhook
   */
  async deleteWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await webhookService.deleteWebhook(parseInt(id));

      if (!deleted) {
        res.status(404).json({ error: 'Webhook not found' });
        return;
      }

      res.status(200).json({ message: 'Webhook deleted successfully' });
    } catch (error) {
      console.error('Error in deleteWebhook:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PATCH /webhooks/:id
   * Update webhook status (activate/deactivate)
   */
  async updateWebhookStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { active } = req.body;

      if (typeof active !== 'boolean') {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Active field must be a boolean'
        });
        return;
      }

      await webhookService.updateWebhookStatus(parseInt(id), active);
      res.status(200).json({ message: 'Webhook status updated successfully' });
    } catch (error) {
      console.error('Error in updateWebhookStatus:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /webhooks/:id/deliveries
   * Get delivery history for a webhook
   */
  async getDeliveries(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const deliveries = await webhookService.getDeliveries(parseInt(id), limit);

      res.status(200).json({
        webhookId: parseInt(id),
        deliveries,
        count: deliveries.length
      });
    } catch (error) {
      console.error('Error in getDeliveries:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new WebhookController();
