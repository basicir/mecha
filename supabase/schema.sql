-- =============================================
-- MECHA OLDAL - SUPABASE DATABASE SCHEMA v2
-- =============================================
-- Scalable JSON-based storage for inputs and results
-- Run this in your Supabase SQL Editor

-- Drop old tables if migrating (CAREFUL - this deletes data!)
-- DROP TABLE IF EXISTS results CASCADE;
-- DROP TABLE IF EXISTS saved_inputs CASCADE;
-- DROP TABLE IF EXISTS customers CASCADE;
-- DROP TABLE IF EXISTS config CASCADE;

-- 1. CUSTOMER DATA TABLE
-- Stores all customer data in a single row with JSONB columns
CREATE TABLE IF NOT EXISTS customer_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_access TIMESTAMPTZ,
  has_calculated BOOLEAN DEFAULT FALSE,
  
  -- Flexible JSON storage for inputs and results
  inputs JSONB DEFAULT '{}'::jsonb,
  results JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  inputs_saved_at TIMESTAMPTZ,
  results_calculated_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE customer_data ENABLE ROW LEVEL SECURITY;

-- 2. CONFIG TABLE
-- Stores equations and field configurations
CREATE TABLE IF NOT EXISTS config (
  id SERIAL PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT
);

-- Insert default configuration for fields
INSERT INTO config (config_key, config_value, description) 
VALUES (
  'calculator_fields',
  '{
    "inputs": [
      {"key": "a", "label": "Value A", "type": "number", "placeholder": "Enter value A"},
      {"key": "b", "label": "Value B", "type": "number", "placeholder": "Enter value B"}
    ],
    "formula": {
      "name": "sum",
      "expression": "a + b",
      "resultKey": "c",
      "description": "Adds two values together"
    }
  }'::jsonb,
  'Calculator input fields and formula configuration'
)
ON CONFLICT (config_key) DO NOTHING;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Allow all operations for now (use service role for admin operations)
CREATE POLICY "Allow select customer_data" ON customer_data
  FOR SELECT USING (true);

CREATE POLICY "Allow insert customer_data" ON customer_data
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update customer_data" ON customer_data
  FOR UPDATE USING (true);

-- Allow reading config
CREATE POLICY "Allow read config" ON config
  FOR SELECT USING (true);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Generate a new customer ID
CREATE OR REPLACE FUNCTION generate_customer_id(customer_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO customer_data (name) VALUES (customer_name) RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

-- Update inputs for a customer (merges with existing inputs)
CREATE OR REPLACE FUNCTION update_customer_inputs(
  p_customer_id UUID,
  p_inputs JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE customer_data 
  SET 
    inputs = COALESCE(inputs, '{}'::jsonb) || p_inputs,
    inputs_saved_at = NOW(),
    last_access = NOW()
  WHERE id = p_customer_id;
  
  RETURN FOUND;
END;
$$;

-- Save results for a customer
CREATE OR REPLACE FUNCTION save_customer_results(
  p_customer_id UUID,
  p_results JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE customer_data 
  SET 
    results = p_results,
    results_calculated_at = NOW(),
    has_calculated = TRUE,
    last_access = NOW()
  WHERE id = p_customer_id;
  
  RETURN FOUND;
END;
$$;

-- =============================================
-- MIGRATION HELPER (if you have existing data)
-- =============================================
-- Run this to migrate from old schema to new:
/*
INSERT INTO customer_data (id, name, created_at, has_calculated, last_access, inputs, results)
SELECT 
  c.id,
  c.name,
  c.created_at,
  c.has_calculated,
  c.last_access,
  COALESCE(
    jsonb_build_object('a', si.input_a, 'b', si.input_b),
    '{}'::jsonb
  ),
  COALESCE(
    jsonb_build_object('c', r.result_c),
    '{}'::jsonb
  )
FROM customers c
LEFT JOIN saved_inputs si ON c.id = si.customer_id
LEFT JOIN results r ON c.id = r.customer_id;
*/

-- =============================================
-- USAGE EXAMPLES
-- =============================================
-- Generate a new customer:
-- SELECT generate_customer_id('John Doe');
--
-- Save inputs:
-- SELECT update_customer_inputs('uuid-here', '{"a": 10, "b": 20}'::jsonb);
--
-- Save results:
-- SELECT save_customer_results('uuid-here', '{"c": 30}'::jsonb);
--
-- Get customer data:
-- SELECT * FROM customer_data WHERE id = 'uuid-here';
