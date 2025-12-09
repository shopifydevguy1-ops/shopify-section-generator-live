import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getUserByClerkId, hasDeviceUsedTrial } from "@/lib/db"
import { headers } from "next/headers"

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
    const { fingerprintHash } = body

    // Get IP address
    const headersList = await headers()
    const forwarded = headersList.get('x-forwarded-for')
    const realIP = headersList.get('x-real-ip')
    const cfConnectingIP = headersList.get('cf-connecting-ip')
    const ipAddress = forwarded?.split(',')[0]?.trim() || realIP?.trim() || cfConnectingIP?.trim()

    // Get user info
    const dbUser = await getUserByClerkId(userId)
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if device has used trial
    const trialCheck = await hasDeviceUsedTrial(fingerprintHash, ipAddress)

    // Get device fingerprint records for this device
    const { queryDb } = await import("@/lib/db-connection")
    let deviceRecords: any[] = []
    if (fingerprintHash) {
      const deviceResult = await queryDb(
        `SELECT 
          df.fingerprint_hash,
          df.user_id,
          df.ip_address,
          df.created_at,
          u.email,
          u.plan,
          u.created_at as user_created_at
         FROM device_fingerprints df
         JOIN users u ON df.user_id = u.id
         WHERE df.fingerprint_hash = $1
         ORDER BY df.created_at DESC`,
        [fingerprintHash]
      )
      if (deviceResult && deviceResult.rows) {
        deviceRecords = deviceResult.rows
      }
    }

    // Get IP records
    let ipRecords: any[] = []
    if (ipAddress) {
      const ipResult = await queryDb(
        `SELECT DISTINCT
          ll.ip_address,
          ll.user_id,
          ll.email,
          u.plan,
          u.created_at as user_created_at
         FROM login_logs ll
         JOIN users u ON ll.user_id = u.id
         WHERE ll.ip_address = $1
         ORDER BY u.created_at DESC`,
        [ipAddress]
      )
      if (ipResult && ipResult.rows) {
        ipRecords = ipResult.rows
      }
    }

    return NextResponse.json({
      currentUser: {
        id: dbUser.id,
        email: dbUser.email,
        plan: dbUser.plan,
        created_at: dbUser.created_at.toISOString(),
      },
      fingerprint: fingerprintHash || null,
      ipAddress: ipAddress || null,
      trialCheck,
      deviceRecords: deviceRecords.map(r => ({
        fingerprint_hash: r.fingerprint_hash,
        user_id: r.user_id,
        email: r.email,
        plan: r.plan,
        user_created_at: r.user_created_at.toISOString(),
        device_created_at: r.created_at.toISOString(),
        ip_address: r.ip_address,
      })),
      ipRecords: ipRecords.map(r => ({
        ip_address: r.ip_address,
        user_id: r.user_id,
        email: r.email,
        plan: r.plan,
        user_created_at: r.user_created_at.toISOString(),
      })),
      summary: {
        accountsOnSameDevice: deviceRecords.length,
        accountsOnSameIP: ipRecords.length,
        hasUsedTrial: trialCheck.hasUsedTrial,
        reason: trialCheck.reason,
      },
    })
  } catch (error: any) {
    console.error("Error checking trial status:", error)
    return NextResponse.json(
      { error: error.message || "Failed to check trial status" },
      { status: 500 }
    )
  }
}

