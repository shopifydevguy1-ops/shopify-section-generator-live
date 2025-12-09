// Database utilities
// This file contains database schema and helper functions
// For production, you'll need to set up a PostgreSQL database

import { queryDb } from './db-connection'

export interface User {
  id: string
  clerk_id: string
  email: string
  plan: 'free' | 'pro' | 'expert'
  is_admin: boolean
  created_at: Date
  updated_at: Date
}

export interface Subscription {
  id: string
  user_id: string
  paymongo_payment_id: string | null
  paymongo_payment_intent_id: string | null
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
  ip_address?: string
}

export interface DownloadLog {
  id: string
  user_id: string
  section_id: string
  action: 'copy' | 'download'
  created_at: Date
  ip_address?: string
}

export interface LoginLog {
  id: string
  user_id: string
  clerk_id: string
  email: string
  ip_address?: string
  created_at: Date
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
`;

// Helper functions (these would connect to your actual database)
// For now, we'll use a simple in-memory store for development
// In production, replace with actual database queries

let users: Map<string, User> = new Map()
let subscriptions: Map<string, Subscription> = new Map()
let usageLogs: UsageLog[] = []
let downloadLogs: DownloadLog[] = []
let loginLogs: LoginLog[] = []

// Load existing logs from database on startup (if database is available)
// This ensures data persists across server restarts
async function loadLogsFromDatabase() {
  try {
    // Load download logs
    const downloadLogsResult = await queryDb(
      `SELECT id, user_id, section_id, action, created_at, ip_address 
       FROM download_logs 
       ORDER BY created_at DESC 
       LIMIT 10000`
    )
    
    if (downloadLogsResult && downloadLogsResult.rows) {
      downloadLogs = downloadLogsResult.rows.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        section_id: row.section_id,
        action: row.action,
        created_at: new Date(row.created_at),
        ip_address: row.ip_address || undefined,
      }))
      console.log(`[DB] Loaded ${downloadLogs.length} download logs from database`)
    }
    
    // Load usage logs
    const usageLogsResult = await queryDb(
      `SELECT id, user_id, section_type, generated_at, month, year, ip_address 
       FROM usage_logs 
       ORDER BY generated_at DESC 
       LIMIT 10000`
    )
    
    if (usageLogsResult && usageLogsResult.rows) {
      usageLogs = usageLogsResult.rows.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        section_type: row.section_type,
        generated_at: new Date(row.generated_at),
        month: row.month,
        year: row.year,
        ip_address: row.ip_address || undefined,
      }))
      console.log(`[DB] Loaded ${usageLogs.length} usage logs from database`)
    }
  } catch (error: any) {
    console.error('[DB] Error loading logs from database:', error.message)
  }
}

// Initialize database connection and load existing data
if (typeof window === 'undefined') {
  // Only run on server side
  loadLogsFromDatabase().catch(err => {
    console.error('[DB] Failed to load logs from database:', err)
  })
}

// Support requests store
export interface SupportReply {
  id: string
  support_request_id: string
  message: string
  from_admin: boolean
  created_at: Date
  admin_email?: string
}

export interface SupportRequest {
  id: string
  user_id: string
  clerk_id: string
  email: string
  subject: string
  message: string
  created_at: Date
  status: 'open' | 'closed' | 'in_progress'
  replies?: SupportReply[]
}

let supportRequests: SupportRequest[] = []

export function getAllSupportRequests(): SupportRequest[] {
  return [...supportRequests]
}

export function addSupportRequest(request: SupportRequest): void {
  supportRequests.push({ ...request, replies: [] })
}

export function getSupportRequestById(requestId: string): SupportRequest | null {
  return supportRequests.find(r => r.id === requestId) || null
}

export function getSupportRequestsByUserId(userId: string): SupportRequest[] {
  return supportRequests.filter(r => r.user_id === userId)
}

export function addSupportReply(reply: SupportReply): void {
  const request = supportRequests.find(r => r.id === reply.support_request_id)
  if (request) {
    if (!request.replies) {
      request.replies = []
    }
    request.replies.push(reply)
    // Update status if admin replied
    if (reply.from_admin && request.status === 'open') {
      request.status = 'in_progress'
    }
  }
}

export function updateSupportRequestStatus(requestId: string, status: 'open' | 'closed' | 'in_progress'): void {
  const request = supportRequests.find(r => r.id === requestId)
  if (request) {
    request.status = status
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  // Try to get from database first
  const dbResult = await queryDb(
    `SELECT id, clerk_id, email, plan, is_admin, created_at, updated_at 
     FROM users 
     WHERE id = $1 
     LIMIT 1`,
    [userId]
  )
  
  if (dbResult && dbResult.rows && dbResult.rows.length > 0) {
    const row = dbResult.rows[0]
    const user: User = {
      id: row.id,
      clerk_id: row.clerk_id,
      email: row.email,
      plan: row.plan,
      is_admin: row.is_admin,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    }
    
    // Update in-memory cache
    users.set(user.id, user)
    return user
  }
  
  // Fallback to in-memory
  return users.get(userId) || null
}

export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  // Try to get from database first
  const dbResult = await queryDb(
    `SELECT id, clerk_id, email, plan, is_admin, created_at, updated_at 
     FROM users 
     WHERE clerk_id = $1 
     LIMIT 1`,
    [clerkId]
  )
  
  if (dbResult && dbResult.rows && dbResult.rows.length > 0) {
    const row = dbResult.rows[0]
    const user: User = {
      id: row.id,
      clerk_id: row.clerk_id,
      email: row.email,
      plan: row.plan,
      is_admin: row.is_admin,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    }
    
    // Check if user should be admin based on current ADMIN_EMAILS
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
    if (adminEmails.includes(user.email.toLowerCase()) && !user.is_admin) {
      // Update user to admin and expert plan if email is in admin list
      user.is_admin = true
      user.plan = 'expert'
      user.updated_at = new Date()
      // Update in database
      await queryDb(
        `UPDATE users SET is_admin = $1, plan = $2, updated_at = $3 WHERE id = $4`,
        [true, 'expert', user.updated_at, user.id]
      )
    }
    // If user is admin but not on expert plan, upgrade them
    if (user.is_admin && user.plan !== 'expert') {
      user.plan = 'expert'
      user.updated_at = new Date()
      // Update in database
      await queryDb(
        `UPDATE users SET plan = $1, updated_at = $2 WHERE id = $3`,
        ['expert', user.updated_at, user.id]
      )
    }
    
    // Update in-memory cache
    users.set(user.id, user)
    return user
  }
  
  // Fallback to in-memory
  for (const user of users.values()) {
    if (user.clerk_id === clerkId) {
      // Check if user should be admin based on current ADMIN_EMAILS
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
      if (adminEmails.includes(user.email.toLowerCase()) && !user.is_admin) {
        // Update user to admin and expert plan if email is in admin list
        user.is_admin = true
        user.plan = 'expert' // Admins get expert plan automatically
        user.updated_at = new Date()
        users.set(user.id, user)
      }
      // If user is admin but not on expert plan, upgrade them
      if (user.is_admin && user.plan !== 'expert') {
        user.plan = 'expert'
        user.updated_at = new Date()
        users.set(user.id, user)
      }
      return user
    }
  }
  return null
}

export async function createUser(clerkId: string, email: string, isAdmin?: boolean): Promise<User> {
  // Check if email is in admin list from environment variable
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
  const shouldBeAdmin = isAdmin !== undefined 
    ? isAdmin 
    : adminEmails.includes(email.toLowerCase())
  
  // Admins automatically get expert plan with unlimited generations
  // New users get PRO plan by default (with first month trial)
  const userId = crypto.randomUUID()
  const now = new Date()
  
  const user: User = {
    id: userId,
    clerk_id: clerkId,
    email,
    plan: shouldBeAdmin ? 'expert' : 'pro',
    is_admin: shouldBeAdmin,
    created_at: now,
    updated_at: now,
  }
  
  // Try to save to database first
  const dbResult = await queryDb(
    `INSERT INTO users (id, clerk_id, email, plan, is_admin, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (clerk_id) DO UPDATE SET
       email = EXCLUDED.email,
       updated_at = EXCLUDED.updated_at
     RETURNING id`,
    [userId, clerkId, email, user.plan, user.is_admin, now, now]
  )
  
  if (dbResult) {
    console.log(`[createUser] Saved to database: user ${userId}, clerkId: ${clerkId}, email: ${email}`)
    // If database returned a different ID (from ON CONFLICT), use that
    if (dbResult.rows && dbResult.rows.length > 0) {
      user.id = dbResult.rows[0].id
    }
  } else {
    console.log(`[createUser] Saved to memory only: user ${userId}, clerkId: ${clerkId}, email: ${email}`)
  }
  
  // Always keep in-memory for backward compatibility
  users.set(user.id, user)
  return user
}

export async function getAllUsers(): Promise<User[]> {
  // Try to get from database first
  const dbResult = await queryDb(
    `SELECT id, clerk_id, email, plan, is_admin, created_at, updated_at 
     FROM users 
     ORDER BY created_at DESC`
  )
  
  if (dbResult && dbResult.rows && dbResult.rows.length > 0) {
    const dbUsers = dbResult.rows.map((row: any) => ({
      id: row.id,
      clerk_id: row.clerk_id,
      email: row.email,
      plan: row.plan,
      is_admin: row.is_admin,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    }))
    
    // Update in-memory cache
    dbUsers.forEach(user => {
      users.set(user.id, user)
    })
    
    console.log(`[getAllUsers] Loaded ${dbUsers.length} users from database`)
    return dbUsers
  }
  
  // Fallback to in-memory
  console.log(`[getAllUsers] Using in-memory fallback: ${users.size} users`)
  return Array.from(users.values())
}

export async function getAllSubscriptions(): Promise<Subscription[]> {
  // Try to get from database first
  const dbResult = await queryDb(
    `SELECT id, user_id, paymongo_payment_id, paymongo_payment_intent_id, status, 
            current_period_start, current_period_end, created_at, updated_at 
     FROM subscriptions 
     ORDER BY created_at DESC`
  )
  
  if (dbResult && dbResult.rows && dbResult.rows.length > 0) {
    const dbSubscriptions = dbResult.rows.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      paymongo_payment_id: row.paymongo_payment_id,
      paymongo_payment_intent_id: row.paymongo_payment_intent_id,
      status: row.status,
      current_period_start: new Date(row.current_period_start),
      current_period_end: new Date(row.current_period_end),
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    }))
    
    // Update in-memory cache
    dbSubscriptions.forEach(sub => {
      subscriptions.set(sub.id, sub)
    })
    
    console.log(`[getAllSubscriptions] Loaded ${dbSubscriptions.length} subscriptions from database`)
    return dbSubscriptions
  }
  
  // Fallback to in-memory
  console.log(`[getAllSubscriptions] Using in-memory fallback: ${subscriptions.size} subscriptions`)
  return Array.from(subscriptions.values())
}

export async function getAllUsageLogs(): Promise<UsageLog[]> {
  // Try to get from database first
  const dbResult = await queryDb(
    `SELECT id, user_id, section_type, generated_at, month, year, ip_address 
     FROM usage_logs 
     ORDER BY generated_at DESC`
  )
  
  if (dbResult && dbResult.rows && dbResult.rows.length > 0) {
    // Merge database logs with in-memory logs (avoid duplicates)
    const dbLogs = dbResult.rows.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      section_type: row.section_type,
      generated_at: new Date(row.generated_at),
      month: row.month,
      year: row.year,
      ip_address: row.ip_address || undefined,
    }))
    
    // Merge with in-memory logs, avoiding duplicates
    const memoryLogIds = new Set(usageLogs.map(log => log.id))
    const uniqueDbLogs = dbLogs.filter(log => !memoryLogIds.has(log.id))
    return [...usageLogs, ...uniqueDbLogs]
  }
  
  return usageLogs
}

export async function getAllLoginLogs(): Promise<LoginLog[]> {
  return loginLogs
}

export async function getAllDownloadLogs(): Promise<DownloadLog[]> {
  // Try to get from database first
  const dbResult = await queryDb(
    `SELECT id, user_id, section_id, action, created_at, ip_address 
     FROM download_logs 
     ORDER BY created_at DESC`
  )
  
  if (dbResult && dbResult.rows && dbResult.rows.length > 0) {
    // Merge database logs with in-memory logs (avoid duplicates)
    const dbLogs = dbResult.rows.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      section_id: row.section_id,
      action: row.action,
      created_at: new Date(row.created_at),
      ip_address: row.ip_address || undefined,
    }))
    
    // Merge with in-memory logs, avoiding duplicates
    const memoryLogIds = new Set(downloadLogs.map(log => log.id))
    const uniqueDbLogs = dbLogs.filter(log => !memoryLogIds.has(log.id))
    return [...downloadLogs, ...uniqueDbLogs]
  }
  
  return downloadLogs
}

export async function logLogin(userId: string, clerkId: string, email: string, ipAddress?: string): Promise<void> {
  const now = new Date()
  const logId = crypto.randomUUID()
  
  const log: LoginLog = {
    id: logId,
    user_id: userId,
    clerk_id: clerkId,
    email,
    ip_address: ipAddress,
    created_at: now,
  }
  
  // Try to save to database first
  const dbResult = await queryDb(
    `INSERT INTO login_logs (id, user_id, clerk_id, email, ip_address, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [logId, userId, clerkId, email, ipAddress || null, now]
  )
  
  // Always keep in-memory for backward compatibility
  loginLogs.push(log)
  // Keep only last 1000 login logs to prevent memory issues
  if (loginLogs.length > 1000) {
    loginLogs = loginLogs.slice(-1000)
  }
  
  if (dbResult) {
    console.log(`[logLogin] Saved to database: user ${email}`)
  } else {
    console.log(`[logLogin] Saved to memory only: user ${email}, total logs: ${loginLogs.length}`)
  }
}

export async function getUserStats(): Promise<{
  totalUsers: number
  freeUsers: number
  proUsers: number
  expertUsers: number
  totalSubscriptions: number
  activeSubscriptions: number
  totalGenerations: number
  generationsThisMonth: number
}> {
  const allUsers = await getAllUsers()
  const allSubscriptions = await getAllSubscriptions()
  const allLogs = await getAllUsageLogs()
  
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  
  return {
    totalUsers: allUsers.length,
    freeUsers: allUsers.filter(u => u.plan === 'free').length, // Legacy users only
    proUsers: allUsers.filter(u => u.plan === 'pro').length,
    expertUsers: allUsers.filter(u => u.plan === 'expert').length,
    totalSubscriptions: allSubscriptions.length,
    activeSubscriptions: allSubscriptions.filter(s => s.status === 'active').length,
    totalGenerations: allLogs.length,
    generationsThisMonth: allLogs.filter(log => 
      log.month === currentMonth && log.year === currentYear
    ).length,
  }
}

export async function getUserUsageCount(userId: string, month: number, year: number, ipAddress?: string): Promise<number> {
  // Only count downloads/copies - generation/search is unlimited
  
  // Try to get from database first
  // PostgreSQL will automatically cast string UUIDs to UUID type
  const dbResult = await queryDb(
    `SELECT COUNT(*) as count 
     FROM download_logs 
     WHERE user_id = $1 
       AND EXTRACT(MONTH FROM created_at) = $2 
       AND EXTRACT(YEAR FROM created_at) = $3`,
    [userId, month, year]
  )
  
  if (dbResult && dbResult.rows && dbResult.rows.length > 0) {
    const countValue = dbResult.rows[0].count
    const dbCount = typeof countValue === 'string' ? parseInt(countValue, 10) : Number(countValue)
    console.log(`[getUserUsageCount] From database: user ${userId}, month ${month}/${year}, count: ${dbCount}`)
    return isNaN(dbCount) ? 0 : dbCount
  }
  
  // Log if query returned but no rows (shouldn't happen, but good to know)
  if (dbResult && (!dbResult.rows || dbResult.rows.length === 0)) {
    console.warn(`[getUserUsageCount] Query returned but no rows for user ${userId}, month ${month}/${year}`)
  } else if (!dbResult) {
    console.warn(`[getUserUsageCount] Database query returned null for user ${userId}, month ${month}/${year} - using memory fallback`)
  }
  
  // Fallback to in-memory
  const downloadCopyCount = downloadLogs.filter(
    log => {
      const logDate = new Date(log.created_at)
      return log.user_id === userId && 
        logDate.getMonth() + 1 === month && 
        logDate.getFullYear() === year
    }
  ).length
  
  console.log(`[getUserUsageCount] From memory: user ${userId}, month ${month}/${year}, count: ${downloadCopyCount}`)
  return downloadCopyCount
}

// Get usage count by IP address (to prevent multiple account abuse)
export async function getIPUsageCount(ipAddress: string, month: number, year: number): Promise<number> {
  if (!ipAddress) return 0
  
  // Only count downloads/copies - generation/search is unlimited
  
  // Try to get from database first
  const dbResult = await queryDb(
    `SELECT COUNT(*) as count 
     FROM download_logs 
     WHERE ip_address = $1 
       AND EXTRACT(MONTH FROM created_at) = $2 
       AND EXTRACT(YEAR FROM created_at) = $3`,
    [ipAddress, month, year]
  )
  
  if (dbResult && dbResult.rows && dbResult.rows.length > 0) {
    const dbCount = parseInt((dbResult.rows[0] as any).count, 10)
    console.log(`[getIPUsageCount] From database: IP ${ipAddress}, month ${month}/${year}, count: ${dbCount}`)
    return dbCount
  }
  
  // Fallback to in-memory
  const downloadCopyCount = downloadLogs.filter(
    log => {
      const logDate = new Date(log.created_at)
      return log.ip_address === ipAddress && 
        logDate.getMonth() + 1 === month && 
        logDate.getFullYear() === year
    }
  ).length
  
  console.log(`[getIPUsageCount] From memory: IP ${ipAddress}, month ${month}/${year}, count: ${downloadCopyCount}`)
  return downloadCopyCount
}

export async function logUsage(userId: string, sectionType: string, ipAddress?: string): Promise<void> {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const logId = crypto.randomUUID()
  
  const log: UsageLog = {
    id: logId,
    user_id: userId,
    section_type: sectionType,
    generated_at: now,
    month,
    year,
    ip_address: ipAddress,
  }
  
  // Try to save to database first
  // PostgreSQL will automatically cast string UUIDs to UUID type
  try {
    // First verify database connection
    const { getDbPool } = await import('./db-connection')
    const dbPool = getDbPool()
    if (!dbPool) {
      console.error(`[logUsage] ❌ No database pool available!`)
      throw new Error('Database pool not available')
    }
    
    const dbResult = await queryDb(
      `INSERT INTO usage_logs (id, user_id, section_type, generated_at, month, year, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [logId, userId, sectionType, now, month, year, ipAddress || null]
    )
    
    if (dbResult) {
      if (dbResult.rowCount && dbResult.rowCount > 0) {
        console.log(`[logUsage] ✅ Saved to database: user ${userId}, sectionType: ${sectionType}, ip: ${ipAddress || 'unknown'}, rowCount: ${dbResult.rowCount}`)
      } else {
        console.warn(`[logUsage] ⚠️ Insert returned 0 rows (possibly duplicate): user ${userId}, sectionType: ${sectionType}`)
      }
    } else {
      console.error(`[logUsage] ❌ Database query returned null: user ${userId}, sectionType: ${sectionType}`)
      console.error(`[logUsage] UserId: ${userId}, LogId: ${logId}`)
      throw new Error('Database insert returned null')
    }
  } catch (error: any) {
    console.error(`[logUsage] ❌ Database insert error: ${error.message}`, error)
    console.error(`[logUsage] Error stack: ${error.stack}`)
    console.error(`[logUsage] Error details: user ${userId}, sectionType: ${sectionType}`)
    // Re-throw to let caller know it failed
    throw error
  }
  
  // Always keep in-memory for backward compatibility and as fallback
  usageLogs.push(log)
  
  // Verify the insert by querying back
  try {
    const verifyResult = await queryDb(
      `SELECT COUNT(*) as count FROM usage_logs WHERE user_id = $1 AND section_type = $2 AND month = $3 AND year = $4`,
      [userId, sectionType, month, year]
    )
    if (verifyResult && verifyResult.rows && verifyResult.rows.length > 0) {
      const count = parseInt(verifyResult.rows[0].count, 10) || 0
      console.log(`[logUsage] Verification: Found ${count} record(s) for user ${userId}, sectionType: ${sectionType}, month: ${month}, year: ${year}`)
    }
  } catch (error: any) {
    console.error(`[logUsage] Verification query failed: ${error.message}`)
  }
}

export async function getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
  // Try to get from database first
  const dbResult = await queryDb(
    `SELECT id, user_id, paymongo_payment_id, paymongo_payment_intent_id, status, 
            current_period_start, current_period_end, created_at, updated_at 
     FROM subscriptions 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [userId]
  )
  
  if (dbResult && dbResult.rows && dbResult.rows.length > 0) {
    const row = dbResult.rows[0]
    const subscription: Subscription = {
      id: row.id,
      user_id: row.user_id,
      paymongo_payment_id: row.paymongo_payment_id,
      paymongo_payment_intent_id: row.paymongo_payment_intent_id,
      status: row.status,
      current_period_start: new Date(row.current_period_start),
      current_period_end: new Date(row.current_period_end),
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    }
    
    // Update in-memory cache
    subscriptions.set(subscription.id, subscription)
    return subscription
  }
  
  // Fallback to in-memory
  for (const sub of subscriptions.values()) {
    if (sub.user_id === userId) return sub
  }
  return null
}

export async function updateUserPlan(userId: string, plan: 'free' | 'pro' | 'expert'): Promise<void> {
  const user = users.get(userId) || Array.from(users.values()).find(u => u.id === userId)
  if (user) {
    user.plan = plan
    user.updated_at = new Date()
    
    // Update in database
    await queryDb(
      `UPDATE users SET plan = $1, updated_at = $2 WHERE id = $3`,
      [plan, user.updated_at, userId]
    )
    
    users.set(user.id, user)
  } else {
    throw new Error(`User with ID ${userId} not found for plan update`)
  }
}

export async function updateUserEmail(userId: string, email: string): Promise<void> {
  const user = Array.from(users.values()).find(u => u.id === userId)
  if (user) {
    user.email = email
    user.updated_at = new Date()
    users.set(user.id, user)
  }
}

export async function updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<void> {
  const user = users.get(userId) || Array.from(users.values()).find(u => u.id === userId)
  if (user) {
    user.is_admin = isAdmin
    // Admins automatically get expert plan
    // Note: We don't change plan when removing admin status - let the plan update handle that
    if (isAdmin) {
      user.plan = 'expert'
    }
    user.updated_at = new Date()
    users.set(user.id, user)
  } else {
    throw new Error(`User with ID ${userId} not found for admin status update`)
  }
}

export async function createOrUpdateSubscription(params: {
  userId: string
  paymongoPaymentId?: string | null
  paymongoPaymentIntentId?: string | null
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  currentPeriodStart: Date
  currentPeriodEnd: Date
}): Promise<Subscription> {
  const existing = await getSubscriptionByUserId(params.userId)
  const now = new Date()
  
  if (existing) {
    // Update existing subscription
    existing.paymongo_payment_id = params.paymongoPaymentId || existing.paymongo_payment_id
    existing.paymongo_payment_intent_id = params.paymongoPaymentIntentId || existing.paymongo_payment_intent_id
    existing.status = params.status
    existing.current_period_start = params.currentPeriodStart
    existing.current_period_end = params.currentPeriodEnd
    existing.updated_at = now
    
    // Update in database
    await queryDb(
      `UPDATE subscriptions 
       SET paymongo_payment_id = $1, 
           paymongo_payment_intent_id = $2, 
           status = $3, 
           current_period_start = $4, 
           current_period_end = $5, 
           updated_at = $6 
       WHERE id = $7`,
      [
        existing.paymongo_payment_id,
        existing.paymongo_payment_intent_id,
        existing.status,
        existing.current_period_start,
        existing.current_period_end,
        existing.updated_at,
        existing.id
      ]
    )
    
    subscriptions.set(existing.id, existing)
    return existing
  } else {
    // Create new subscription
    const subscription: Subscription = {
      id: crypto.randomUUID(),
      user_id: params.userId,
      paymongo_payment_id: params.paymongoPaymentId || null,
      paymongo_payment_intent_id: params.paymongoPaymentIntentId || null,
      status: params.status,
      current_period_start: params.currentPeriodStart,
      current_period_end: params.currentPeriodEnd,
      created_at: now,
      updated_at: now,
    }
    
    // Save to database
    await queryDb(
      `INSERT INTO subscriptions (id, user_id, paymongo_payment_id, paymongo_payment_intent_id, status, current_period_start, current_period_end, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        subscription.id,
        subscription.user_id,
        subscription.paymongo_payment_id,
        subscription.paymongo_payment_intent_id,
        subscription.status,
        subscription.current_period_start,
        subscription.current_period_end,
        subscription.created_at,
        subscription.updated_at
      ]
    )
    
    subscriptions.set(subscription.id, subscription)
    return subscription
  }
}

export async function getDownloadCount(userId: string): Promise<number> {
  return downloadLogs.filter(log => log.user_id === userId).length
}

export async function getUserActivityStats(userId: string): Promise<{
  generations: number
  copies: number
  downloads: number
  total: number
}> {
  // Check if database is available
  const { getDbPool } = await import('./db-connection')
  const dbPool = getDbPool()
  const useDatabase = dbPool !== null
  
  // Try to get from database first if available
  // PostgreSQL will automatically cast string UUIDs to UUID type
  const [generationsResult, copiesResult, downloadsResult] = await Promise.all([
    queryDb(
      `SELECT COUNT(*)::bigint as count 
       FROM usage_logs 
       WHERE user_id = $1 
         AND section_type NOT IN ('copy', 'download')`,
      [userId]
    ),
    queryDb(
      `SELECT COUNT(*)::bigint as count 
       FROM download_logs 
       WHERE user_id = $1 AND action = 'copy'`,
      [userId]
    ),
    queryDb(
      `SELECT COUNT(*)::bigint as count 
       FROM download_logs 
       WHERE user_id = $1 AND action = 'download'`,
      [userId]
    )
  ])
  
  let generations = 0
  let copies = 0
  let downloads = 0
  
  // If database is available, we MUST use database results (don't fall back to memory)
  // Only use in-memory fallback if database is not available
  if (useDatabase) {
    // Database is available - use database results only
    if (generationsResult && generationsResult.rows && generationsResult.rows.length > 0) {
      const count = generationsResult.rows[0].count
      generations = typeof count === 'string' ? parseInt(count, 10) : Number(count)
    }
    
    if (copiesResult && copiesResult.rows && copiesResult.rows.length > 0) {
      const count = copiesResult.rows[0].count
      copies = typeof count === 'string' ? parseInt(count, 10) : Number(count)
    }
    
    if (downloadsResult && downloadsResult.rows && downloadsResult.rows.length > 0) {
      const count = downloadsResult.rows[0].count
      downloads = typeof count === 'string' ? parseInt(count, 10) : Number(count)
    }
    
    // Log detailed information about query results
    if (!generationsResult || !copiesResult || !downloadsResult) {
      console.error(`[getUserActivityStats] Database queries failed for user ${userId} but database is available!`, {
        generationsResult: !!generationsResult,
        copiesResult: !!copiesResult,
        downloadsResult: !!downloadsResult,
        userId: userId,
        userIdType: typeof userId
      })
    } else {
      // Log successful query results for debugging
      console.log(`[getUserActivityStats] Query results for user ${userId}:`, {
        generations: generationsResult.rows?.[0]?.count || 0,
        copies: copiesResult.rows?.[0]?.count || 0,
        downloads: downloadsResult.rows?.[0]?.count || 0
      })
    }
  } else {
    // Database not available - use in-memory fallback
    generations = usageLogs.filter(
      log => log.user_id === userId && log.section_type !== 'copy' && log.section_type !== 'download'
    ).length
    
    copies = downloadLogs.filter(log => log.user_id === userId && log.action === 'copy').length
    
    downloads = downloadLogs.filter(log => log.user_id === userId && log.action === 'download').length
  }
  
  // Enhanced debug logging
  console.log(`[getUserActivityStats] User ${userId}:`, {
    generations,
    copies,
    downloads,
    total: generations + copies + downloads,
    source: useDatabase ? 'database' : 'memory',
    dbAvailable: useDatabase,
    queryResults: {
      generations: !!generationsResult,
      copies: !!copiesResult,
      downloads: !!downloadsResult
    },
    rawCounts: {
      generations: generationsResult?.rows?.[0]?.count,
      copies: copiesResult?.rows?.[0]?.count,
      downloads: downloadsResult?.rows?.[0]?.count
    }
  })
  
  return {
    generations,
    copies,
    downloads,
    total: generations + copies + downloads,
  }
}

// Check if user is in their first month (trial period)
export async function isUserInFirstMonth(userId: string): Promise<boolean> {
  // Get user from database
  const dbResult = await queryDb(
    `SELECT created_at FROM users WHERE id = $1`,
    [userId]
  )
  
  let createdAt: Date | null = null
  
  if (dbResult && dbResult.rows && dbResult.rows.length > 0) {
    createdAt = new Date(dbResult.rows[0].created_at)
  } else {
    // Fallback to in-memory user data
    const user = users.get(userId) || Array.from(users.values()).find(u => u.id === userId)
    if (user) {
      createdAt = user.created_at
    }
  }
  
  if (!createdAt) {
    console.log(`[isUserInFirstMonth] User ${userId} not found, returning false`)
    return false
  }
  
  const now = new Date()
  // Calculate one month ago more accurately (30 days)
  const oneMonthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
  
  // Also ensure createdAt is a valid date
  if (isNaN(createdAt.getTime())) {
    console.error(`[isUserInFirstMonth] Invalid created_at date for user ${userId}`)
    return false
  }
  
  // Safety check: if user was created in the future (timezone issues), treat as just created
  if (createdAt.getTime() > now.getTime()) {
    console.warn(`[isUserInFirstMonth] User ${userId} has future created_at date, treating as just created`)
    return true
  }
  
  // User is in first month if created less than 30 days ago
  const isInFirstMonth = createdAt.getTime() >= oneMonthAgo.getTime()
  const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000))
  
  console.log(`[isUserInFirstMonth] User ${userId}: createdAt=${createdAt.toISOString()}, oneMonthAgo=${oneMonthAgo.toISOString()}, isInFirstMonth=${isInFirstMonth}, daysDiff=${daysDiff}`)
  
  return isInFirstMonth
}

// Get trial expiration information for pro users
export async function getTrialExpirationInfo(userId: string): Promise<{
  isInTrial: boolean
  daysRemaining: number
  trialExpiresAt: Date | null
  copiesUsed: number
  copiesLimit: number
  hasActiveSubscription: boolean
}> {
  const user = await getUserById(userId)
  if (!user) {
    return {
      isInTrial: false,
      daysRemaining: 0,
      trialExpiresAt: null,
      copiesUsed: 0,
      copiesLimit: 0,
      hasActiveSubscription: false
    }
  }

  const inFirstMonth = await isUserInFirstMonth(userId)
  const subscription = await getSubscriptionByUserId(userId)
  const hasActiveSubscription = subscription?.status === 'active'
  
  // If user has active subscription, they're not in trial
  if (hasActiveSubscription) {
    return {
      isInTrial: false,
      daysRemaining: 0,
      trialExpiresAt: null,
      copiesUsed: 0,
      copiesLimit: 0,
      hasActiveSubscription: true
    }
  }

  // Calculate trial expiration
  const now = new Date()
  const createdAt = new Date(user.created_at)
  const trialDuration = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
  const trialExpiresAt = new Date(createdAt.getTime() + trialDuration)
  const daysRemaining = Math.max(0, Math.ceil((trialExpiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
  
  // Get total copies used (not just this month, but all time for trial)
  const allCopiesResult = await queryDb(
    `SELECT COUNT(*) as count 
     FROM download_logs 
     WHERE user_id = $1 AND action = 'copy'`,
    [userId]
  )
  
  const copiesUsed = allCopiesResult && allCopiesResult.rows && allCopiesResult.rows.length > 0
    ? parseInt(allCopiesResult.rows[0].count, 10) || 0
    : 0
  
  const copiesLimit = 20 // Trial limit is 20 copies
  
  return {
    isInTrial: inFirstMonth && !hasActiveSubscription,
    daysRemaining,
    trialExpiresAt: inFirstMonth ? trialExpiresAt : null,
    copiesUsed,
    copiesLimit,
    hasActiveSubscription: false
  }
}

export async function canDownloadOrCopy(userId: string, plan: 'free' | 'pro' | 'expert', isAdmin: boolean, ipAddress?: string): Promise<{ allowed: boolean; count: number; limit: number; reason?: string; trialInfo?: { isInTrial: boolean; daysRemaining: number; copiesUsed: number; copiesLimit: number } }> {
  // Expert users and admins have unlimited downloads
  if (plan === 'expert' || isAdmin) {
    return { allowed: true, count: 0, limit: Infinity }
  }
  
  // Pro users: check if they're in first month trial or have active subscription
  if (plan === 'pro') {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const userCount = await getUserUsageCount(userId, currentMonth, currentYear, ipAddress)
    
    // Check if user is in first month (trial period)
    const inFirstMonth = await isUserInFirstMonth(userId)
    
    // Check if user has active subscription
    const subscription = await getSubscriptionByUserId(userId)
    const hasActiveSubscription = subscription?.status === 'active'
    
    console.log(`[canDownloadOrCopy] User ${userId} (plan: ${plan}): inFirstMonth=${inFirstMonth}, hasActiveSubscription=${hasActiveSubscription}, userCount=${userCount}`)
    
    // If in first month trial, allow 20 downloads/copies total (not per month)
    if (inFirstMonth && !hasActiveSubscription) {
      // Get total copies used (all time, not just this month)
      const allCopiesResult = await queryDb(
        `SELECT COUNT(*) as count 
         FROM download_logs 
         WHERE user_id = $1 AND action = 'copy'`,
        [userId]
      )
      
      const totalCopiesUsed = allCopiesResult && allCopiesResult.rows && allCopiesResult.rows.length > 0
        ? parseInt(allCopiesResult.rows[0].count, 10) || 0
        : 0
      
      const trialLimit = 20
      const trialInfo = await getTrialExpirationInfo(userId)
      
      // Check if trial expired by date
      if (trialInfo.daysRemaining <= 0 && !trialInfo.isInTrial) {
        return { 
          allowed: false, 
          count: totalCopiesUsed, 
          limit: 0, 
          reason: "Your free trial has expired. Please subscribe to Pro to continue using the service. You can still search/browse unlimited sections.",
          trialInfo: {
            isInTrial: false,
            daysRemaining: 0,
            copiesUsed: totalCopiesUsed,
            copiesLimit: trialLimit
          }
        }
      }
      
      // Check if trial expired by copy limit
      if (totalCopiesUsed >= trialLimit) {
        return { 
          allowed: false, 
          count: totalCopiesUsed, 
          limit: trialLimit, 
          reason: `You've used all ${trialLimit} free copies. Subscribe to Pro to continue with 50 copies/downloads per month, or upgrade to Expert for unlimited access.`,
          trialInfo: {
            isInTrial: true,
            daysRemaining: trialInfo.daysRemaining,
            copiesUsed: totalCopiesUsed,
            copiesLimit: trialLimit
          }
        }
      }
      
      return { 
        allowed: true, 
        count: totalCopiesUsed, 
        limit: trialLimit,
        trialInfo: {
          isInTrial: true,
          daysRemaining: trialInfo.daysRemaining,
          copiesUsed: totalCopiesUsed,
          copiesLimit: trialLimit
        }
      }
    }
    
    // After first month, require active subscription
    if (!hasActiveSubscription) {
      return { 
        allowed: false, 
        count: userCount, 
        limit: 0, 
        reason: "Your free trial has ended. Please subscribe to Pro to continue using the service. You can still search/browse unlimited sections." 
      }
    }
    
    // Pro users with active subscription have 50 per month
    const limit = 50
    if (userCount >= limit) {
      return { 
        allowed: false, 
        count: userCount, 
        limit, 
        reason: "You have reached your monthly limit of 50 copies/downloads. You can still search/browse unlimited sections. Upgrade to Expert for unlimited access." 
      }
    }
    
    return { allowed: true, count: userCount, limit }
  }
  
