import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserByClerkId, getSupportRequestsByUserId } from "@/lib/db"

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

    // Get user from database
    const dbUser = await getUserByClerkId(userId)
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Get user's support requests
    const requests = getSupportRequestsByUserId(dbUser.id)
    const sortedRequests = requests.sort(
      (a, b) => b.created_at.getTime() - a.created_at.getTime()
    )

    return NextResponse.json({
      requests: sortedRequests,
      total: sortedRequests.length,
    })
  } catch (error: any) {
    console.error("Error fetching user support requests:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch support requests" },
      { status: 500 }
    )
  }
}

