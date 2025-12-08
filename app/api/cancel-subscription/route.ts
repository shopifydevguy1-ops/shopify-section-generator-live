import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getUserByClerkId, getSubscriptionByUserId, updateUserPlan, createOrUpdateSubscription } from "@/lib/db"

export const dynamic = 'force-dynamic'

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

    // Expert plan is a one-time payment, cannot be canceled
    if (user.plan === "expert") {
      redirect("/account?error=expert_plan_cannot_cancel")
    }

    const subscription = await getSubscriptionByUserId(user.id)
    
    if (subscription) {
      // Since PayMongo doesn't have native subscriptions, we'll mark it as canceled
      // The subscription will remain active until the current period ends
      await createOrUpdateSubscription({
        userId: user.id,
        paymongoPaymentId: subscription.paymongo_payment_id,
        paymongoPaymentIntentId: subscription.paymongo_payment_intent_id,
        status: "canceled",
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
      })
      
      // Keep user on pro plan - they'll lose access after subscription period ends
      // The canDownloadOrCopy function will check subscription status
      // No need to change plan - they stay on 'pro' but subscription is canceled
    }
    // If no subscription record exists, nothing to cancel

    redirect("/account?canceled=true")
  } catch (error: any) {
    console.error("Error canceling subscription:", error)
    redirect("/account?error=cancel_failed")
  }
}

