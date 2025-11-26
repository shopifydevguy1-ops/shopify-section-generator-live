import { NextResponse } from "next/server"
import { loadSectionTemplates } from "@/lib/section-generator"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const templates = loadSectionTemplates()
    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error("Error loading templates:", error)
    return NextResponse.json(
      { error: "Failed to load templates" },
      { status: 500 }
    )
  }
}

