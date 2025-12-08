-- =============================================
-- MECHA OLDAL - SUPABASE DATABASE SCHEMA
-- =============================================
-- Run this in your Supabase SQL Editor

-- 1. CUSTOMERS TABLE
-- Stores customer IDs and their calculation status
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  has_calculated BOOLEAN DEFAULT FALSE,
  last_access TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 2. SAVED INPUTS TABLE
-- Auto-saves user input values every 2 seconds
CREATE TABLE IF NOT EXISTS saved_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  input_a NUMERIC DEFAULT 0,
  input_b NUMERIC DEFAULT 0,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id)
);

ALTER TABLE saved_inputs ENABLE ROW LEVEL SECURITY;

-- 3. RESULTS TABLE
-- Stores calculated results
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  result_c NUMERIC,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id)
);

ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- 4. CONFIG TABLE
-- Stores equations configuration
CREATE TABLE IF NOT EXISTS config (
  id SERIAL PRIMARY KEY,
  equation_name TEXT NOT NULL,
  equation_formula TEXT NOT NULL,
  description TEXT
);

-- Insert default equation
INSERT INTO config (equation_name, equation_formula, description) 
VALUES ('sum', 'A + B', 'Adds two values together')
ON CONFLICT DO NOTHING;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Allow anonymous users to check if their ID exists
CREATE POLICY "Allow ID verification" ON customers
  FOR SELECT USING (true);

-- Allow updating has_calculated flag
CREATE POLICY "Allow calculate update" ON customers
  FOR UPDATE USING (true);

-- Allow saving inputs (insert and update)
CREATE POLICY "Allow insert inputs" ON saved_inputs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select inputs" ON saved_inputs
  FOR SELECT USING (true);

CREATE POLICY "Allow update inputs" ON saved_inputs
  FOR UPDATE USING (true);

-- Allow storing and viewing results
CREATE POLICY "Allow insert results" ON results
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select results" ON results
  FOR SELECT USING (true);

-- Allow reading config
CREATE POLICY "Allow read config" ON config
  FOR SELECT USING (true);

-- =============================================
-- HELPER FUNCTION: Generate Customer ID
-- =============================================

CREATE OR REPLACE FUNCTION generate_customer_id(customer_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO customers (name) VALUES (customer_name) RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

-- =============================================
-- USAGE EXAMPLES
-- =============================================
-- Generate a new customer ID:
-- SELECT generate_customer_id('John Doe');
--
-- Check if ID exists and hasn't calculated:
-- SELECT id, has_calculated FROM customers WHERE id = 'your-uuid-here';
