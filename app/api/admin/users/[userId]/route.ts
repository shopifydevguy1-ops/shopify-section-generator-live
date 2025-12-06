import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserByClerkId, updateUserPlan, updateUserAdminStatus } from "@/lib/db"

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

    // Check if current user is admin
    const currentUser = await getUserByClerkId(currentUserId)
    if (!currentUser || !currentUser.is_admin) {
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

