import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getUserByClerkId, createUser, logLogin } from "@/lib/db"
import { headers } from "next/headers"

export async function POST(request: Request) {
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

    // Get IP address from headers
    const headersList = await headers()
    const forwarded = headersList.get('x-forwarded-for')
    const realIP = headersList.get('x-real-ip')
    const cfConnectingIP = headersList.get('cf-connecting-ip')
    const ipAddress = forwarded?.split(',')[0]?.trim() || realIP?.trim() || cfConnectingIP?.trim()

    // Log login
    await logLogin(dbUser.id, userId, dbUser.email, ipAddress)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error tracking login:", error)
    return NextResponse.json(
      { error: error.message || "Failed to track login" },
      { status: 500 }
    )
  }
}

