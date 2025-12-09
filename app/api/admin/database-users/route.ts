import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getUserByClerkId, getAllUsers, getAllSubscriptions, getUserActivityStats } from "@/lib/db"

async function checkAdminAccess(userId: string) {
  const user = await currentUser()
  if (!user) return false

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
  
  return hasAdminRole || emailIsAdmin || isDbAdmin
}

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

    const isAdmin = await checkAdminAccess(userId)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    // Get all users and subscriptions
    const allUsers = await getAllUsers()
    const allSubscriptions = await getAllSubscriptions()
    
    // Get activity stats for all users
    const usersWithStats = await Promise.all(
      allUsers.map(async (user) => {
        let activityStats
        try {
          activityStats = await getUserActivityStats(user.id)
        } catch (error: any) {
          console.error(`[database-users API] Error getting stats for user ${user.id}:`, error)
          // Return zero stats if there's an error
          activityStats = {
            generations: 0,
            copies: 0,
            downloads: 0,
            total: 0
          }
        }
        
        // Ensure activityStats is always defined
        if (!activityStats) {
          activityStats = {
            generations: 0,
            copies: 0,
            downloads: 0,
            total: 0
          }
        }
        
        const subscription = allSubscriptions.find(s => s.user_id === user.id)
        
        // Enhanced logging for debugging
        if (activityStats.total > 0 || activityStats.copies > 0 || activityStats.downloads > 0) {
          console.log(`[database-users API] User ${user.email} (ID: ${user.id}):`, activityStats)
        }
        
        return { 
          user, 
          activityStats,
          subscription: subscription || undefined
        }
      })
    )

    console.log(`[database-users API] Returning ${usersWithStats.length} users with stats`)

    return NextResponse.json({ users: usersWithStats })
  } catch (error: any) {
    console.error("Error fetching database users:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch database users" },
      { status: 500 }
    )
  }
}

