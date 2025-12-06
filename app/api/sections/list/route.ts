import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { loadAllSections } from "@/lib/section-lookup"

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

