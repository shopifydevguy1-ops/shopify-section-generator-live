// Database utilities
// This file contains database schema and helper functions
// For production, you'll need to set up a PostgreSQL database

export interface User {
  id: string
  clerk_id: string
  email: string
  plan: 'free' | 'pro'
  created_at: Date
  updated_at: Date
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_start: Date
  current_period_end: Date
  created_at: Date
  updated_at: Date
}

export interface UsageLog {
  id: string
  user_id: string
  section_type: string
  generated_at: Date
  month: number
  year: number
}

export interface SectionTemplate {
  id: string
  name: string
  description: string
  tags: string[]
  type: string
  liquid_code: string
  variables: Record<string, any>
  created_at: Date
}

// Database schema SQL (to be run in your PostgreSQL database)
export const databaseSchema = `
-- Users table (extends Clerk user data)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
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
  year INTEGER NOT NULL
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
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_month_year ON usage_logs(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_section_templates_type ON section_templates(type);
CREATE INDEX IF NOT EXISTS idx_section_templates_tags ON section_templates USING GIN(tags);
`;

// Helper functions (these would connect to your actual database)
// For now, we'll use a simple in-memory store for development
// In production, replace with actual database queries

let users: Map<string, User> = new Map()
let subscriptions: Map<string, Subscription> = new Map()
let usageLogs: UsageLog[] = []

export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  // In production, query your database
  // SELECT * FROM users WHERE clerk_id = $1
  for (const user of users.values()) {
    if (user.clerk_id === clerkId) return user
  }
  return null
}

export async function createUser(clerkId: string, email: string): Promise<User> {
  const user: User = {
    id: crypto.randomUUID(),
    clerk_id: clerkId,
    email,
    plan: 'free',
    created_at: new Date(),
    updated_at: new Date(),
  }
  users.set(user.id, user)
  return user
}

export async function getUserUsageCount(userId: string, month: number, year: number): Promise<number> {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()
  
  return usageLogs.filter(
    log => log.user_id === userId && 
    log.month === currentMonth && 
    log.year === currentYear
  ).length
}

export async function logUsage(userId: string, sectionType: string): Promise<void> {
  const now = new Date()
  const log: UsageLog = {
    id: crypto.randomUUID(),
    user_id: userId,
    section_type: sectionType,
    generated_at: now,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  }
  usageLogs.push(log)
}

export async function getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
  for (const sub of subscriptions.values()) {
    if (sub.user_id === userId) return sub
  }
  return null
}

export async function updateUserPlan(userId: string, plan: 'free' | 'pro'): Promise<void> {
  const user = Array.from(users.values()).find(u => u.id === userId)
  if (user) {
    user.plan = plan
    user.updated_at = new Date()
    users.set(user.id, user)
  }
}

// Note: In production, replace all these functions with actual database queries
// using a library like pg (PostgreSQL) or your ORM of choice

