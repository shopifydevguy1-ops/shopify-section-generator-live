import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { 
  getUserByClerkId, 
  getUserUsageCount, 
  logUsage,
  createUser
} from "@/lib/db"
import { searchSections, loadAllSections } from "@/lib/section-lookup"

export const dynamic = 'force-dynamic'

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
    const { sectionInput, excludedSectionIds } = body

    if (!sectionInput || !sectionInput.trim()) {
      return NextResponse.json(
        { error: "Section input is required" },
        { status: 400 }
      )
    }

    // Get user from database, create if doesn't exist
    let user = await getUserByClerkId(userId)
    if (!user) {
      // Create user if doesn't exist
      const clerkUser = await currentUser()
      if (!clerkUser) {
        return NextResponse.json(
          { error: "Unable to get user information" },
          { status: 401 }
        )
      }
      const email = clerkUser.emailAddresses[0]?.emailAddress || ""
      user = await createUser(userId, email)
    }

    // Check usage limits for free plan (admins have unlimited)
    if (user.plan === "free" && !user.is_admin) {
      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()
      const usageCount = await getUserUsageCount(user.id, currentMonth, currentYear)
      
      if (usageCount >= 5) {
        return NextResponse.json(
          { 
            error: "You've reached your monthly limit of 5 generations. Please upgrade to Pro for unlimited generations.",
            limitReached: true
          },
          { status: 403 }
        )
      }
    }

    // Search sections from /sections folder (NO AI generation)
    console.log(`[API] Searching sections from /sections folder for input: "${sectionInput}"`)
    
    let results
    try {
      // Load all sections and search
      const allSections = loadAllSections()
      const searchResults = searchSections(sectionInput, allSections)
      
      // Limit to 6 results and map to expected format
      results = searchResults.slice(0, 6).map(section => ({
        liquidCode: section.liquidCode,
        sectionId: section.filename.replace(/\.liquid$/, ''),
        previewImage: section.previewImage,
        name: section.name,
        description: section.description || `Section: ${section.name}`,
      }))
      
      console.log(`[API] Found ${results.length} sections from /sections folder`)
    } catch (error: any) {
      console.error("[API] Section search error:", error)
      return NextResponse.json(
        { error: error.message || "Failed to search sections. Please try again." },
        { status: 500 }
      )
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: `No sections found matching "${sectionInput}". Try different keywords like "hero", "banner", "testimonial", etc.` },
        { status: 404 }
      )
    }

    // Log usage (use "custom" as type for section lookups)
    // Important: Use database user.id, not Clerk userId
    console.log(`[API Generate] Logging usage for user.id: ${user.id}, clerk_id: ${userId}`)
    await logUsage(user.id, "custom")

    return NextResponse.json({
      sections: results,
    })
  } catch (error: any) {
    console.error("Error generating section:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate section" },
      { status: 500 }
    )
  }
}

