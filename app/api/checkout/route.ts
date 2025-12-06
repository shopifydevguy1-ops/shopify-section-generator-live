import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getPayMongoClient } from "@/lib/paymongo"
import { convertUSDToPHPCents } from "@/lib/currency"

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

    const paymongo = getPayMongoClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Pro plan: $20 USD per month
    const usdAmount = parseFloat(process.env.PRO_PLAN_USD_AMOUNT || "20")
    
    // Convert USD to PHP cents automatically based on current exchange rate
    const amount = await convertUSDToPHPCents(usdAmount)
    
    console.log(`[Checkout] Converting $${usdAmount} USD to ${amount} PHP cents (₱${(amount / 100).toFixed(2)})`)

    // Create PayMongo checkout session
    const session = await paymongo.createCheckoutSession({
      amount: amount,
      currency: "PHP",
      description: `Pro Plan - Monthly Subscription ($${usdAmount} USD)`,
      successUrl: `${appUrl}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/pricing`,
      metadata: {
        clerk_user_id: userId,
        plan: "pro",
        billing_period: "monthly",
        usd_amount: usdAmount.toString(),
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

