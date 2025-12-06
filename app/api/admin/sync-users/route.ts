import { NextResponse } from "next/server"
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server"
import { getUserByClerkId, createUser, updateUserPlan, updateUserAdminStatus, updateUserEmail, getAllUsers } from "@/lib/db"

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

export async function POST() {
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

    const clerk = clerkClient()
    let allClerkUsers: any[] = []
    let hasMore = true
    let offset = 0
    const limit = 500

    // Fetch all Clerk users
    while (hasMore) {
      const response = await clerk.users.getUserList({
        limit,
        offset,
      })
      
      allClerkUsers = [...allClerkUsers, ...response.data]
      hasMore = response.data.length === limit
      offset += limit
    }

    // Get all database users
    const dbUsers = await getAllUsers()
    const dbUsersByClerkId = new Map(dbUsers.map(u => [u.clerk_id, u]))

    let synced = 0
    let created = 0
    let updated = 0

    // Sync each Clerk user with database
    for (const clerkUser of allClerkUsers) {
      const email = clerkUser.emailAddresses[0]?.emailAddress || ""
      const dbUser = dbUsersByClerkId.get(clerkUser.id)
      
      if (!dbUser) {
        // Create new user in database
        await createUser(clerkUser.id, email)
        created++
        synced++
        continue
      }
      
      // Check if user should be admin based on Clerk metadata or ADMIN_EMAILS
      const publicMeta = clerkUser.publicMetadata as Record<string, unknown> | undefined
      const privateMeta = clerkUser.privateMetadata as Record<string, unknown> | undefined
      const hasAdminRole = 
        publicMeta?.role === 'admin' || 
        (typeof publicMeta?.role === 'string' && publicMeta.role.toLowerCase() === 'admin') ||
        privateMeta?.role === 'admin' ||
        (typeof privateMeta?.role === 'string' && privateMeta.role.toLowerCase() === 'admin')
      
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
      const emailIsAdmin = adminEmails.includes(email.toLowerCase())
      
      const shouldBeAdmin = hasAdminRole || emailIsAdmin
      
      // Update admin status if needed
      if (shouldBeAdmin !== dbUser.is_admin) {
        await updateUserAdminStatus(dbUser.id, shouldBeAdmin)
        updated++
      }
      
      // Ensure admins have pro plan
      if (shouldBeAdmin && dbUser.plan !== 'pro') {
        await updateUserPlan(dbUser.id, 'pro')
        updated++
      }
      
      // Update email if it changed
      if (dbUser.email !== email) {
        await updateUserEmail(dbUser.id, email)
        updated++
      }
      synced++
    }

    // Check for orphaned database users (users in DB but not in Clerk)
    const clerkUserIds = new Set(allClerkUsers.map(u => u.id))
    const orphanedUsers = dbUsers.filter(u => !clerkUserIds.has(u.clerk_id))

    return NextResponse.json({
      success: true,
      message: "Users synced successfully",
      stats: {
        totalClerkUsers: allClerkUsers.length,
        totalDbUsers: dbUsers.length,
        synced,
        created,
        updated,
        orphaned: orphanedUsers.length,
      },
      orphanedUsers: orphanedUsers.map(u => ({
        id: u.id,
        email: u.email,
        clerk_id: u.clerk_id,
      })),
    })
  } catch (error: any) {
    console.error("Error syncing users:", error)
    return NextResponse.json(
      { error: error.message || "Failed to sync users" },
      { status: 500 }
    )
  }
}

