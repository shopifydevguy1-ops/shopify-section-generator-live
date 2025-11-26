import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { 
  getUserByClerkId, 
  getUserUsageCount, 
  logUsage
} from "@/lib/db"
import { generateSection, getTemplateById } from "@/lib/section-generator"

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
    const { templateId, customizations } = body

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      )
    }

    // Get user from database
    const user = await getUserByClerkId(userId)
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check usage limits for free plan
    if (user.plan === "free") {
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

    // Get template
    const template = getTemplateById(templateId)
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    // Generate section
    const liquidCode = generateSection(template, customizations || {})

    // Log usage
    await logUsage(user.id, template.type)

    return NextResponse.json({
      liquidCode,
      templateName: template.name,
    })
  } catch (error: any) {
    console.error("Error generating section:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate section" },
      { status: 500 }
    )
  }
}

