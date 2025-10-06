/**
 * Webhook Model
 * Defines webhook-related types
 */

export type WebhookEvent = 'status_change' | 'analysis_completed' | 'analysis_failed';

export interface Webhook {
  id: number;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface WebhookDelivery {
  id: number;
  webhook_id: number;
  analysis_id: string;
  event: WebhookEvent;
  payload: any;
  status_code?: number;
  response_body?: string;
  success: boolean;
  error?: string;
  delivered_at: Date;
}

export interface CreateWebhookRequest {
  url: string;
  events: WebhookEvent[];
  secret?: string;
}

export interface WebhookPayload {
  event: WebhookEvent;
  analysisId: string;
  timestamp: string;
  data: {
    analysisId: string;
    modelName: string;
    status: string;
    previousStatus?: string;
    result?: any;
    error?: string;
    duration_ms?: number;
    created_at: Date;
    completed_at?: Date;
  };
}
