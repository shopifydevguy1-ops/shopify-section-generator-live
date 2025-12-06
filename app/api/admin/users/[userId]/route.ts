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

    // If user is being set as admin, they must have pro plan
    // If user is being set to free plan, they cannot be admin
    if (is_admin === true && plan === 'free') {
      return NextResponse.json(
        { error: "Admin users must have Pro plan. Please set plan to Pro first, or remove admin status." },
        { status: 400 }
      )
    }

    // Update admin status FIRST (this may set plan to pro if admin is true)
    if (is_admin !== undefined) {
      await updateUserAdminStatus(params.userId, is_admin)
    }

    // Then update plan if provided (this will override the admin auto-pro if needed)
    // But only if user is not admin (admins must stay on pro)
    if (plan !== undefined) {
      // Get current user to check admin status
      const { getUserById } = await import("@/lib/db")
      const currentUser = await getUserById(params.userId)
      
      // If user is admin, they must stay on pro plan
      if (currentUser?.is_admin && plan === 'free') {
        return NextResponse.json(
          { error: "Admin users must have Pro plan. Please remove admin status first." },
          { status: 400 }
        )
      }
      
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

