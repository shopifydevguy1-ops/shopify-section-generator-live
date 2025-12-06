import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { searchSections, loadAllSections } from "@/lib/section-lookup"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || ''

    // Load all sections once (can be cached in production)
    const allSections = loadAllSections()
    
    // Search sections
    const results = searchSections(query, allSections)
    
    return NextResponse.json({
      sections: results,
      count: results.length,
      query,
    })
  } catch (error: any) {
    console.error("Error searching sections:", error)
    return NextResponse.json(
      { error: error.message || "Failed to search sections" },
      { status: 500 }
    )
  }
}

