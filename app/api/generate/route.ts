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

    // No limit checking for generation/search - limits only apply to copy/download
    // Expert plan and admins have unlimited - no check needed

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
        mobileImage: section.mobileImage,
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

    // Don't log usage for generation/search - limits only apply to copy/download
    // This allows users to search/browse unlimited sections

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

