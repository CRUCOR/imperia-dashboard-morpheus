/**
 * Main Application Entry Point
 * Imperia Dashboard Morpheus - Backend Service
 */

import express, { Application } from 'express';
import http from 'http';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { swaggerSpec } from './config/swagger';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { pool } from './config/database';
import { socketService } from './services';

const app: Application = express();
const httpServer = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Imperia Dashboard Morpheus API',
  customfavIcon: '/favicon.ico',
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
app.use('/', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize Socket.IO
socketService.initialize(httpServer);

// Start server
const PORT = config.port;

httpServer.listen(PORT, () => {
  console.log('┌────────────────────────────────────────────────┐');
  console.log('│  Imperia Dashboard Morpheus - Backend API     │');
  console.log('└────────────────────────────────────────────────┘');
  console.log();
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${config.nodeEnv}`);
  console.log(`✓ Morpheus URL: ${config.morpheusUrl}`);
  console.log();
  console.log('📚 API Documentation:');
  console.log(`   → http://localhost:${PORT}/api-docs`);
  console.log();
  console.log('🔗 Endpoints:');
  console.log(`   → POST   http://localhost:${PORT}/analyze`);
  console.log(`   → GET    http://localhost:${PORT}/results/:analysisId`);
  console.log(`   → GET    http://localhost:${PORT}/metrics/:analysisId`);
  console.log(`   → GET    http://localhost:${PORT}/status`);
  console.log(`   → GET    http://localhost:${PORT}/metrics/global`);
  console.log(`   → GET    http://localhost:${PORT}/health`);
  console.log();
  console.log('🔌 WebSocket:');
  console.log(`   → ws://localhost:${PORT} (room: results)`);
  console.log();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n⚠ SIGTERM received, closing connections...');
  await pool.end();
  console.log('✓ Database connections closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⚠ SIGINT received, closing connections...');
  await pool.end();
  console.log('✓ Database connections closed');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('✗ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('✗ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
