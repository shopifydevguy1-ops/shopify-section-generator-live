import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { 
  getUserByClerkId, 
  updateUserPlan,
  createOrUpdateSubscription
} from "@/lib/db"
import { getPayMongoClient } from "@/lib/paymongo"

export const dynamic = 'force-dynamic'

const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get("x-paymongo-signature")

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: "Missing signature or webhook secret" },
        { status: 400 }
      )
    }

    const paymongo = getPayMongoClient()

    // Verify webhook signature
    const isValid = paymongo.verifyWebhookSignature(body, signature, webhookSecret)
    if (!isValid) {
      console.error("Webhook signature verification failed")
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      )
    }

    const event = JSON.parse(body)

    // Handle PayMongo webhook events
    // PayMongo sends events with structure: { data: { type: "event", attributes: { type: "payment.paid", data: {...} } } }
    const eventType = event.data?.attributes?.type
    const eventData = event.data?.attributes?.data

    if (!eventType || !eventData) {
      console.log("Invalid webhook event structure")
      return NextResponse.json({ received: true })
    }

    switch (eventType) {
      case "payment.paid": {
        // Payment was successful
        const metadata = eventData.attributes?.metadata || {}
        const clerkUserId = metadata.clerk_user_id

        if (clerkUserId) {
          const user = await getUserByClerkId(clerkUserId)
          if (user) {
            await updateUserPlan(user.id, "pro")
            
            // Create or update subscription record
            // Since PayMongo doesn't have native subscriptions, we'll track manually
            const now = new Date()
            const nextMonth = new Date(now)
            nextMonth.setMonth(nextMonth.getMonth() + 1)

            await createOrUpdateSubscription({
              userId: user.id,
              paymongoPaymentId: eventData.id,
              paymongoPaymentIntentId: eventData.attributes?.payment_intent?.id || null,
              status: "active",
              currentPeriodStart: now,
              currentPeriodEnd: nextMonth,
            })

            console.log(`User ${clerkUserId} upgraded to Pro`)
          }
        }
        break
      }

      case "payment.failed": {
        // Payment failed - you might want to notify the user
        const metadata = eventData.attributes?.metadata || {}
        const clerkUserId = metadata.clerk_user_id

        if (clerkUserId) {
          console.log(`Payment failed for user ${clerkUserId}`)
          // Optionally downgrade or notify user
        }
        break
      }

      case "payment.refunded": {
        // Payment was refunded - downgrade user
        const metadata = eventData.attributes?.metadata || {}
        const clerkUserId = metadata.clerk_user_id

        if (clerkUserId) {
          const user = await getUserByClerkId(clerkUserId)
          if (user) {
            await updateUserPlan(user.id, "free")
            console.log(`User ${clerkUserId} downgraded to Free (refunded)`)
          }
        }
        break
      }

      default:
        console.log(`Unhandled PayMongo event type: ${eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: error.message || "Webhook handler failed" },
      { status: 500 }
    )
  }
}

