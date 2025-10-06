-- Create database schema for imperia-dashboard-morpheus

-- Analyses table (stores summary and metadata)
CREATE TABLE IF NOT EXISTS analyses (
    id VARCHAR(255) PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    input_data JSONB,
    result JSONB, -- Now stores only statistics and metadata (not individual predictions)
    duration_ms INTEGER,
    error TEXT,
    file_metadata JSONB,
    model_parameters JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Predictions table (stores individual predictions - one row per prediction)
-- This avoids JSONB 256MB limit by splitting predictions into separate rows
CREATE TABLE IF NOT EXISTS predictions (
    id BIGSERIAL PRIMARY KEY,
    analysis_id VARCHAR(255) NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    row_id INTEGER NOT NULL, -- Original row number from input file
    is_mining BOOLEAN NOT NULL,
    mining_probability FLOAT NOT NULL,
    regular_probability FLOAT NOT NULL,
    confidence FLOAT NOT NULL,
    anomaly_score FLOAT NOT NULL,
    detected_patterns JSONB, -- Array of detected pattern objects
    packet_info JSONB, -- Packet metadata (src_ip, dest_ip, ports, protocol, etc.)
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Analysis metrics table (collected every 5s during execution)
CREATE TABLE IF NOT EXISTS analysis_metrics (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(255) NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    gpu_usage FLOAT,
    gpu_mem_mb FLOAT,
    cpu_usage FLOAT,
    ram_mb FLOAT,
    duration_ms INTEGER,
    throughput FLOAT,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Global metrics table (for system monitoring)
CREATE TABLE IF NOT EXISTS global_metrics (
    id SERIAL PRIMARY KEY,
    gpu_usage FLOAT,
    gpu_mem_mb FLOAT,
    cpu_usage FLOAT,
    ram_mb FLOAT,
    services_status JSONB,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX idx_predictions_analysis_id ON predictions(analysis_id);
CREATE INDEX idx_predictions_row_id ON predictions(analysis_id, row_id);
CREATE INDEX idx_predictions_is_mining ON predictions(analysis_id, is_mining);
CREATE INDEX idx_analysis_metrics_analysis_id ON analysis_metrics(analysis_id);
CREATE INDEX idx_analysis_metrics_timestamp ON analysis_metrics(timestamp DESC);
CREATE INDEX idx_global_metrics_timestamp ON global_metrics(timestamp DESC);

-- Comments for documentation
COMMENT ON TABLE analyses IS 'Stores information about each analysis request';
COMMENT ON TABLE predictions IS 'Stores individual predictions for each packet analyzed (one row per prediction)';
COMMENT ON TABLE analysis_metrics IS 'Stores metrics collected every 5 seconds during analysis execution';
COMMENT ON TABLE global_metrics IS 'Stores global system metrics for dashboard monitoring';

COMMENT ON COLUMN analyses.id IS 'Unique identifier for the analysis';
COMMENT ON COLUMN analyses.model_name IS 'Name of the model used (e.g., ABP)';
COMMENT ON COLUMN analyses.status IS 'Current status: processing, completed, failed';
COMMENT ON COLUMN analyses.result IS 'JSON result with statistics and metadata (predictions stored separately)';
COMMENT ON COLUMN analyses.duration_ms IS 'Total duration of the analysis in milliseconds';

COMMENT ON COLUMN predictions.analysis_id IS 'Reference to the parent analysis';
COMMENT ON COLUMN predictions.row_id IS 'Row number from the original input file (0-indexed)';
COMMENT ON COLUMN predictions.is_mining IS 'Boolean indicating if mining activity was detected';
COMMENT ON COLUMN predictions.mining_probability IS 'Probability of mining activity (0.0-1.0)';
COMMENT ON COLUMN predictions.confidence IS 'Confidence level of the prediction (0.0-1.0)';
COMMENT ON COLUMN predictions.detected_patterns IS 'Array of detected pattern objects';
COMMENT ON COLUMN predictions.packet_info IS 'Network packet metadata (IPs, ports, protocol, etc.)';

COMMENT ON COLUMN analysis_metrics.gpu_usage IS 'GPU usage percentage at time of collection';
COMMENT ON COLUMN analysis_metrics.gpu_mem_mb IS 'GPU memory usage in MB at time of collection';
COMMENT ON COLUMN analysis_metrics.cpu_usage IS 'CPU usage percentage at time of collection';
COMMENT ON COLUMN analysis_metrics.ram_mb IS 'RAM usage in MB at time of collection';
COMMENT ON COLUMN analysis_metrics.throughput IS 'Processing throughput at time of collection';

