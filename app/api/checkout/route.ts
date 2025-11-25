import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20.acacia",
})

export async function GET() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price ID not configured" },
        { status: 500 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: undefined, // Clerk handles email
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${appUrl}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      metadata: {
        clerk_user_id: userId,
      },
    })

    if (session.url) {
      return NextResponse.redirect(session.url)
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

