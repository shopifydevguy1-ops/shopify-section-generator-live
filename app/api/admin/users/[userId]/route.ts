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

    // Update user plan if provided
    if (plan !== undefined) {
      await updateUserPlan(params.userId, plan)
    }

    // Update admin status if provided
    if (is_admin !== undefined) {
      await updateUserAdminStatus(params.userId, is_admin)
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

