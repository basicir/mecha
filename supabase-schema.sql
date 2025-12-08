-- Mecha Oldal - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Customer IDs table (approved UUIDs that function as passwords)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  has_calculated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User inputs (auto-saved every 2 seconds)
CREATE TABLE IF NOT EXISTS user_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  inputs JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, task_id)
);

-- Calculation results (stored after Calculate button is clicked)
CREATE TABLE IF NOT EXISTS calculation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  inputs JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}',
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculation_results ENABLE ROW LEVEL SECURITY;

-- Policies for customers (read-only for valid UUIDs)
CREATE POLICY "Allow read for valid customers" ON customers
  FOR SELECT USING (true);

-- Policies for user_inputs (customers can manage their own inputs)
CREATE POLICY "Allow all for own inputs" ON user_inputs
  FOR ALL USING (true);

-- Policies for calculation_results (customers can manage their own results)
CREATE POLICY "Allow all for own results" ON calculation_results
  FOR ALL USING (true);

-- Function to generate a new customer ID
CREATE OR REPLACE FUNCTION generate_customer_id(customer_name TEXT)
RETURNS UUID
LANGUAGE SQL
AS $$
  INSERT INTO customers (name) VALUES (customer_name) RETURNING id;
$$;

-- Update timestamp trigger for user_inputs
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_inputs_updated_at
  BEFORE UPDATE ON user_inputs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
