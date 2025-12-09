// Quick database connection test script
// Run with: node test-db-connection.js

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables')
  process.exit(1)
}

console.log('Testing database connection...')
console.log('Database URL:', databaseUrl.substring(0, 30) + '...')

const isSupabase = databaseUrl.includes('supabase.co') || databaseUrl.includes('supabase.com')

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

async function testConnection() {
  try {
    // Test 1: Basic connection
    console.log('\n1. Testing basic connection...')
    const result1 = await pool.query('SELECT NOW() as now')
    console.log('✅ Connection successful! Server time:', result1.rows[0].now)

    // Test 2: Check tables exist
    console.log('\n2. Checking tables...')
    const result2 = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('download_logs', 'usage_logs', 'users')
      ORDER BY table_name
    `)
    console.log('✅ Found tables:', result2.rows.map(r => r.table_name).join(', '))

    // Test 3: Test INSERT into download_logs
    console.log('\n3. Testing INSERT into download_logs...')
    const testId = require('crypto').randomUUID()
    const testUserId = require('crypto').randomUUID()
    const insertResult = await pool.query(
      `INSERT INTO download_logs (id, user_id, section_id, action, created_at, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [testId, testUserId, 'test-section', 'copy', new Date(), '127.0.0.1']
    )
    console.log('✅ INSERT successful! Row count:', insertResult.rowCount)

    // Test 4: Verify the insert
    console.log('\n4. Verifying INSERT...')
    const verifyResult = await pool.query(
      `SELECT COUNT(*) as count FROM download_logs WHERE id = $1`,
      [testId]
    )
    const count = parseInt(verifyResult.rows[0].count, 10)
    console.log('✅ Verification: Found', count, 'record(s)')

    // Test 5: Clean up test data
    console.log('\n5. Cleaning up test data...')
    await pool.query('DELETE FROM download_logs WHERE id = $1', [testId])
    console.log('✅ Test data cleaned up')

    // Test 6: Check RLS status
    console.log('\n6. Checking RLS status...')
    const rlsResult = await pool.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('download_logs', 'usage_logs', 'users')
    `)
    console.log('RLS Status:')
    rlsResult.rows.forEach(row => {
      console.log(`  ${row.tablename}: ${row.rowsecurity ? 'ENABLED' : 'DISABLED'}`)
    })

    console.log('\n✅ All tests passed!')
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error('Error code:', error.code)
    console.error('Error detail:', error.detail)
    console.error('Full error:', error)
    await pool.end()
    process.exit(1)
  }
}

testConnection()

