import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { loadAllSections } from "@/lib/section-lookup"
import { getUserByClerkId, createUser } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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

    // Only Expert plan users and admins can access the full library
    if (dbUser.plan !== 'expert' && !dbUser.is_admin) {
      return NextResponse.json(
        { 
          error: "Full section library access is only available for Expert plan users. Upgrade to Expert to browse and download unlimited sections.",
          requiresExpert: true
        },
        { status: 403 }
      )
    }

    const sections = loadAllSections()
    
    return NextResponse.json({
      sections,
      count: sections.length,
    })
  } catch (error: any) {
    console.error("Error loading sections:", error)
    return NextResponse.json(
      { error: error.message || "Failed to load sections" },
      { status: 500 }
    )
  }
}

