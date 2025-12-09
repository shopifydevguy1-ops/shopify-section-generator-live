-- Add device fingerprinting table to prevent trial abuse
-- Run this in your Supabase SQL Editor

-- Device fingerprints table
CREATE TABLE IF NOT EXISTS device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint_hash VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_hash ON device_fingerprints(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user_id ON device_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_ip ON device_fingerprints(ip_address, created_at);

-- Add device_fingerprint_id to users table for quick lookup
ALTER TABLE users ADD COLUMN IF NOT EXISTS device_fingerprint_id UUID REFERENCES device_fingerprints(id) ON DELETE SET NULL;

-- Create index for user device lookup
CREATE INDEX IF NOT EXISTS idx_users_device_fingerprint ON users(device_fingerprint_id);

