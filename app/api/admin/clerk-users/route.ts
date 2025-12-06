import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/nextjs/server"
import { getUserByClerkId, createUser } from "@/lib/db"

export async function GET() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if current user is admin
    const currentUser = await getUserByClerkId(userId)
    if (!currentUser || !currentUser.is_admin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }

    // Fetch all users from Clerk with pagination
    const clerk = clerkClient()
    let allClerkUsers: any[] = []
    let hasMore = true
    let offset = 0
    const limit = 500

    while (hasMore) {
      const response = await clerk.users.getUserList({
        limit,
        offset,
      })
      
      allClerkUsers = [...allClerkUsers, ...response.data]
      hasMore = response.data.length === limit
      offset += limit
    }

    // Sync Clerk users with database
    const syncedUsers = await Promise.all(
      allClerkUsers.map(async (clerkUser) => {
        const email = clerkUser.emailAddresses[0]?.emailAddress || ""
        const dbUser = await getUserByClerkId(clerkUser.id)
        
        // If user doesn't exist in DB, create them
        if (!dbUser) {
          const newUser = await createUser(clerkUser.id, email)
          return {
            ...newUser,
            clerkUser: {
              id: clerkUser.id,
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              imageUrl: clerkUser.imageUrl,
              createdAt: clerkUser.createdAt,
            }
          }
        }
        
        return {
          ...dbUser,
          clerkUser: {
            id: clerkUser.id,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl,
            createdAt: clerkUser.createdAt,
          }
        }
      })
    )

    return NextResponse.json({ users: syncedUsers })
  } catch (error: any) {
    console.error("Error fetching Clerk users:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 }
    )
  }
}

