-- Create tasks_config table for storing task configurations
CREATE TABLE IF NOT EXISTS tasks_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_data JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on updated_at for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_config_updated_at ON tasks_config(updated_at DESC);

-- Insert initial empty config if table is empty
INSERT INTO tasks_config (config_data, version)
SELECT '{"tasks": [], "lastUpdated": ""}'::jsonb, 1
WHERE NOT EXISTS (SELECT 1 FROM tasks_config);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_tasks_config_updated_at ON tasks_config;
CREATE TRIGGER update_tasks_config_updated_at
    BEFORE UPDATE ON tasks_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
