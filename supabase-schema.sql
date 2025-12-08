-- Mecha Oldal - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers table (stores approved customer IDs)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  has_calculated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Input values table (for autosave)
CREATE TABLE IF NOT EXISTS input_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  values JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, task_id)
);

-- Calculation results table
CREATE TABLE IF NOT EXISTS calculation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  inputs JSONB NOT NULL DEFAULT '{}',
  results JSONB NOT NULL DEFAULT '{}',
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_id ON customers(id);
CREATE INDEX IF NOT EXISTS idx_input_values_customer ON input_values(customer_id, task_id);
CREATE INDEX IF NOT EXISTS idx_results_customer ON calculation_results(customer_id, task_id);

-- Row Level Security (RLS) Policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE input_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculation_results ENABLE ROW LEVEL SECURITY;

-- Allow public read for customer validation
CREATE POLICY "Public can validate customer IDs" ON customers
  FOR SELECT USING (true);

-- Allow insert/update for input values
CREATE POLICY "Anyone can manage input values" ON input_values
  FOR ALL USING (true);

-- Allow insert/select for calculation results
CREATE POLICY "Anyone can manage calculation results" ON calculation_results
  FOR ALL USING (true);

-- Allow update on customers (for has_calculated flag)
CREATE POLICY "Anyone can update customers" ON customers
  FOR UPDATE USING (true);

-- Function to generate new customer ID
CREATE OR REPLACE FUNCTION generate_customer_id(customer_name TEXT)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO customers (name)
  VALUES (customer_name)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing (optional)
-- INSERT INTO customers (id, name) VALUES 
--   ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Test User 1'),
--   ('b2c3d4e5-f6a7-8901-bcde-12345678901a', 'Test User 2');

-- View all customers (admin query)
-- SELECT id, name, has_calculated, created_at FROM customers;
