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
        const activityStats = await getUserActivityStats(user.id)
        const subscription = allSubscriptions.find(s => s.user_id === user.id)
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

