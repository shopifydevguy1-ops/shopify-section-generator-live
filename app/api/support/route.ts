import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getUserByClerkId, createUser } from "@/lib/db"

// In-memory store for support requests (in production, use a database)
let supportRequests: Array<{
  id: string
  user_id: string
  clerk_id: string
  email: string
  subject: string
  message: string
  created_at: Date
  status: 'open' | 'closed' | 'in_progress'
}> = []

export async function POST(request: Request) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { subject, message } = body

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      )
    }

    // Get user from database, create if doesn't exist
    let dbUser = await getUserByClerkId(userId)
    if (!dbUser) {
      const clerkUser = await currentUser()
      if (!clerkUser) {
        return NextResponse.json(
          { error: "Unable to get user information" },
          { status: 401 }
        )
      }
      const email = clerkUser.emailAddresses[0]?.emailAddress || ""
      dbUser = await createUser(userId, email)
    }

    // Get Clerk user for email
    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses[0]?.emailAddress || dbUser.email

    // Create support request
    const supportRequest = {
      id: crypto.randomUUID(),
      user_id: dbUser.id,
      clerk_id: userId,
      email,
      subject: subject.trim(),
      message: message.trim(),
      created_at: new Date(),
      status: 'open' as const,
    }

    supportRequests.push(supportRequest)

    console.log(`[Support] New support request from ${email}: ${subject}`)

    // In production, you could:
    // 1. Send email to admins using a service like SendGrid, Resend, or Nodemailer
    // 2. Store in a database
    // 3. Create a ticket in a support system like Zendesk

    return NextResponse.json({
      success: true,
      message: "Support request submitted successfully",
      requestId: supportRequest.id,
    })
  } catch (error: any) {
    console.error("Error submitting support request:", error)
    return NextResponse.json(
      { error: error.message || "Failed to submit support request" },
      { status: 500 }
    )
  }
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

    // Check if user is admin
    const { getUserByClerkId } = await import("@/lib/db")
    const { currentUser } = await import("@clerk/nextjs/server")
    
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
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
    
    const dbUser = await getUserByClerkId(userId)
    const isDbAdmin = dbUser?.is_admin || false
    
    const isAdmin = hasAdminRole || emailIsAdmin || isDbAdmin
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    // Return all support requests (sorted by newest first)
    const sortedRequests = [...supportRequests].sort(
      (a, b) => b.created_at.getTime() - a.created_at.getTime()
    )

    return NextResponse.json({
      requests: sortedRequests,
      total: sortedRequests.length,
      open: sortedRequests.filter(r => r.status === 'open').length,
    })
  } catch (error: any) {
    console.error("Error fetching support requests:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch support requests" },
      { status: 500 }
    )
  }
}

// Export supportRequests for admin page access
export { supportRequests }

