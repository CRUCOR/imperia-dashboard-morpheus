/**
 * Socket Service
 * Handles WebSocket connections for real-time updates
 */

import { io, Socket } from 'socket.io-client';
import type { AnalysisProgress } from '../types';

class SocketService {
  private socket: Socket | null = null;

  connect(): void {
    if (this.socket) {
      return; // Already connected
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onAnalysisProgress(callback: (data: AnalysisProgress) => void): void {
    if (!this.socket) {
      console.warn('Socket not connected');
      return;
    }
    this.socket.on('analysis_progress', callback);
  }

  offAnalysisProgress(callback?: (data: AnalysisProgress) => void): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off('analysis_progress', callback);
    } else {
      this.socket.off('analysis_progress');
    }
  }

  onAnalysisComplete(callback: (data: any) => void): void {
    if (!this.socket) {
      console.warn('Socket not connected');
      return;
    }
    this.socket.on('analysis_complete', callback);
  }

  offAnalysisComplete(callback?: (data: any) => void): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off('analysis_complete', callback);
    } else {
      this.socket.off('analysis_complete');
    }
  }

  onAnalysisError(callback: (data: any) => void): void {
    if (!this.socket) {
      console.warn('Socket not connected');
      return;
    }
    this.socket.on('analysis_error', callback);
  }

  offAnalysisError(callback?: (data: any) => void): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off('analysis_error', callback);
    } else {
      this.socket.off('analysis_error');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new SocketService();
