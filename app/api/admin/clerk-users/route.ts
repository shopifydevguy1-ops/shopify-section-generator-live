import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/nextjs/server"
import { getUserByClerkId, createUser, getUserActivityStats } from "@/lib/db"

async function checkAdminAccess(userId: string) {
  const user = await currentUser()
  if (!user) return false

  // Check if user is admin via Clerk roles (handle different metadata formats)
  const publicMeta = user.publicMetadata as Record<string, unknown> | undefined
  const privateMeta = user.privateMetadata as Record<string, unknown> | undefined
  const hasAdminRole = 
    publicMeta?.role === 'admin' || 
    (typeof publicMeta?.role === 'string' && publicMeta.role.toLowerCase() === 'admin') ||
    privateMeta?.role === 'admin' ||
    (typeof privateMeta?.role === 'string' && privateMeta.role.toLowerCase() === 'admin')
  
  // Check if user is admin via ADMIN_EMAILS environment variable
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
  const emailIsAdmin = adminEmails.includes(user.emailAddresses[0]?.emailAddress?.toLowerCase() || '')
  
  // Check database admin status
  const dbUser = await getUserByClerkId(userId)
  const isDbAdmin = dbUser?.is_admin || false
  
  // User is admin if they have admin role in Clerk OR email is in ADMIN_EMAILS OR marked as admin in DB
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

    // Check if current user is admin using comprehensive check
    const isAdmin = await checkAdminAccess(userId)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    // Fetch all users from Clerk with pagination
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

    // Sync Clerk users with database and add activity stats
    const syncedUsers = await Promise.all(
      allClerkUsers.map(async (clerkUser) => {
        const email = clerkUser.emailAddresses[0]?.emailAddress || ""
        const dbUser = await getUserByClerkId(clerkUser.id)
        
        // If user doesn't exist in DB, create them
        let user = dbUser
        if (!user) {
          user = await createUser(clerkUser.id, email)
        }
        
        // Get activity stats for this user
        const activityStats = await getUserActivityStats(user.id)
        
        return {
          ...user,
          activityStats,
          clerkUser: {
            id: clerkUser.id,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl,
            createdAt: clerkUser.createdAt,
          }
        }
      })
    )

    return NextResponse.json({ users: syncedUsers })
  } catch (error: any) {
    console.error("Error fetching Clerk users:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 }
    )
  }
}

