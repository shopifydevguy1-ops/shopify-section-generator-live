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
      
      // Downgrade user plan immediately (or wait until period end - your choice)
      await updateUserPlan(user.id, "free")
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

