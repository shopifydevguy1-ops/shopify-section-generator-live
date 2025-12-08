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
    console.log('[DB] No DATABASE_URL found, using in-memory storage')
    return null
  }

  try {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('sslmode=require') || databaseUrl.includes('ssl=true') 
        ? { rejectUnauthorized: false }
        : false,
    })

    // Test connection
    pool.query('SELECT NOW()')
      .then(() => console.log('[DB] Database connection established'))
      .catch((err) => {
        console.error('[DB] Database connection failed:', err.message)
        pool = null
      })

    return pool
  } catch (error: any) {
    console.error('[DB] Failed to create database pool:', error.message)
    return null
  }
}

export async function queryDb(
  text: string,
  params?: any[]
): Promise<QueryResult | null> {
  const dbPool = getDbPool()
  
  if (!dbPool) {
    return null
  }

  try {
    return await dbPool.query(text, params)
  } catch (error: any) {
    console.error('[DB] Query error:', error.message, text)
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

