/**
 * Monitoring Routes
 * Defines routes for monitoring and health checks
 */

import { Router } from 'express';
import { monitoringController } from '../controllers';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the backend service is running and healthy
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 service:
 *                   type: string
 *                   example: backend
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *             example:
 *               status: healthy
 *               service: backend
 *               timestamp: "2025-10-05T10:00:00.000Z"
 *       500:
 *         description: Service is unhealthy
 */
router.get('/health', monitoringController.healthCheck);

/**
 * @swagger
 * /status:
 *   get:
 *     summary: Get status of all services
 *     description: Retrieve the health status of backend, database, and ML model services
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Services status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 backend:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy, unknown]
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                 postgres:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy, unknown]
 *                     error:
 *                       type: string
 *                 morpheus:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy, unknown]
 *                     service:
 *                       type: string
 *                     model_loaded:
 *                       type: boolean
 *                     gpu_available:
 *                       type: boolean
 *                     error:
 *                       type: string
 *             examples:
 *               allHealthy:
 *                 summary: All services healthy
 *                 value:
 *                   backend:
 *                     status: healthy
 *                     timestamp: "2025-10-05T10:00:00.000Z"
 *                   postgres:
 *                     status: healthy
 *                   morpheus:
 *                     status: healthy
 *                     service: morpheus-triton
 *                     model_loaded: true
 *                     gpu_available: false
 *               morpheusDown:
 *                 summary: Morpheus service unavailable
 *                 value:
 *                   backend:
 *                     status: healthy
 *                     timestamp: "2025-10-05T10:00:00.000Z"
 *                   postgres:
 *                     status: healthy
 *                   morpheus:
 *                     status: unhealthy
 *                     error: "Failed to connect to Morpheus service"
 *       500:
 *         description: Internal server error
 */
router.get('/status', monitoringController.getServicesStatus);

/**
 * @swagger
 * /metrics/global:
 *   get:
 *     summary: Get global system metrics
 *     description: Retrieve current system-wide metrics including GPU, CPU, RAM usage and service status
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Global metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gpu_usage:
 *                   type: number
 *                   description: Current GPU usage percentage
 *                 gpu_mem_mb:
 *                   type: number
 *                   description: Current GPU memory usage in MB
 *                 cpu_usage:
 *                   type: number
 *                   description: Current CPU usage percentage
 *                 ram_mb:
 *                   type: number
 *                   description: Current RAM usage in MB
 *                 services:
 *                   type: object
 *                   properties:
 *                     backend:
 *                       type: object
 *                     postgres:
 *                       type: object
 *                     morpheus:
 *                       type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *             examples:
 *               normal:
 *                 summary: Normal system load
 *                 value:
 *                   gpu_usage: 45.2
 *                   gpu_mem_mb: 3072.5
 *                   cpu_usage: 32.8
 *                   ram_mb: 4096.2
 *                   services:
 *                     backend:
 *                       status: healthy
 *                       timestamp: "2025-10-05T10:00:00.000Z"
 *                     postgres:
 *                       status: healthy
 *                     morpheus:
 *                       status: healthy
 *                       service: morpheus-triton
 *                       model_loaded: true
 *                       gpu_available: false
 *                   timestamp: "2025-10-05T10:00:00.000Z"
 *               highLoad:
 *                 summary: High system load
 *                 value:
 *                   gpu_usage: 92.5
 *                   gpu_mem_mb: 7890.3
 *                   cpu_usage: 85.4
 *                   ram_mb: 14336.8
 *                   services:
 *                     backend:
 *                       status: healthy
 *                       timestamp: "2025-10-05T10:00:00.000Z"
 *                     postgres:
 *                       status: healthy
 *                     morpheus:
 *                       status: healthy
 *                       service: morpheus-triton
 *                       model_loaded: true
 *                       gpu_available: true
 *                   timestamp: "2025-10-05T10:00:00.000Z"
 *       500:
 *         description: Internal server error
 */
router.get('/metrics/global', monitoringController.getGlobalMetrics);

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Retrieve statistics for the dashboard including total analyses, in progress, recent analyses, services status, and GPU metrics
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/dashboard/stats', monitoringController.getDashboardStats);

/**
 * @swagger
 * /dashboard/gpu-usage:
 *   get:
 *     summary: Get GPU usage history
 *     description: Retrieve current and historical GPU usage data
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: GPU usage history retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/dashboard/gpu-usage', monitoringController.getGpuUsageHistory);

export default router;
