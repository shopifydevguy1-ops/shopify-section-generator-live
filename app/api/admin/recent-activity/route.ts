import { NextResponse } from "next/server"
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server"
import { getUserByClerkId, getAllUsers, getAllUsageLogs, getAllLoginLogs, createUser } from "@/lib/db"

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

    // Fetch all Clerk users and sync with database
    const clerk = clerkClient()
    let allClerkUsers: any[] = []
    let hasMore = true
    let offset = 0
    const limit = 500

    while (hasMore) {
      const response = await clerk.users.getUserList({
        limit,
        offset,
      })
      
      allClerkUsers = [...allClerkUsers, ...response.data]
      hasMore = response.data.length === limit
      offset += limit
    }

    // Sync Clerk users with database
    const syncedUsers = await Promise.all(
      allClerkUsers.map(async (clerkUser) => {
        const email = clerkUser.emailAddresses[0]?.emailAddress || ""
        let dbUser = await getUserByClerkId(clerkUser.id)
        
        // If user doesn't exist in DB, create them
        if (!dbUser) {
          dbUser = await createUser(clerkUser.id, email)
        }
        
        return dbUser
      })
    )

    const allLogs = await getAllUsageLogs()
    const allLoginLogs = await getAllLoginLogs()

    // Get recent users (last 10) - combine database users with login logs
    const recentUsers = syncedUsers
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, 10)
      .map(user => {
        // Find most recent login for this user
        const userLogins = allLoginLogs
          .filter(log => log.user_id === user.id || log.clerk_id === user.clerk_id)
          .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        
        return {
          ...user,
          lastLogin: userLogins[0]?.created_at || null,
        }
      })

    // Get recent activity (last 20) - combine usage logs and login logs
    const recentActivity = [
      ...allLogs.map(log => ({
        type: 'generation' as const,
        id: log.id,
        user_id: log.user_id,
        email: syncedUsers.find(u => u.id === log.user_id)?.email || 'Unknown user',
        action: log.section_type,
        timestamp: log.generated_at,
      })),
      ...allLoginLogs.map(log => ({
        type: 'login' as const,
        id: log.id,
        user_id: log.user_id,
        email: log.email,
        action: 'Logged in',
        timestamp: log.created_at,
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20)

    return NextResponse.json({
      recentUsers,
      recentActivity,
    })
  } catch (error: any) {
    console.error("Error fetching recent activity:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch recent activity" },
      { status: 500 }
    )
  }
}

