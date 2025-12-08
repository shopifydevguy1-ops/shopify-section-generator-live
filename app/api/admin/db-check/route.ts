import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { queryDb } from "@/lib/db-connection"
import { getUserByClerkId } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(userId)
    if (!dbUser || !dbUser.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const diagnostics: any = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...',
      isSupabase: process.env.DATABASE_URL?.includes('supabase'),
    }

    // Test basic connection
    const connectionTest = await queryDb('SELECT NOW() as now, version() as version')
    if (connectionTest) {
      diagnostics.connection = 'OK'
      diagnostics.serverTime = connectionTest.rows[0]?.now
      diagnostics.postgresVersion = connectionTest.rows[0]?.version?.substring(0, 50)
    } else {
      diagnostics.connection = 'FAILED'
    }

    // Check if tables exist
    const tablesCheck = await queryDb(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('download_logs', 'usage_logs', 'users', 'login_logs')
      ORDER BY table_name
    `)
    
    if (tablesCheck) {
      diagnostics.tables = tablesCheck.rows.map((r: any) => r.table_name)
    }

    // Check download_logs structure
    if (diagnostics.tables?.includes('download_logs')) {
      const structureCheck = await queryDb(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'download_logs'
        ORDER BY ordinal_position
      `)
      if (structureCheck) {
        diagnostics.download_logs_structure = structureCheck.rows
      }

      // Count total records
      const countCheck = await queryDb('SELECT COUNT(*) as count FROM download_logs')
      if (countCheck) {
        diagnostics.download_logs_count = parseInt(countCheck.rows[0]?.count || '0', 10)
      }

      // Get recent records
      const recentCheck = await queryDb(`
        SELECT id, user_id, action, created_at 
        FROM download_logs 
        ORDER BY created_at DESC 
        LIMIT 5
      `)
      if (recentCheck) {
        diagnostics.recent_download_logs = recentCheck.rows.map((r: any) => ({
          id: r.id,
          user_id: r.user_id,
          action: r.action,
          created_at: r.created_at,
        }))
      }
    }

    // Check if we can query by a specific user
    if (dbUser) {
      const userCheck = await queryDb(
        `SELECT COUNT(*) as count FROM download_logs WHERE user_id = $1`,
        [dbUser.id]
      )
      if (userCheck) {
        diagnostics.user_download_count = parseInt(userCheck.rows[0]?.count || '0', 10)
        diagnostics.user_id_used = dbUser.id
        diagnostics.user_id_type = typeof dbUser.id
      }
    }

    return NextResponse.json(diagnostics)
  } catch (error: any) {
    console.error('[DB Check] Error:', error)
    return NextResponse.json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

