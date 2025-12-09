// Database connection helper
// This file handles database connections and provides a fallback to in-memory storage

import { Pool, QueryResult } from 'pg'

let pool: Pool | null = null

export function getDbPool(): Pool | null {
  if (pool) {
    return pool
  }

  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    console.error('[DB] ❌ No DATABASE_URL found in environment variables!')
    console.error('[DB] Please set DATABASE_URL in your Vercel environment variables or .env.local')
    return null
  }

  // Log connection info (without exposing password)
  const urlParts = databaseUrl.match(/^([^:]+):\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/)
  if (urlParts) {
    const [, protocol, username, , host, port, database] = urlParts
    console.log('[DB] Connection info:', {
      protocol,
      username,
      host,
      port,
      database,
      hasPassword: !!databaseUrl.includes('@')
    })
  } else {
    console.warn('[DB] ⚠️ DATABASE_URL format may be incorrect')
    console.warn('[DB] Expected format: postgresql://user:password@host:port/database')
    console.warn('[DB] Your URL starts with:', databaseUrl.substring(0, 30))
  }

  try {
    // Supabase requires SSL - check if it's a Supabase URL
    const isSupabase = databaseUrl.includes('supabase.co') || databaseUrl.includes('supabase.com')
    
    if (isSupabase) {
      console.log('[DB] Detected Supabase connection, enabling SSL')
    }
    
    pool = new Pool({
      connectionString: databaseUrl,
      // Supabase always requires SSL
      ssl: isSupabase || databaseUrl.includes('sslmode=require') || databaseUrl.includes('ssl=true')
        ? { rejectUnauthorized: false }
        : false,
      // Connection pool settings for Supabase
      max: isSupabase ? 10 : 20, // Supabase has connection limits
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })

    // Test connection asynchronously (don't block)
    pool.query('SELECT NOW() as now')
      .then((result) => {
        console.log('[DB] Database connection established successfully at', result.rows[0].now)
        // Verify tables exist
        return pool?.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('download_logs', 'usage_logs', 'users')
        `)
      })
      .then((result) => {
        if (result && result.rows) {
          const tables = result.rows.map((r: any) => r.table_name)
          console.log('[DB] Found tables:', tables)
          if (tables.length < 3) {
            console.warn('[DB] Warning: Some tables may be missing. Make sure you ran the database schema.')
          }
        }
      })
      .catch((err) => {
        console.error('[DB] ❌ Database connection test failed:', err.message)
        console.error('[DB] Error code:', err.code)
        
        if (err.code === 'ENOTFOUND') {
          console.error('[DB] 🔍 DNS lookup failed - hostname cannot be resolved')
          const hostname = databaseUrl.match(/@([^:]+)/)?.[1] || 'unknown'
          console.error('[DB] Hostname:', hostname)
          console.error('[DB] This usually means:')
          console.error('[DB]   1. The DATABASE_URL hostname is incorrect')
          console.error('[DB]   2. The database instance does not exist')
          console.error('[DB]   3. The DATABASE_URL environment variable is not set correctly in Vercel')
          console.error('[DB] 💡 Check your Vercel environment variables and ensure DATABASE_URL is set correctly')
        } else if (err.message.includes('SSL')) {
          console.error('[DB] 🔍 SSL configuration issue')
        } else {
          console.error('[DB] 🔍 This might indicate: Connection or authentication issue')
        }
        pool = null
      })
    
    return pool
  } catch (error: any) {
    console.error('[DB] Failed to create database pool:', error.message)
    console.error('[DB] Error details:', error)
    pool = null
    return null
  }
}

export async function queryDb(
  text: string,
  params?: any[]
): Promise<QueryResult | null> {
  const dbPool = getDbPool()
  
  if (!dbPool) {
    console.log('[DB] No database pool available, query skipped:', text.substring(0, 50))
    return null
  }

  try {
    // Check if pool is still connected
    if (dbPool.totalCount === 0 && dbPool.idleCount === 0) {
      console.warn('[DB] Pool appears to be empty, attempting to reconnect...')
    }
    
    const result = await dbPool.query(text, params)
    return result
  } catch (error: any) {
    // Log detailed error information
    console.error('[DB] ❌ Query error:', error.message)
    console.error('[DB] Query:', text.substring(0, 200)) // Log first 200 chars to avoid huge logs
    console.error('[DB] Params:', params)
    console.error('[DB] Error code:', error.code)
    console.error('[DB] Error detail:', error.detail)
    console.error('[DB] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    
    // Check for specific error types
    if (error.code === '57P01' || error.message?.includes('terminating connection')) {
      console.error('[DB] Connection was terminated. Pool may need to be reset.')
      pool = null // Reset pool to force reconnection
    }
    
    if (error.code === '53300' || error.message?.includes('too many connections')) {
      console.error('[DB] Too many database connections. Check connection pool settings.')
    }
    
    if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('row-level security')) {
      console.error('[DB] Permission denied or RLS blocking query. Check RLS policies and user permissions.')
    }
    
    // For Supabase-specific errors, provide helpful messages
    if (error.message?.includes('connection') || error.message?.includes('timeout')) {
      console.error('[DB] Connection issue detected. Check your Supabase connection limits and pool settings.')
    }
    if (error.message?.includes('SSL')) {
      console.error('[DB] SSL configuration issue. Ensure SSL is properly configured for Supabase.')
    }
    
    return null
  }
}

// Close database connection (useful for cleanup)
export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    console.log('[DB] Database connection closed')
  }
}

