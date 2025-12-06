import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getPayMongoClient } from "@/lib/paymongo"
import { convertUSDToPHPCents } from "@/lib/currency"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
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

    // Get plan from query parameter (defaults to 'pro' for backward compatibility)
    const { searchParams } = new URL(request.url)
    const planParam = searchParams.get('plan') || 'pro'
    const plan = planParam === 'expert' ? 'expert' : 'pro'

    // Get pricing based on plan
    let usdAmount: number
    let planName: string
    
    if (plan === 'expert') {
      usdAmount = parseFloat(process.env.EXPERT_PLAN_USD_AMOUNT || "125")
      planName = "Expert"
    } else {
      usdAmount = parseFloat(process.env.PRO_PLAN_USD_AMOUNT || "20")
      planName = "Pro"
    }
    
    // Convert USD to PHP cents automatically based on current exchange rate
    const amount = await convertUSDToPHPCents(usdAmount)
    
    const isOneTimePayment = plan === 'expert'
    const description = isOneTimePayment 
      ? `${planName} Plan - One-Time Payment ($${usdAmount} USD)`
      : `${planName} Plan - Monthly Subscription ($${usdAmount} USD)`
    
    console.log(`[Checkout] Converting $${usdAmount} USD to ${amount} PHP cents (₱${(amount / 100).toFixed(2)}) for ${planName} plan (${isOneTimePayment ? 'one-time' : 'monthly'})`)

    // Create PayMongo checkout session
    const session = await paymongo.createCheckoutSession({
      amount: amount,
      currency: "PHP",
      description: description,
      successUrl: `${appUrl}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/pricing`,
      metadata: {
        clerk_user_id: userId,
        plan: plan,
        billing_period: isOneTimePayment ? "lifetime" : "monthly",
        usd_amount: usdAmount.toString(),
        is_one_time: isOneTimePayment.toString(),
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

