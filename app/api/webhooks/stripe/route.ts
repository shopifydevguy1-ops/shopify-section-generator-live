import { NextResponse } from "next/server"
import Stripe from "stripe"
import { headers } from "next/headers"
import { 
  getUserByClerkId, 
  getSubscriptionByUserId,
  updateUserPlan 
} from "@/lib/db"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20.acacia",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get("stripe-signature")

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: "Missing signature or webhook secret" },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message)
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const clerkUserId = session.metadata?.clerk_user_id

        if (clerkUserId) {
          const user = await getUserByClerkId(clerkUserId)
          if (user) {
            await updateUserPlan(user.id, "pro")
            
            // Create or update subscription record
            // In production, you'd save this to your database
            console.log(`User ${clerkUserId} upgraded to Pro`)
          }
        }
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        // Get customer to find clerk user ID
        const customer = await stripe.customers.retrieve(customerId)
        if (!customer.deleted && "metadata" in customer) {
          const clerkUserId = customer.metadata?.clerk_user_id
          
          if (clerkUserId) {
            const user = await getUserByClerkId(clerkUserId)
            if (user) {
              await updateUserPlan(user.id, "pro")
              console.log(`Subscription updated for user ${clerkUserId}`)
            }
          }
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        const customer = await stripe.customers.retrieve(customerId)
        if (!customer.deleted && "metadata" in customer) {
          const clerkUserId = customer.metadata?.clerk_user_id
          
          if (clerkUserId) {
            const user = await getUserByClerkId(clerkUserId)
            if (user) {
              await updateUserPlan(user.id, "free")
              console.log(`Subscription canceled for user ${clerkUserId}`)
            }
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
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

