import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getUserByClerkId, updateUserPlan, updateUserAdminStatus } from "@/lib/db"

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

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: currentUserId } = auth()
    
    if (!currentUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if current user is admin using comprehensive check
    const isAdmin = await checkAdminAccess(currentUserId)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { plan, is_admin } = body

    // Validate plan if provided
    if (plan && plan !== 'free' && plan !== 'pro') {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'free' or 'pro'" },
        { status: 400 }
      )
    }

    // Get current user to check existing state
    // Try to find user by database ID first, then by clerk_id if needed
    const { getUserById, getAllUsers } = await import("@/lib/db")
    let currentUser = await getUserById(params.userId)
    
    // If user not found by ID, try to find by searching all users
    // This handles cases where the user might have been created but the Map lookup failed
    if (!currentUser) {
      const allUsers = await getAllUsers()
      currentUser = allUsers.find(u => u.id === params.userId) || null
    }
    
    if (!currentUser) {
      return NextResponse.json(
        { error: `User not found with ID: ${params.userId}. Please refresh the page and try again.` },
        { status: 404 }
      )
    }

    // Determine final admin status (use provided value or keep current)
    const finalIsAdmin = is_admin !== undefined ? is_admin : currentUser.is_admin

    // If trying to set plan to free but user is/will be admin, prevent it
    if (plan === 'free' && finalIsAdmin) {
      return NextResponse.json(
        { error: "Admin users must have Pro plan. Please uncheck 'Admin Access' first, then change plan to free." },
        { status: 400 }
      )
    }

    // If both plan and admin status are being updated, handle the order carefully
    // If removing admin AND setting to free, do admin first, then plan
    // If setting admin, do admin first (which sets plan to pro), then plan update is ignored
    if (is_admin !== undefined) {
      await updateUserAdminStatus(params.userId, is_admin)
    }

    // Then update plan if provided
    // Note: If user is now admin, updateUserAdminStatus already set plan to pro,
    // so we need to check again before updating plan
    if (plan !== undefined) {
      // Get updated user to check current admin status
      const updatedUser = await getUserById(params.userId)
      
      // If user is admin, they must stay on pro plan
      if (updatedUser?.is_admin && plan === 'free') {
        return NextResponse.json(
          { error: "Cannot set free plan for admin users. Please remove admin status first." },
          { status: 400 }
        )
      }
      
      // Only update plan if user is not admin
      await updateUserPlan(params.userId, plan)
    }

    return NextResponse.json({ 
      success: true,
      message: "User updated successfully"
    })
  } catch (error: any) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    )
  }
}

