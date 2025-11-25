import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { getPayMongoClient } from "@/lib/paymongo"

export async function GET() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const paymongo = getPayMongoClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Pro plan: $20/month = ₱20.00 (or adjust based on your pricing)
    // Amount in cents: 2000 = ₱20.00
    const amount = parseInt(process.env.PAYMONGO_PRO_AMOUNT || "2000") // Default ₱20.00

    // Create PayMongo checkout session
    const session = await paymongo.createCheckoutSession({
      amount: amount,
      currency: "PHP",
      description: "Pro Plan - Monthly Subscription",
      successUrl: `${appUrl}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/pricing`,
      metadata: {
        clerk_user_id: userId,
        plan: "pro",
        billing_period: "monthly",
      },
    })

    if (session.data?.attributes?.checkout_url) {
      return NextResponse.redirect(session.data.attributes.checkout_url)
    }
    
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  } catch (error: any) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    )
  }
}

