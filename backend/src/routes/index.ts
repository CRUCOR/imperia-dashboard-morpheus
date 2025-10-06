/**
 * Routes Index
 * Combines all routes
 */

import { Router } from 'express';
import analysisRoutes from './analysis.routes';
import monitoringRoutes from './monitoring.routes';

const router = Router();

// Mount routes
router.use('/', analysisRoutes);
router.use('/', monitoringRoutes);

export default router;
