import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getUserStats, getUserByClerkId } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const publicMeta = user.publicMetadata as Record<string, unknown> | undefined
    const privateMeta = user.privateMetadata as Record<string, unknown> | undefined
    const hasAdminRole = 
      publicMeta?.role === 'admin' || 
      (typeof publicMeta?.role === 'string' && publicMeta.role.toLowerCase() === 'admin') ||
      privateMeta?.role === 'admin' ||
      (typeof privateMeta?.role === 'string' && privateMeta.role.toLowerCase() === 'admin')
    
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
    const emailIsAdmin = adminEmails.includes(user.emailAddresses[0]?.emailAddress?.toLowerCase() || '')
    
    const dbUser = await getUserByClerkId(userId)
    const isDbAdmin = dbUser?.is_admin || false
    
    const isAdmin = hasAdminRole || emailIsAdmin || isDbAdmin
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    // Get stats
    const stats = await getUserStats()

    return NextResponse.json({
      stats,
    })
  } catch (error: any) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch stats" },
      { status: 500 }
    )
  }
}

