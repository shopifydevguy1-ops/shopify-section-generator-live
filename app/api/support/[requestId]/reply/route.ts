import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getSupportRequestById, addSupportReply, updateSupportRequestStatus } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { requestId } = await params
    const body = await request.json()
    const { message, status } = body

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // Get the support request
    const supportRequest = await getSupportRequestById(requestId)
    if (!supportRequest) {
      return NextResponse.json(
        { error: "Support request not found" },
        { status: 404 }
      )
    }

    // Check if user is admin or the owner of the request
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Unable to get user information" },
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
    
    const { getUserByClerkId } = await import("@/lib/db")
    const dbUser = await getUserByClerkId(userId)
    const isDbAdmin = dbUser?.is_admin || false
    
    const isAdmin = hasAdminRole || emailIsAdmin || isDbAdmin
    const isOwner = supportRequest.clerk_id === userId

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden - You can only reply to your own requests or as an admin" },
        { status: 403 }
      )
    }

    // Create reply
    const reply = await addSupportReply({
      id: crypto.randomUUID(),
      support_request_id: requestId,
      message: message.trim(),
      from_admin: isAdmin,
      admin_email: isAdmin ? user.emailAddresses[0]?.emailAddress : undefined,
    })

    // Update status if provided
    if (status && ['open', 'closed', 'pending', 'in_progress'].includes(status)) {
      await updateSupportRequestStatus(requestId, status as 'open' | 'closed' | 'pending' | 'in_progress')
    }

    console.log(`[Support Reply] ${isAdmin ? 'Admin' : 'User'} replied to request ${requestId}`)

    // Serialize dates for JSON response
    const serializedReply = {
      ...reply,
      created_at: reply.created_at.toISOString(),
    }

    return NextResponse.json({
      success: true,
      message: "Reply added successfully",
      reply: serializedReply,
    })
  } catch (error: any) {
    console.error("Error adding support reply:", error)
    return NextResponse.json(
      { error: error.message || "Failed to add reply" },
      { status: 500 }
    )
  }
}

