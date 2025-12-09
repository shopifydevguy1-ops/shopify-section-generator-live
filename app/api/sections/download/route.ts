import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getUserByClerkId, canDownloadOrCopy, logDownloadOrCopy, createUser, logUsage } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { sectionId, action } = body

    if (!sectionId || !action || (action !== 'copy' && action !== 'download')) {
      return NextResponse.json(
        { error: "Invalid request. sectionId and action (copy or download) are required." },
        { status: 400 }
      )
    }

    // Get user from database, create if doesn't exist
    let dbUser = await getUserByClerkId(userId)
    if (!dbUser) {
      // Create user if doesn't exist
      const clerkUser = await currentUser()
      if (!clerkUser) {
        return NextResponse.json(
          { error: "Unable to get user information" },
          { status: 401 }
        )
      }
      const email = clerkUser.emailAddresses[0]?.emailAddress || ""
      dbUser = await createUser(userId, email)
    }

    // Extract IP address from request headers
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || undefined

    // Check if user can download/copy
    const { allowed, count, limit, reason } = await canDownloadOrCopy(
      dbUser.id,
      dbUser.plan,
      dbUser.is_admin,
      ipAddress
    )

    if (!allowed) {
      const limitValue = limit === Infinity ? 50 : limit
      const upgradeMessage = reason || (dbUser.plan === 'pro' 
        ? 'You can still search/browse unlimited sections. Subscribe to Pro for 50 copies/downloads per month, or upgrade to Expert for unlimited access.'
        : 'You can still search/browse unlimited sections. Upgrade to Expert for unlimited access and full library access.')
      return NextResponse.json(
        { 
          error: limitValue > 0 ? `You have reached your copy/download limit of ${limitValue} sections. ${upgradeMessage}` : upgradeMessage,
          count,
          limit: limit === Infinity ? null : limit,
          reached: true
        },
        { status: 403 }
      )
    }

    console.log(`[download API] Starting ${action} for user ${dbUser.id} (${dbUser.email}), sectionId: ${sectionId}`)
    
    // Verify database connection before attempting inserts
    const { getDbPool } = await import("@/lib/db-connection")
    const dbPool = getDbPool()
    if (!dbPool) {
      console.error(`[download API] ❌ No database pool available! Cannot save ${action} data.`)
      return NextResponse.json(
        { error: "Database connection unavailable. Please try again." },
        { status: 503 }
      )
    }
    
    // Log the download/copy action (for download/copy limit tracking)
    try {
      await logDownloadOrCopy(dbUser.id, sectionId, action, ipAddress)
      console.log(`[download API] ✅ logDownloadOrCopy completed for ${action}`)
    } catch (error: any) {
      console.error(`[download API] ❌ logDownloadOrCopy failed: ${error.message}`, error)
      // Return error to user so they know it failed
      return NextResponse.json(
        { error: `Failed to log ${action}. Please try again.`, details: error.message },
        { status: 500 }
      )
    }
    
    // Also log as usage for monthly limit tracking (so it syncs with dashboard)
    try {
      await logUsage(dbUser.id, action === 'copy' ? 'copy' : 'download', ipAddress)
      console.log(`[download API] ✅ logUsage completed for ${action}`)
    } catch (error: any) {
      console.error(`[download API] ❌ logUsage failed: ${error.message}`, error)
      // Log error but don't fail the request since download_logs was saved
    }

    // Get fresh stats after logging to ensure accurate count
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const { getUserUsageCount } = await import("@/lib/db")
    const freshCount = await getUserUsageCount(dbUser.id, currentMonth, currentYear)
    const freshRemaining = limit === Infinity ? null : Math.max(0, limit - freshCount)

    console.log(`[download API] After ${action}: user ${dbUser.id}, freshCount=${freshCount}, limit=${limit}, remaining=${freshRemaining}`)
    
    // Verify the data was written by checking the database (with a small delay to ensure commit)
    setTimeout(async () => {
      try {
        const { queryDb } = await import("@/lib/db-connection")
        const verifyResult = await queryDb(
          `SELECT COUNT(*) as count FROM download_logs WHERE user_id = $1 AND action = $2 AND created_at >= $3`,
          [dbUser.id, action, new Date(Date.now() - 5000)] // Check last 5 seconds
        )
        if (verifyResult && verifyResult.rows && verifyResult.rows.length > 0) {
          const recentCount = parseInt(verifyResult.rows[0].count, 10) || 0
          if (recentCount > 0) {
            console.log(`[download API] ✅ Verification: Found ${recentCount} recent ${action} record(s) for user ${dbUser.id}`)
          } else {
            console.error(`[download API] ⚠️ WARNING: No recent ${action} records found in database! Data may not have been saved.`)
          }
        } else {
          console.error(`[download API] ⚠️ WARNING: Verification query returned no results!`)
        }
      } catch (error: any) {
        console.error(`[download API] ❌ Verification query failed: ${error.message}`)
      }
    }, 1000) // Wait 1 second for commit

    return NextResponse.json({
      success: true,
      message: action === 'copy' ? "Code copied successfully" : "Download logged successfully",
      remaining: freshRemaining,
      count: freshCount,
      limit: limit === Infinity ? null : limit,
      allowed: limit === Infinity || freshRemaining === null || freshRemaining > 0
    })
  } catch (error: any) {
    console.error("Error processing download/copy:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process download/copy" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user from database, create if doesn't exist
    let dbUser = await getUserByClerkId(userId)
    if (!dbUser) {
      // Create user if doesn't exist
      const clerkUser = await currentUser()
      if (!clerkUser) {
        return NextResponse.json(
          { error: "Unable to get user information" },
          { status: 401 }
        )
      }
      const email = clerkUser.emailAddresses[0]?.emailAddress || ""
      dbUser = await createUser(userId, email)
    }

    // Get download/copy stats
    const { allowed, count, limit, reason, trialInfo } = await canDownloadOrCopy(
      dbUser.id,
      dbUser.plan,
      dbUser.is_admin
    )

    console.log(`[download GET] User ${dbUser.email} (${dbUser.id}): count=${count}, limit=${limit}, allowed=${allowed}`)

    // Get trial expiration info for pro users
    let trialExpirationInfo = null
    if (dbUser.plan === 'pro' && !dbUser.is_admin) {
      const { getTrialExpirationInfo } = await import("@/lib/db")
      const trialInfoData = await getTrialExpirationInfo(dbUser.id)
      // Serialize dates for JSON response
      trialExpirationInfo = {
        ...trialInfoData,
        trialExpiresAt: trialInfoData.trialExpiresAt ? trialInfoData.trialExpiresAt.toISOString() : null
      }
    }

    return NextResponse.json({
      count,
      limit: limit === Infinity ? null : limit,
      remaining: limit === Infinity ? null : Math.max(0, limit - count),
      allowed,
      plan: dbUser.plan,
      isAdmin: dbUser.is_admin,
      reason: reason || undefined,
      trialInfo: trialInfo || undefined,
      trialExpirationInfo: trialExpirationInfo || undefined
    })
  } catch (error: any) {
    console.error("Error getting download stats:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get download stats" },
      { status: 500 }
    )
  }
}

