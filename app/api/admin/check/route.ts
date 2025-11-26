import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserByClerkId } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ isAdmin: false })
    }

    const user = await getUserByClerkId(userId)
    
    return NextResponse.json({
      isAdmin: user?.is_admin || false
    })
  } catch (error) {
    return NextResponse.json({ isAdmin: false })
  }
}

