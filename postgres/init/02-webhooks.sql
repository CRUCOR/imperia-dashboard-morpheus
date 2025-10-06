/**
 * Webhook Schema
 * Stores webhook subscriptions and delivery logs
 */

-- Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  url VARCHAR(500) NOT NULL,
  events VARCHAR(50)[] NOT NULL, -- Array of events: ['status_change', 'analysis_completed', 'analysis_failed']
  secret VARCHAR(255), -- Optional secret for HMAC signature
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Webhook delivery logs
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id SERIAL PRIMARY KEY,
  webhook_id INTEGER REFERENCES webhooks(id) ON DELETE CASCADE,
  analysis_id VARCHAR(255) REFERENCES analyses(id),
  event VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  success BOOLEAN DEFAULT false,
  error TEXT,
  delivered_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(active);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_analysis_id ON webhook_deliveries(analysis_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_delivered_at ON webhook_deliveries(delivered_at);
