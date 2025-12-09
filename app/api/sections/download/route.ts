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

    // Log the download/copy action (for download/copy limit tracking)
    await logDownloadOrCopy(dbUser.id, sectionId, action, ipAddress)
    
    // Also log as usage for monthly limit tracking (so it syncs with dashboard)
    await logUsage(dbUser.id, action === 'copy' ? 'copy' : 'download', ipAddress)

    // Get fresh stats after logging to ensure accurate count
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const { getUserUsageCount } = await import("@/lib/db")
    const freshCount = await getUserUsageCount(dbUser.id, currentMonth, currentYear)
    const freshRemaining = limit === Infinity ? null : Math.max(0, limit - freshCount)

    console.log(`[download API] After ${action}: user ${dbUser.id}, freshCount=${freshCount}, limit=${limit}, remaining=${freshRemaining}`)

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
    const { allowed, count, limit, reason } = await canDownloadOrCopy(
      dbUser.id,
      dbUser.plan,
      dbUser.is_admin
    )

    console.log(`[download GET] User ${dbUser.email} (${dbUser.id}): count=${count}, limit=${limit}, allowed=${allowed}`)

    return NextResponse.json({
      count,
      limit: limit === Infinity ? null : limit,
      remaining: limit === Infinity ? null : Math.max(0, limit - count),
      allowed,
      plan: dbUser.plan,
      isAdmin: dbUser.is_admin,
      reason: reason || undefined
    })
  } catch (error: any) {
    console.error("Error getting download stats:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get download stats" },
      { status: 500 }
    )
  }
}

