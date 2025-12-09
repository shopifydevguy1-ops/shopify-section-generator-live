import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getUserByClerkId, createUser, getAllSupportRequests, addSupportRequest } from "@/lib/db"

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
    const { subject, message, category, urgency } = body

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['Error', 'Custom Section', 'Suggestion']
    const ticketCategory = validCategories.includes(category) ? category : 'Error'

    // Validate urgency
    const validUrgencies = ['low', 'medium', 'high', 'critical']
    const ticketUrgency = validUrgencies.includes(urgency) ? urgency : 'medium'

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
    const supportRequest = await addSupportRequest({
      id: crypto.randomUUID(),
      user_id: dbUser.id,
      clerk_id: userId,
      email,
      subject: subject.trim(),
      message: message.trim(),
      category: ticketCategory as 'Error' | 'Custom Section' | 'Suggestion',
      urgency: ticketUrgency as 'low' | 'medium' | 'high' | 'critical',
      status: 'open',
      created_at: new Date(),
    })

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

    // Return all support requests (already sorted by newest first from database)
    const allRequests = await getAllSupportRequests()

    // Serialize dates for JSON response
    const serializedRequests = allRequests.map(req => ({
      ...req,
      created_at: req.created_at.toISOString(),
      updated_at: req.updated_at.toISOString(),
      replies: req.replies?.map(reply => ({
        ...reply,
        created_at: reply.created_at.toISOString(),
      })),
    }))

    return NextResponse.json({
      requests: serializedRequests,
      total: serializedRequests.length,
      open: serializedRequests.filter(r => r.status === 'open').length,
      pending: serializedRequests.filter(r => r.status === 'pending').length,
      in_progress: serializedRequests.filter(r => r.status === 'in_progress').length,
      closed: serializedRequests.filter(r => r.status === 'closed').length,
    })
  } catch (error: any) {
    console.error("Error fetching support requests:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch support requests" },
      { status: 500 }
    )
  }
}

