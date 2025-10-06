/**
 * Socket Service
 * Handles real-time events with Socket.IO
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export class SocketService {
  private io: SocketIOServer | null = null;

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`[Socket.IO] Client connected: ${socket.id}`);

      // Join the results room automatically
      socket.join('results');
      console.log(`[Socket.IO] Client ${socket.id} joined room: results`);

      socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      });
    });

    console.log('✓ Socket.IO initialized');
  }

  /**
   * Emit event when analysis status changes
   */
  emitStatusChange(analysisId: string, status: string, previousStatus: string, data: any): void {
    if (!this.io) {
      console.warn('[Socket.IO] Cannot emit event - Socket.IO not initialized');
      return;
    }

    const event = {
      type: 'status_change',
      analysisId,
      status,
      previousStatus,
      timestamp: new Date().toISOString(),
      data
    };

    this.io.to('results').emit('analysis:status_change', event);
    console.log(`[Socket.IO] Emitted status_change for ${analysisId}: ${previousStatus} → ${status}`);
  }

  /**
   * Emit event when analysis is completed
   */
  emitAnalysisCompleted(analysisId: string, data: any): void {
    if (!this.io) {
      console.warn('[Socket.IO] Cannot emit event - Socket.IO not initialized');
      return;
    }

    const event = {
      type: 'analysis_completed',
      analysisId,
      timestamp: new Date().toISOString(),
      data
    };

    this.io.to('results').emit('analysis:completed', event);
    console.log(`[Socket.IO] Emitted analysis_completed for ${analysisId}`);
  }

  /**
   * Emit event when analysis fails
   */
  emitAnalysisFailed(analysisId: string, error: string, data: any): void {
    if (!this.io) {
      console.warn('[Socket.IO] Cannot emit event - Socket.IO not initialized');
      return;
    }

    const event = {
      type: 'analysis_failed',
      analysisId,
      error,
      timestamp: new Date().toISOString(),
      data
    };

    this.io.to('results').emit('analysis:failed', event);
    console.log(`[Socket.IO] Emitted analysis_failed for ${analysisId}`);
  }

  /**
   * Get Socket.IO instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export default new SocketService();
