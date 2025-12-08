-- Mecha Oldal Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Approved Customers Table
CREATE TABLE IF NOT EXISTS approved_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    has_calculated BOOLEAN DEFAULT FALSE
);

-- 2. User Input Data Table
CREATE TABLE IF NOT EXISTS user_input_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID UNIQUE REFERENCES approved_customers(id) ON DELETE CASCADE,
    task_inputs JSONB DEFAULT '{}',
    results JSONB DEFAULT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_input_customer ON user_input_data(customer_id);

-- 4. Enable Row Level Security
ALTER TABLE approved_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_input_data ENABLE ROW LEVEL SECURITY;

-- 5. Create policies (allow all for anon key for this simple app)
-- In production, you'd want more restrictive policies

CREATE POLICY "Allow read approved_customers" ON approved_customers
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow update approved_customers" ON approved_customers
    FOR UPDATE TO anon USING (true);

CREATE POLICY "Allow all on user_input_data" ON user_input_data
    FOR ALL TO anon USING (true);

-- 6. Sample data: Insert a test customer
INSERT INTO approved_customers (id, customer_name, has_calculated) VALUES
    ('123e4567-e89b-12d3-a456-426614174000', 'Test User', false)
ON CONFLICT (id) DO NOTHING;

-- Additional helper: Function to generate customer IDs
CREATE OR REPLACE FUNCTION generate_customer_id(name TEXT)
RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    new_id := gen_random_uuid();
    INSERT INTO approved_customers (id, customer_name) VALUES (new_id, name);
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Usage: SELECT generate_customer_id('John Doe');
