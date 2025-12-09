-- Database Schema for Section Generator App
-- Run this in your Supabase SQL Editor

-- Users table (extends Clerk user data)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  plan VARCHAR(20) DEFAULT 'pro' CHECK (plan IN ('free', 'pro', 'expert')),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  paymongo_payment_id VARCHAR(255) UNIQUE,
  paymongo_payment_intent_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage logs table
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  section_type VARCHAR(100) NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  ip_address VARCHAR(45)
);

-- Download logs table (for tracking copy/download actions)
CREATE TABLE IF NOT EXISTS download_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  section_id VARCHAR(255) NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('copy', 'download')),
  created_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45)
);

-- Login logs table
CREATE TABLE IF NOT EXISTS login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clerk_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Section templates table (optional - can also load from JSON files)
CREATE TABLE IF NOT EXISTS section_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tags TEXT[],
  type VARCHAR(100) NOT NULL,
  liquid_code TEXT NOT NULL,
  variables JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paymongo_payment_id ON subscriptions(paymongo_payment_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paymongo_payment_intent_id ON subscriptions(paymongo_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_month_year ON usage_logs(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_download_logs_user_id ON download_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_user_created ON download_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_download_logs_ip_address ON download_logs(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_clerk_id ON login_logs(clerk_id);
CREATE INDEX IF NOT EXISTS idx_section_templates_type ON section_templates(type);
CREATE INDEX IF NOT EXISTS idx_section_templates_tags ON section_templates USING GIN(tags);

