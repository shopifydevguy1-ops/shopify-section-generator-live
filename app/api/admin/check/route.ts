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

    // Check Clerk roles (handle different metadata formats)
    const publicMeta = user.publicMetadata as Record<string, unknown> | undefined
    const privateMeta = user.privateMetadata as Record<string, unknown> | undefined
    const hasAdminRole = 
      publicMeta?.role === 'admin' || 
      (typeof publicMeta?.role === 'string' && publicMeta.role.toLowerCase() === 'admin') ||
      privateMeta?.role === 'admin' ||
      (typeof privateMeta?.role === 'string' && privateMeta.role.toLowerCase() === 'admin') ||
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

