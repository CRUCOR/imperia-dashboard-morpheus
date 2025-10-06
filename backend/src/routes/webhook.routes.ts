/**
 * Webhook Routes
 * Defines routes for webhook operations
 */

import { Router } from 'express';
import { webhookController } from '../controllers';

const router = Router();

/**
 * @swagger
 * /webhooks:
 *   post:
 *     summary: Create a new webhook subscription
 *     description: Register a webhook URL to receive notifications when analysis status changes
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - events
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: The URL where webhook notifications will be sent
 *                 example: https://example.com/webhook
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [status_change, analysis_completed, analysis_failed]
 *                 description: Array of events to subscribe to
 *                 example: ["status_change", "analysis_completed"]
 *               secret:
 *                 type: string
 *                 description: Optional secret for HMAC signature verification
 *                 example: my-secret-key
 *           examples:
 *             basic:
 *               summary: Basic webhook subscription
 *               value:
 *                 url: https://example.com/webhook
 *                 events: ["status_change"]
 *             complete:
 *               summary: Webhook with all events and secret
 *               value:
 *                 url: https://example.com/webhook
 *                 events: ["status_change", "analysis_completed", "analysis_failed"]
 *                 secret: my-webhook-secret-key
 *     responses:
 *       201:
 *         description: Webhook created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: number
 *                 url:
 *                   type: string
 *                 events:
 *                   type: array
 *                   items:
 *                     type: string
 *                 active:
 *                   type: boolean
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *             example:
 *               id: 1
 *               url: https://example.com/webhook
 *               events: ["status_change", "analysis_completed"]
 *               active: true
 *               created_at: "2025-10-06T10:00:00.000Z"
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
router.post('/webhooks', webhookController.createWebhook);

/**
 * @swagger
 * /webhooks:
 *   get:
 *     summary: List all active webhooks
 *     description: Retrieve a list of all active webhook subscriptions
 *     tags: [Webhooks]
 *     responses:
 *       200:
 *         description: List of webhooks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 webhooks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       url:
 *                         type: string
 *                       events:
 *                         type: array
 *                         items:
 *                           type: string
 *                       active:
 *                         type: boolean
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *             example:
 *               webhooks:
 *                 - id: 1
 *                   url: https://example.com/webhook
 *                   events: ["status_change"]
 *                   active: true
 *                   created_at: "2025-10-06T10:00:00.000Z"
 *       500:
 *         description: Internal server error
 */
router.get('/webhooks', webhookController.listWebhooks);

/**
 * @swagger
 * /webhooks/{id}:
 *   get:
 *     summary: Get webhook by ID
 *     description: Retrieve details of a specific webhook
 *     tags: [Webhooks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The webhook ID
 *     responses:
 *       200:
 *         description: Webhook retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: number
 *                 url:
 *                   type: string
 *                 events:
 *                   type: array
 *                   items:
 *                     type: string
 *                 active:
 *                   type: boolean
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Webhook not found
 *       500:
 *         description: Internal server error
 */
router.get('/webhooks/:id', webhookController.getWebhook);

/**
 * @swagger
 * /webhooks/{id}:
 *   delete:
 *     summary: Delete a webhook
 *     description: Remove a webhook subscription
 *     tags: [Webhooks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The webhook ID
 *     responses:
 *       200:
 *         description: Webhook deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: Webhook deleted successfully
 *       404:
 *         description: Webhook not found
 *       500:
 *         description: Internal server error
 */
router.delete('/webhooks/:id', webhookController.deleteWebhook);

/**
 * @swagger
 * /webhooks/{id}:
 *   patch:
 *     summary: Update webhook status
 *     description: Activate or deactivate a webhook
 *     tags: [Webhooks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The webhook ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - active
 *             properties:
 *               active:
 *                 type: boolean
 *                 description: Whether the webhook should be active
 *           example:
 *             active: false
 *     responses:
 *       200:
 *         description: Webhook status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: Webhook status updated successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
router.patch('/webhooks/:id', webhookController.updateWebhookStatus);

/**
 * @swagger
 * /webhooks/{id}/deliveries:
 *   get:
 *     summary: Get webhook delivery history
 *     description: Retrieve the delivery log for a specific webhook
 *     tags: [Webhooks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The webhook ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of deliveries to return
 *     responses:
 *       200:
 *         description: Delivery history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 webhookId:
 *                   type: number
 *                 deliveries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       analysis_id:
 *                         type: string
 *                       event:
 *                         type: string
 *                       status_code:
 *                         type: number
 *                       success:
 *                         type: boolean
 *                       delivered_at:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: number
 *             example:
 *               webhookId: 1
 *               deliveries:
 *                 - id: 1
 *                   analysis_id: analysis_1728168000_abc123
 *                   event: analysis_completed
 *                   status_code: 200
 *                   success: true
 *                   delivered_at: "2025-10-06T10:05:00.000Z"
 *               count: 1
 *       500:
 *         description: Internal server error
 */
router.get('/webhooks/:id/deliveries', webhookController.getDeliveries);

export default router;
