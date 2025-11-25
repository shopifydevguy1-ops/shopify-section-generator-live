import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import Stripe from "stripe"
import { getUserByClerkId, getSubscriptionByUserId, updateUserPlan } from "@/lib/db"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20.acacia",
})

export async function POST() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      redirect("/sign-in")
    }

    const user = await getUserByClerkId(userId)
    if (!user) {
      redirect("/sign-in")
    }

    const subscription = await getSubscriptionByUserId(user.id)
    
    if (subscription?.stripe_subscription_id) {
      // Cancel the subscription at period end
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      })
    } else {
      // If no subscription record, just update user plan
      await updateUserPlan(user.id, "free")
    }

    redirect("/account?canceled=true")
  } catch (error: any) {
    console.error("Error canceling subscription:", error)
    redirect("/account?error=cancel_failed")
  }
}