  // Free users have a limit of 5 downloads/copies per month (generation/search is unlimited)
  // Note: This should rarely be used now since new users default to 'pro'
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  
  // Check by user ID (only downloads/copies count)
  const userCount = await getUserUsageCount(userId, currentMonth, currentYear, ipAddress)
  
  // Also check by IP address to prevent multiple account abuse
  let ipCount = 0
  if (ipAddress) {
    ipCount = await getIPUsageCount(ipAddress, currentMonth, currentYear)
  }
  
  // Use the higher count (either by user or by IP)
  const count = Math.max(userCount, ipCount)
  const limit = 5
  
  // If IP limit is reached, provide a reason
  if (ipAddress && ipCount >= limit && ipCount > userCount) {
    return { 
      allowed: false, 
      count, 
      limit, 
      reason: "You have reached the limit from this IP address. Please upgrade to Pro for more access." 
    }
  }
  
  return { allowed: count < limit, count, limit }
}

export async function logDownloadOrCopy(userId: string, sectionId: string, action: 'copy' | 'download', ipAddress?: string): Promise<void> {
  const now = new Date()
  const logId = crypto.randomUUID()
  
  const log: DownloadLog = {
    id: logId,
    user_id: userId,
    section_id: sectionId,
    action,
    created_at: now,
    ip_address: ipAddress,
  }
  
  // Try to save to database first
  // PostgreSQL will automatically cast string UUIDs to UUID type
  try {
    // First verify database connection
    const { getDbPool } = await import('./db-connection')
    const dbPool = getDbPool()
    if (!dbPool) {
      console.error(`[logDownloadOrCopy] ❌ No database pool available!`)
      throw new Error('Database pool not available')
    }
    
    const dbResult = await queryDb(
      `INSERT INTO download_logs (id, user_id, section_id, action, created_at, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [logId, userId, sectionId, action, now, ipAddress || null]
    )
    
    if (dbResult) {
      if (dbResult.rowCount && dbResult.rowCount > 0) {
        console.log(`[logDownloadOrCopy] ✅ Saved to database: ${action} for user ${userId}, sectionId: ${sectionId}, ip: ${ipAddress || 'unknown'}, rowCount: ${dbResult.rowCount}`)
      } else {
        console.warn(`[logDownloadOrCopy] ⚠️ Insert returned 0 rows (possibly duplicate): ${action} for user ${userId}, sectionId: ${sectionId}`)
      }
    } else {
      console.error(`[logDownloadOrCopy] ❌ Database query returned null: ${action} for user ${userId}, sectionId: ${sectionId}`)
      console.error(`[logDownloadOrCopy] UserId: ${userId}, LogId: ${logId}, SectionId: ${sectionId}`)
      throw new Error('Database insert returned null')
    }
  } catch (error: any) {
    console.error(`[logDownloadOrCopy] ❌ Database insert error: ${error.message}`, error)
    console.error(`[logDownloadOrCopy] Error stack: ${error.stack}`)
    console.error(`[logDownloadOrCopy] Error details: ${action} for user ${userId}, sectionId: ${sectionId}`)
    // Re-throw to let caller know it failed
    throw error
  }
  
  // Always keep in-memory for backward compatibility and as fallback
  downloadLogs.push(log)
  
  // Verify the insert by querying back
  try {
    const verifyResult = await queryDb(
      `SELECT COUNT(*) as count FROM download_logs WHERE user_id = $1 AND section_id = $2 AND action = $3`,
      [userId, sectionId, action]
    )
    if (verifyResult && verifyResult.rows && verifyResult.rows.length > 0) {
      const count = parseInt(verifyResult.rows[0].count, 10) || 0
      console.log(`[logDownloadOrCopy] Verification: Found ${count} record(s) for user ${userId}, sectionId: ${sectionId}, action: ${action}`)
    }
  } catch (error: any) {
    console.error(`[logDownloadOrCopy] Verification query failed: ${error.message}`)
  }
}

// Reset user usage limits (admin function)
export async function resetUserUsageLimit(userId: string, month?: number, year?: number): Promise<{ deleted: number }> {
  const now = new Date()
  const targetMonth = month || now.getMonth() + 1
  const targetYear = year || now.getFullYear()
  
  // Delete from database first
  // PostgreSQL will automatically cast string UUIDs to UUID type
  const [usageDeleteResult, downloadDeleteResult] = await Promise.all([
    queryDb(
      `DELETE FROM usage_logs 
       WHERE user_id = $1 
         AND month = $2 
         AND year = $3`,
      [userId, targetMonth, targetYear]
    ),
    queryDb(
      `DELETE FROM download_logs 
       WHERE user_id = $1 
         AND EXTRACT(MONTH FROM created_at) = $2 
         AND EXTRACT(YEAR FROM created_at) = $3`,
      [userId, targetMonth, targetYear]
    )
  ])
  
  // Get deleted counts from database
  const deletedUsage = usageDeleteResult?.rowCount || 0
  const deletedDownloads = downloadDeleteResult?.rowCount || 0
  
  // Also delete from in-memory arrays for consistency
  const initialUsageCount = usageLogs.length
  usageLogs = usageLogs.filter(
    log => !(log.user_id === userId && log.month === targetMonth && log.year === targetYear)
  )
  
  const initialDownloadCount = downloadLogs.length
  downloadLogs = downloadLogs.filter(
    log => {
      const logDate = new Date(log.created_at)
      return !(log.user_id === userId && 
        logDate.getMonth() + 1 === targetMonth && 
        logDate.getFullYear() === targetYear)
    }
  )
  
  const totalDeleted = deletedUsage + deletedDownloads
  console.log(`[resetUserUsageLimit] Reset usage for user ${userId}, month ${targetMonth}/${targetYear}, deleted ${totalDeleted} logs from database (usage: ${deletedUsage}, downloads: ${deletedDownloads})`)
  
  return { deleted: totalDeleted }
}

// Reset IP usage limits (admin function)
export async function resetIPUsageLimit(ipAddress: string, month?: number, year?: number): Promise<{ deleted: number }> {
  if (!ipAddress) {
    return { deleted: 0 }
  }
  
  const now = new Date()
  const targetMonth = month || now.getMonth() + 1
  const targetYear = year || now.getFullYear()
  
  // Delete from database first
  const [usageDeleteResult, downloadDeleteResult] = await Promise.all([
    queryDb(
      `DELETE FROM usage_logs 
       WHERE ip_address = $1 
         AND month = $2 
         AND year = $3`,
      [ipAddress, targetMonth, targetYear]
    ),
    queryDb(
      `DELETE FROM download_logs 
       WHERE ip_address = $1 
         AND EXTRACT(MONTH FROM created_at) = $2 
         AND EXTRACT(YEAR FROM created_at) = $3`,
      [ipAddress, targetMonth, targetYear]
    )
  ])
  
  // Get deleted counts from database
  const deletedUsage = usageDeleteResult?.rowCount || 0
  const deletedDownloads = downloadDeleteResult?.rowCount || 0
  
  // Also delete from in-memory arrays for consistency
  const initialUsageCount = usageLogs.length
  usageLogs = usageLogs.filter(
    log => !(log.ip_address === ipAddress && log.month === targetMonth && log.year === targetYear)
  )
  
  const initialDownloadCount = downloadLogs.length
  downloadLogs = downloadLogs.filter(
    log => {
      const logDate = new Date(log.created_at)
      return !(log.ip_address === ipAddress && 
        logDate.getMonth() + 1 === targetMonth && 
        logDate.getFullYear() === targetYear)
    }
  )
  
  const totalDeleted = deletedUsage + deletedDownloads
  console.log(`[resetIPUsageLimit] Reset usage for IP ${ipAddress}, month ${targetMonth}/${targetYear}, deleted ${totalDeleted} logs from database (usage: ${deletedUsage}, downloads: ${deletedDownloads})`)
  
  return { deleted: totalDeleted }
}

// Get online users (users active in the last 10 minutes)
export async function getOnlineUsers(): Promise<Array<{ user_id: string; email: string; last_activity: Date; activity_type: string }>> {
  const { getDbPool } = await import('./db-connection')
  const dbPool = getDbPool()
  const useDatabase = dbPool !== null
  
  if (!useDatabase) {
    // Fallback: check in-memory logs for last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const recentLogins = loginLogs.filter(log => new Date(log.created_at) > tenMinutesAgo)
    const recentDownloads = downloadLogs.filter(log => new Date(log.created_at) > tenMinutesAgo)
    const recentUsage = usageLogs.filter(log => new Date(log.generated_at) > tenMinutesAgo)
    
    // Combine and deduplicate by user_id
    const userMap = new Map<string, { user_id: string; email: string; last_activity: Date; activity_type: string }>()
    
    recentLogins.forEach(log => {
      const existing = userMap.get(log.user_id)
      if (!existing || new Date(log.created_at) > existing.last_activity) {
        userMap.set(log.user_id, {
          user_id: log.user_id,
          email: log.email,
          last_activity: new Date(log.created_at),
          activity_type: 'login'
        })
      }
    })
    
    recentDownloads.forEach(log => {
      const existing = userMap.get(log.user_id)
      if (!existing || new Date(log.created_at) > existing.last_activity) {
        const user = Array.from(users.values()).find(u => u.id === log.user_id)
        userMap.set(log.user_id, {
          user_id: log.user_id,
          email: user?.email || 'Unknown',
          last_activity: new Date(log.created_at),
          activity_type: log.action
        })
      }
    })
    
    recentUsage.forEach(log => {
      const existing = userMap.get(log.user_id)
      if (!existing || new Date(log.generated_at) > existing.last_activity) {
        const user = Array.from(users.values()).find(u => u.id === log.user_id)
        userMap.set(log.user_id, {
          user_id: log.user_id,
          email: user?.email || 'Unknown',
          last_activity: new Date(log.generated_at),
          activity_type: log.section_type
        })
      }
    })
    
    return Array.from(userMap.values()).sort((a, b) => b.last_activity.getTime() - a.last_activity.getTime())
  }
  
  // Query database for users active in last 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
  
  // Get users from login_logs (most reliable indicator of online status)
  const loginResult = await queryDb(
    `SELECT 
       u.id as user_id,
       u.email,
       MAX(ll.created_at) as last_activity,
       'login' as activity_type
     FROM users u
     INNER JOIN login_logs ll ON u.id = ll.user_id
     WHERE ll.created_at > $1
     GROUP BY u.id, u.email`,
    [tenMinutesAgo]
  )
  
  // Get users from download_logs
  const downloadResult = await queryDb(
    `SELECT 
       u.id as user_id,
       u.email,
       MAX(dl.created_at) as last_activity,
       (SELECT dl2.action FROM download_logs dl2 
        WHERE dl2.user_id = u.id AND dl2.created_at = MAX(dl.created_at) 
        LIMIT 1) as activity_type
     FROM users u
     INNER JOIN download_logs dl ON u.id = dl.user_id
     WHERE dl.created_at > $1
     GROUP BY u.id, u.email`,
    [tenMinutesAgo]
  )
  
  // Get users from usage_logs
  const usageResult = await queryDb(
    `SELECT 
       u.id as user_id,
       u.email,
       MAX(ul.generated_at) as last_activity,
       (SELECT ul2.section_type FROM usage_logs ul2 
        WHERE ul2.user_id = u.id AND ul2.generated_at = MAX(ul.generated_at) 
        LIMIT 1) as activity_type
     FROM users u
     INNER JOIN usage_logs ul ON u.id = ul.user_id
     WHERE ul.generated_at > $1
     GROUP BY u.id, u.email`,
    [tenMinutesAgo]
  )
  
  // Combine all results and get the most recent activity per user
  const userMap = new Map<string, { user_id: string; email: string; last_activity: Date; activity_type: string }>()
  
  const addToMap = (rows: any[]) => {
    if (rows) {
      rows.forEach((row: any) => {
        const userId = row.user_id
        const lastActivity = new Date(row.last_activity)
        const existing = userMap.get(userId)
        
        if (!existing || lastActivity > existing.last_activity) {
          userMap.set(userId, {
            user_id: userId,
            email: row.email,
            last_activity: lastActivity,
            activity_type: row.activity_type || 'unknown'
          })
        }
      })
    }
  }
  
  addToMap(loginResult?.rows || [])
  addToMap(downloadResult?.rows || [])
  addToMap(usageResult?.rows || [])
  
  const onlineUsers = Array.from(userMap.values()).sort((a, b) => b.last_activity.getTime() - a.last_activity.getTime())
  
  console.log(`[getOnlineUsers] Found ${onlineUsers.length} online users:`, onlineUsers.map(u => ({
    email: u.email,
    activity: u.activity_type,
    time: u.last_activity.toISOString()
  })))
  
  return onlineUsers
}

// Note: In production, replace all these functions with actual database queries
// using a library like pg (PostgreSQL) or your ORM of choice

