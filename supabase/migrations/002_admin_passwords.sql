-- Admin Passwords Table
-- Simple password storage for admin access

CREATE TABLE IF NOT EXISTS admin_passwords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE admin_passwords ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (no anon access)
-- This is the default - no policies means no anon access
