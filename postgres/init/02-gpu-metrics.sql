-- Create GPU Metrics table
-- This table stores GPU usage metrics at 5-second intervals

CREATE TABLE IF NOT EXISTS gpu_metrics (
    id SERIAL PRIMARY KEY,
    usage DECIMAL(5,2) NOT NULL,
    memory_mb DECIMAL(10,2) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for faster timestamp queries
CREATE INDEX idx_gpu_metrics_timestamp ON gpu_metrics(timestamp DESC);

-- Add comment to table
COMMENT ON TABLE gpu_metrics IS 'Stores GPU usage metrics at 5-second intervals';
COMMENT ON COLUMN gpu_metrics.usage IS 'GPU usage percentage (0-100)';
COMMENT ON COLUMN gpu_metrics.memory_mb IS 'GPU memory usage in megabytes';
COMMENT ON COLUMN gpu_metrics.timestamp IS 'Metric timestamp';
