import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserByClerkId, canDownloadOrCopy, logDownloadOrCopy } from "@/lib/db"

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

    // Get user from database
    const dbUser = await getUserByClerkId(userId)
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if user can download/copy
    const { allowed, count, limit } = await canDownloadOrCopy(
      dbUser.id,
      dbUser.plan,
      dbUser.is_admin
    )

    if (!allowed) {
      return NextResponse.json(
        { 
          error: `You have reached your download/copy limit of ${limit} sections. Upgrade to Pro for unlimited downloads.`,
          count,
          limit,
          reached: true
        },
        { status: 403 }
      )
    }

    // Log the download/copy action
    await logDownloadOrCopy(dbUser.id, sectionId, action)

    return NextResponse.json({
      success: true,
      message: action === 'copy' ? "Code copied successfully" : "Download logged successfully",
      remaining: limit === Infinity ? Infinity : limit - count - 1,
      count: count + 1,
      limit
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

    // Get user from database
    const dbUser = await getUserByClerkId(userId)
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Get download/copy stats
    const { allowed, count, limit } = await canDownloadOrCopy(
      dbUser.id,
      dbUser.plan,
      dbUser.is_admin
    )

    return NextResponse.json({
      count,
      limit,
      remaining: limit === Infinity ? Infinity : Math.max(0, limit - count),
      allowed,
      plan: dbUser.plan,
      isAdmin: dbUser.is_admin
    })
  } catch (error: any) {
    console.error("Error getting download stats:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get download stats" },
      { status: 500 }
    )
  }
}

