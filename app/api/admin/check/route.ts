import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getUserByClerkId } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ isAdmin: false })
    }

    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ isAdmin: false })
    }

    // Check Clerk roles
    const hasAdminRole = user.publicMetadata?.role === 'admin' || 
                         user.privateMetadata?.role === 'admin' ||
                         user.organizationMemberships?.some(org => org.role === 'org:admin')
    
    // Check ADMIN_EMAILS
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
    const emailIsAdmin = adminEmails.includes(user.emailAddresses[0]?.emailAddress?.toLowerCase() || '')
    
    // Check database
    const dbUser = await getUserByClerkId(userId)
    const isDbAdmin = dbUser?.is_admin || false
    
    const isAdmin = hasAdminRole || emailIsAdmin || isDbAdmin
    
    return NextResponse.json({
      isAdmin
    })
  } catch (error) {
    return NextResponse.json({ isAdmin: false })
  }
}

