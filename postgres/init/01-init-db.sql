-- Create database schema for imperia-dashboard-morpheus

-- Analyses table
CREATE TABLE IF NOT EXISTS analyses (
    id VARCHAR(255) PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    result JSONB,
    duration_ms INTEGER,
    error TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP
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
CREATE INDEX idx_analysis_metrics_analysis_id ON analysis_metrics(analysis_id);
CREATE INDEX idx_analysis_metrics_timestamp ON analysis_metrics(timestamp DESC);
CREATE INDEX idx_global_metrics_timestamp ON global_metrics(timestamp DESC);

-- Comments for documentation
COMMENT ON TABLE analyses IS 'Stores information about each analysis request';
COMMENT ON TABLE analysis_metrics IS 'Stores metrics collected every 5 seconds during analysis execution';
COMMENT ON TABLE global_metrics IS 'Stores global system metrics for dashboard monitoring';

COMMENT ON COLUMN analyses.id IS 'Unique identifier for the analysis';
COMMENT ON COLUMN analyses.model_name IS 'Name of the model used (e.g., ABP)';
COMMENT ON COLUMN analyses.status IS 'Current status: processing, completed, failed';
COMMENT ON COLUMN analyses.result IS 'JSON result from the model prediction';
COMMENT ON COLUMN analyses.duration_ms IS 'Total duration of the analysis in milliseconds';

COMMENT ON COLUMN analysis_metrics.gpu_usage IS 'GPU usage percentage at time of collection';
COMMENT ON COLUMN analysis_metrics.gpu_mem_mb IS 'GPU memory usage in MB at time of collection';
COMMENT ON COLUMN analysis_metrics.cpu_usage IS 'CPU usage percentage at time of collection';
COMMENT ON COLUMN analysis_metrics.ram_mb IS 'RAM usage in MB at time of collection';
COMMENT ON COLUMN analysis_metrics.throughput IS 'Processing throughput at time of collection';
