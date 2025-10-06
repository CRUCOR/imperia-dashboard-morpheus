/**
 * Webhook Service
 * Handles webhook notifications and deliveries
 */

import crypto from 'crypto';
import databaseService from './database.service';
import { Webhook, WebhookEvent, WebhookPayload, CreateWebhookRequest } from '../models';

export class WebhookService {
  /**
   * Create a new webhook subscription
   */
  async createWebhook(data: CreateWebhookRequest): Promise<Webhook> {
    return await databaseService.createWebhook(data);
  }

  /**
   * Get all active webhooks
   */
  async listWebhooks(): Promise<Webhook[]> {
    return await databaseService.getActiveWebhooks();
  }

  /**
   * Get webhook by ID
   */
  async getWebhook(id: number): Promise<Webhook | null> {
    return await databaseService.getWebhookById(id);
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(id: number): Promise<boolean> {
    return await databaseService.deleteWebhook(id);
  }

  /**
   * Update webhook status
   */
  async updateWebhookStatus(id: number, active: boolean): Promise<void> {
    return await databaseService.updateWebhookStatus(id, active);
  }

  /**
   * Get delivery history for a webhook
   */
  async getDeliveries(webhookId: number, limit: number = 50) {
    return await databaseService.getWebhookDeliveries(webhookId, limit);
  }

  /**
   * Notify all webhooks subscribed to an event
   */
  async notifyEvent(event: WebhookEvent, payload: WebhookPayload): Promise<void> {
    const webhooks = await databaseService.getWebhooksByEvent(event);

    if (webhooks.length === 0) {
      console.log(`[Webhook] No webhooks subscribed to event: ${event}`);
      return;
    }

    console.log(`[Webhook] Notifying ${webhooks.length} webhook(s) for event: ${event}`);

    // Send notifications in parallel
    const promises = webhooks.map(webhook => this.deliverWebhook(webhook, event, payload));
    await Promise.allSettled(promises);
  }

  /**
   * Deliver webhook to a specific URL
   */
  private async deliverWebhook(webhook: Webhook, event: WebhookEvent, payload: WebhookPayload): Promise<void> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Imperia-Webhook/1.0',
        'X-Webhook-Event': event,
        'X-Webhook-Delivery-ID': `${Date.now()}-${webhook.id}`,
      };

      // Add HMAC signature if secret is configured
      if (webhook.secret) {
        const signature = this.generateSignature(payload, webhook.secret);
        headers['X-Webhook-Signature'] = signature;
      }

      console.log(`[Webhook] Delivering to ${webhook.url} for event: ${event}`);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const responseBody = await response.text();
      const success = response.status >= 200 && response.status < 300;

      // Log delivery
      await databaseService.logWebhookDelivery(
        webhook.id,
        payload.analysisId,
        event,
        payload,
        response.status,
        responseBody.substring(0, 1000), // Limit response body to 1000 chars
        success
      );

      if (success) {
        console.log(`[Webhook] Successfully delivered to ${webhook.url} (${response.status})`);
      } else {
        console.error(`[Webhook] Failed delivery to ${webhook.url} (${response.status}): ${responseBody}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Webhook] Error delivering to ${webhook.url}:`, errorMessage);

      // Log failed delivery
      await databaseService.logWebhookDelivery(
        webhook.id,
        payload.analysisId,
        event,
        payload,
        undefined,
        undefined,
        false,
        errorMessage
      );
    }
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: any, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

export default new WebhookService();
