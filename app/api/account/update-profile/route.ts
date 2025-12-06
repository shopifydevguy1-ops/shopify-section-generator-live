import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { getUserByClerkId, createUser } from "@/lib/db"

export async function PATCH(request: Request) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, email, password } = body

    const clerk = clerkClient()
    
    // Get current user
    const currentUser = await clerk.users.getUser(userId)
    
    // Prepare update data
    const updateData: any = {}
    
    // Update name if provided
    if (firstName !== undefined || lastName !== undefined) {
      updateData.firstName = firstName || ""
      updateData.lastName = lastName || ""
    }

    // Update password if provided
    if (password !== undefined && password.length > 0) {
      updateData.password = password
    }

    // Update user in Clerk
    if (Object.keys(updateData).length > 0) {
      await clerk.users.updateUser(userId, updateData)
    }

    // Handle email update separately (more complex)
    if (email !== undefined && email !== currentUser.emailAddresses[0]?.emailAddress) {
      try {
        // Check if email already exists for this user
        const existingEmail = currentUser.emailAddresses.find(e => e.emailAddress === email)
        
        if (existingEmail) {
          // Email already exists, just set it as primary
          await clerk.users.updateUser(userId, {
            primaryEmailAddressID: existingEmail.id,
          })
        } else {
          // Create new email address
          const newEmailAddress = await clerk.emailAddresses.createEmailAddress({
            userId,
            emailAddress: email,
          })
          
          // Set new email as primary
          await clerk.users.updateUser(userId, {
            primaryEmailAddressID: newEmailAddress.id,
          })
        }
      } catch (error: any) {
        // If email already exists for another user or other error
        console.error("Error updating email:", error)
        throw new Error("Failed to update email. It may already be in use by another account.")
      }
    }

    // Sync with database
    const dbUser = await getUserByClerkId(userId)
    const updatedClerkUser = await clerk.users.getUser(userId)
    const updatedEmail = updatedClerkUser.emailAddresses[0]?.emailAddress || ""
    
    if (dbUser) {
      // Update email in database if it changed
      if (dbUser.email !== updatedEmail) {
        const { updateUserEmail } = await import("@/lib/db")
        await updateUserEmail(dbUser.id, updatedEmail)
      }
    } else {
      // Create user in database if doesn't exist
      await createUser(userId, updatedEmail)
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    })
  } catch (error: any) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    )
  }
}

