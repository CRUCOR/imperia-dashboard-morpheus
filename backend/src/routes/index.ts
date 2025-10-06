/**
 * Routes Index
 * Combines all routes
 */

import { Router } from 'express';
import analysisRoutes from './analysis.routes';
import monitoringRoutes from './monitoring.routes';
import webhookRoutes from './webhook.routes';

const router = Router();

// Mount routes - ORDER MATTERS!
// Monitoring routes must come first to avoid /metrics/global matching /metrics/:analysisId
router.use('/', monitoringRoutes);
router.use('/', analysisRoutes);
router.use('/', webhookRoutes);

export default router;
