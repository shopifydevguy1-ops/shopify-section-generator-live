// Quick test for the new database connection
// Run with: node test-new-db.js
// Make sure DATABASE_URL is set in your environment or .env.local

let dotenv
try {
  dotenv = require('dotenv')
  dotenv.config({ path: '.env.local' })
} catch (e) {
  console.log('Note: dotenv not found, using environment variables directly')
}

const { Pool } = require('pg')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables')
  console.error('Please set DATABASE_URL in your .env.local file')
  process.exit(1)
}

console.log('Testing new database connection...')
console.log('Database URL format:', databaseUrl.substring(0, 50) + '...')
console.log('Hostname:', databaseUrl.match(/@([^:]+)/)?.[1] || 'Not found')

const isSupabase = databaseUrl.includes('supabase.co') || databaseUrl.includes('supabase.com')

if (!isSupabase) {
  console.warn('⚠️  Warning: URL does not appear to be a Supabase URL')
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

async function testConnection() {
  try {
    console.log('\n1. Testing basic connection...')
    const result1 = await pool.query('SELECT NOW() as now, version() as version')
    console.log('✅ Connection successful!')
    console.log('   Server time:', result1.rows[0].now)
    console.log('   PostgreSQL version:', result1.rows[0].version.substring(0, 50))

    console.log('\n2. Checking tables...')
    const result2 = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('download_logs', 'usage_logs', 'users', 'subscriptions', 'login_logs', 'section_templates')
      ORDER BY table_name
    `)
    const tables = result2.rows.map(r => r.table_name)
    console.log('✅ Found tables:', tables.length > 0 ? tables.join(', ') : 'None')
    
    if (tables.length < 3) {
      console.warn('⚠️  Warning: Some expected tables are missing!')
      console.warn('   Expected: download_logs, usage_logs, users')
      console.warn('   You may need to run the database schema.')
    }

    console.log('\n3. Testing INSERT into download_logs...')
    const testId = require('crypto').randomUUID()
    const testUserId = require('crypto').randomUUID()
    const insertResult = await pool.query(
      `INSERT INTO download_logs (id, user_id, section_id, action, created_at, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [testId, testUserId, 'test-section', 'copy', new Date(), '127.0.0.1']
    )
    console.log('✅ INSERT successful!')
    console.log('   Row count:', insertResult.rowCount)
    console.log('   Inserted ID:', insertResult.rows[0].id)

    console.log('\n4. Verifying INSERT...')
    const verifyResult = await pool.query(
      `SELECT COUNT(*) as count FROM download_logs WHERE id = $1`,
      [testId]
    )
    const count = parseInt(verifyResult.rows[0].count, 10)
    console.log('✅ Verification: Found', count, 'record(s)')

    console.log('\n5. Testing SELECT query...')
    const selectResult = await pool.query(
      `SELECT COUNT(*) as total FROM download_logs`
    )
    console.log('✅ Total download_logs records:', selectResult.rows[0].total)

    console.log('\n6. Cleaning up test data...')
    await pool.query('DELETE FROM download_logs WHERE id = $1', [testId])
    console.log('✅ Test data cleaned up')

    console.log('\n7. Checking RLS status...')
    const rlsResult = await pool.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('download_logs', 'usage_logs', 'users')
    `)
    console.log('RLS Status:')
    rlsResult.rows.forEach(row => {
      const status = row.rowsecurity ? 'ENABLED ⚠️' : 'DISABLED ✅'
      console.log(`   ${row.tablename}: ${status}`)
    })
    
    if (rlsResult.rows.some(r => r.rowsecurity)) {
      console.warn('\n⚠️  Warning: RLS is enabled on some tables.')
      console.warn('   Make sure you ran enable-rls.sql to create permissive policies.')
    }

    console.log('\n✅ All tests passed! Your database connection is working correctly.')
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Test failed!')
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    console.error('Error detail:', error.detail)
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n🔍 Diagnosis: DNS lookup failed')
      console.error('   The hostname cannot be resolved.')
      console.error('   Check that your DATABASE_URL is correct.')
      console.error('   Format should be: postgresql://user:password@host:port/database')
    } else if (error.code === '28P01') {
      console.error('\n🔍 Diagnosis: Authentication failed')
      console.error('   Check your database username and password.')
    } else if (error.code === '3D000') {
      console.error('\n🔍 Diagnosis: Database does not exist')
      console.error('   Check that the database name in your DATABASE_URL is correct.')
    } else if (error.message?.includes('SSL')) {
      console.error('\n🔍 Diagnosis: SSL connection issue')
      console.error('   Supabase requires SSL. Check your connection string.')
    }
    
    console.error('\nFull error:', error)
    await pool.end()
    process.exit(1)
  }
}

testConnection()

