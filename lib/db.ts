// Database utilities
// This file contains database schema and helper functions
// For production, you'll need to set up a PostgreSQL database

export interface User {
  id: string
  clerk_id: string
  email: string
  plan: 'free' | 'pro'
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
  plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
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
CREATE INDEX IF NOT EXISTS idx_subscriptions_paymongo_payment_id ON subscriptions(paymongo_payment_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paymongo_payment_intent_id ON subscriptions(paymongo_payment_intent_id);
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
let downloadLogs: DownloadLog[] = []
let loginLogs: LoginLog[] = []

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
  return users.get(userId) || null
}

export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  // In production, query your database
  // SELECT * FROM users WHERE clerk_id = $1
  for (const user of users.values()) {
    if (user.clerk_id === clerkId) {
      // Check if user should be admin based on current ADMIN_EMAILS
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
      if (adminEmails.includes(user.email.toLowerCase()) && !user.is_admin) {
        // Update user to admin and pro plan if email is in admin list
        user.is_admin = true
        user.plan = 'pro' // Admins get pro plan automatically
        user.updated_at = new Date()
        users.set(user.id, user)
      }
      // If user is admin but not on pro plan, upgrade them
      if (user.is_admin && user.plan !== 'pro') {
        user.plan = 'pro'
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
  
  // Admins automatically get pro plan with unlimited generations
  const user: User = {
    id: crypto.randomUUID(),
    clerk_id: clerkId,
    email,
    plan: shouldBeAdmin ? 'pro' : 'free',
    is_admin: shouldBeAdmin,
    created_at: new Date(),
    updated_at: new Date(),
  }
  users.set(user.id, user)
  return user
}

export async function getAllUsers(): Promise<User[]> {
  return Array.from(users.values())
}

export async function getAllSubscriptions(): Promise<Subscription[]> {
  return Array.from(subscriptions.values())
}

export async function getAllUsageLogs(): Promise<UsageLog[]> {
  return usageLogs
}

export async function getAllLoginLogs(): Promise<LoginLog[]> {
  return loginLogs
}

export async function logLogin(userId: string, clerkId: string, email: string, ipAddress?: string): Promise<void> {
  const log: LoginLog = {
    id: crypto.randomUUID(),
    user_id: userId,
    clerk_id: clerkId,
    email,
    ip_address: ipAddress,
    created_at: new Date(),
  }
  loginLogs.push(log)
  // Keep only last 1000 login logs to prevent memory issues
  if (loginLogs.length > 1000) {
    loginLogs = loginLogs.slice(-1000)
  }
  console.log(`[logLogin] Logged login for user ${email}, total logs: ${loginLogs.length}`)
}

export async function getUserStats(): Promise<{
  totalUsers: number
  freeUsers: number
  proUsers: number
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
    freeUsers: allUsers.filter(u => u.plan === 'free').length,
    proUsers: allUsers.filter(u => u.plan === 'pro').length,
    totalSubscriptions: allSubscriptions.length,
    activeSubscriptions: allSubscriptions.filter(s => s.status === 'active').length,
    totalGenerations: allLogs.length,
    generationsThisMonth: allLogs.filter(log => 
      log.month === currentMonth && log.year === currentYear
    ).length,
  }
}

export async function getUserUsageCount(userId: string, month: number, year: number, ipAddress?: string): Promise<number> {
  // Count generations from usageLogs
  const generationCount = usageLogs.filter(
    log => log.user_id === userId && 
    log.month === month && 
    log.year === year
  ).length
  
  // Count downloads/copies from downloadLogs
  const downloadCopyCount = downloadLogs.filter(
    log => {
      const logDate = new Date(log.created_at)
      return log.user_id === userId && 
        logDate.getMonth() + 1 === month && 
        logDate.getFullYear() === year
    }
  ).length
  
  // Return total count (generations + downloads + copies)
  return generationCount + downloadCopyCount
}

// Get usage count by IP address (to prevent multiple account abuse)
export async function getIPUsageCount(ipAddress: string, month: number, year: number): Promise<number> {
  if (!ipAddress) return 0
  
  // Count generations from usageLogs by IP
  const generationCount = usageLogs.filter(
    log => log.ip_address === ipAddress && 
    log.month === month && 
    log.year === year
  ).length
  
  // Count downloads/copies from downloadLogs by IP
  const downloadCopyCount = downloadLogs.filter(
    log => {
      const logDate = new Date(log.created_at)
      return log.ip_address === ipAddress && 
        logDate.getMonth() + 1 === month && 
        logDate.getFullYear() === year
    }
  ).length
  
  // Return total count (generations + downloads + copies) for this IP
  return generationCount + downloadCopyCount
}

export async function logUsage(userId: string, sectionType: string, ipAddress?: string): Promise<void> {
  const now = new Date()
  const log: UsageLog = {
    id: crypto.randomUUID(),
    user_id: userId,
    section_type: sectionType,
    generated_at: now,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    ip_address: ipAddress,
  }
  usageLogs.push(log)
  console.log(`[logUsage] Logged usage for user ${userId}, sectionType: ${sectionType}, ip: ${ipAddress || 'unknown'}, total logs: ${usageLogs.length}`)
}

export async function getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
  for (const sub of subscriptions.values()) {
    if (sub.user_id === userId) return sub
  }
  return null
}

export async function updateUserPlan(userId: string, plan: 'free' | 'pro'): Promise<void> {
  const user = users.get(userId) || Array.from(users.values()).find(u => u.id === userId)
  if (user) {
    user.plan = plan
    user.updated_at = new Date()
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
    // Admins automatically get pro plan
    // Note: We don't change plan when removing admin status - let the plan update handle that
    if (isAdmin) {
      user.plan = 'pro'
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
  
  if (existing) {
    // Update existing subscription
    existing.paymongo_payment_id = params.paymongoPaymentId || existing.paymongo_payment_id
    existing.paymongo_payment_intent_id = params.paymongoPaymentIntentId || existing.paymongo_payment_intent_id
    existing.status = params.status
    existing.current_period_start = params.currentPeriodStart
    existing.current_period_end = params.currentPeriodEnd
    existing.updated_at = new Date()
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
      created_at: new Date(),
      updated_at: new Date(),
    }
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
  // Count generations (from usageLogs)
  const generations = usageLogs.filter(log => log.user_id === userId).length
  
  // Count copies (from downloadLogs where action is 'copy')
  const copies = downloadLogs.filter(log => log.user_id === userId && log.action === 'copy').length
  
  // Count downloads (from downloadLogs where action is 'download')
  const downloads = downloadLogs.filter(log => log.user_id === userId && log.action === 'download').length
  
  return {
    generations,
    copies,
    downloads,
    total: generations + copies + downloads,
  }
}

export async function canDownloadOrCopy(userId: string, plan: 'free' | 'pro', isAdmin: boolean, ipAddress?: string): Promise<{ allowed: boolean; count: number; limit: number; reason?: string }> {
  // Pro users and admins have unlimited downloads
  if (plan === 'pro' || isAdmin) {
    return { allowed: true, count: 0, limit: Infinity }
  }
  
  // Free users have a limit of 5 total actions (generations + downloads + copies)
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  
  // Check by user ID
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
      reason: "You have reached the limit from this IP address. Please upgrade to Pro for unlimited access." 
    }
  }
  
  return { allowed: count < limit, count, limit }
}

export async function logDownloadOrCopy(userId: string, sectionId: string, action: 'copy' | 'download', ipAddress?: string): Promise<void> {
  const log: DownloadLog = {
    id: crypto.randomUUID(),
    user_id: userId,
    section_id: sectionId,
    action,
    created_at: new Date(),
    ip_address: ipAddress,
  }
  downloadLogs.push(log)
}

// Reset user usage limits (admin function)
export async function resetUserUsageLimit(userId: string, month?: number, year?: number): Promise<{ deleted: number }> {
  const now = new Date()
  const targetMonth = month || now.getMonth() + 1
  const targetYear = year || now.getFullYear()
  
  // Delete usage logs for the user in the specified month/year
  const initialUsageCount = usageLogs.length
  usageLogs = usageLogs.filter(
    log => !(log.user_id === userId && log.month === targetMonth && log.year === targetYear)
  )
  const deletedUsage = initialUsageCount - usageLogs.length
  
  // Delete download logs for the user in the specified month/year
  const initialDownloadCount = downloadLogs.length
  downloadLogs = downloadLogs.filter(
    log => {
      const logDate = new Date(log.created_at)
      return !(log.user_id === userId && 
        logDate.getMonth() + 1 === targetMonth && 
        logDate.getFullYear() === targetYear)
    }
  )
  const deletedDownloads = initialDownloadCount - downloadLogs.length
  
  const totalDeleted = deletedUsage + deletedDownloads
  console.log(`[resetUserUsageLimit] Reset usage for user ${userId}, month ${targetMonth}/${targetYear}, deleted ${totalDeleted} logs`)
  
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
  
  // Delete usage logs for the IP in the specified month/year
  const initialUsageCount = usageLogs.length
  usageLogs = usageLogs.filter(
    log => !(log.ip_address === ipAddress && log.month === targetMonth && log.year === targetYear)
  )
  const deletedUsage = initialUsageCount - usageLogs.length
  
  // Delete download logs for the IP in the specified month/year
  const initialDownloadCount = downloadLogs.length
  downloadLogs = downloadLogs.filter(
    log => {
      const logDate = new Date(log.created_at)
      return !(log.ip_address === ipAddress && 
        logDate.getMonth() + 1 === targetMonth && 
        logDate.getFullYear() === targetYear)
    }
  )
  const deletedDownloads = initialDownloadCount - downloadLogs.length
  
  const totalDeleted = deletedUsage + deletedDownloads
  console.log(`[resetIPUsageLimit] Reset usage for IP ${ipAddress}, month ${targetMonth}/${targetYear}, deleted ${totalDeleted} logs`)
  
  return { deleted: totalDeleted }
}

// Note: In production, replace all these functions with actual database queries
// using a library like pg (PostgreSQL) or your ORM of choice

