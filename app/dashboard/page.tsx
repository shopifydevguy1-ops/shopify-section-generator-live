import { redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs/server"
import { Navbar } from "@/components/navbar"
import { DashboardBackground } from "@/components/dashboard-background"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getUserUsageCount, getUserByClerkId, getSubscriptionByUserId } from "@/lib/db"
import { Zap, TrendingUp } from "lucide-react"
import { TrackLogin } from "@/components/track-login"
import { DashboardUsageLive } from "@/components/dashboard-usage-live"
import { DashboardUsageLimitLive } from "@/components/dashboard-usage-limit-live"

export default async function DashboardPage() {
  const { userId } = auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  const user = await currentUser()
  
  if (!user) {
    redirect("/sign-in")
  }

  // Get user data from database
  const dbUser = await getUserByClerkId(user.id)
  if (!dbUser) {
    // Create user if doesn't exist
    const { createUser } = await import("@/lib/db")
    await createUser(user.id, user.emailAddresses[0]?.emailAddress || "")
    redirect("/dashboard")
  }

  // Ensure admin users have expert plan
  if (dbUser.is_admin && dbUser.plan !== "expert") {
    const { updateUserPlan } = await import("@/lib/db")
    await updateUserPlan(dbUser.id, "expert")
    dbUser.plan = "expert"
  }

  const subscription = await getSubscriptionByUserId(dbUser.id)
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  // Only count downloads/copies - generation/search is unlimited
  const usageCount = await getUserUsageCount(dbUser.id, currentMonth, currentYear)
  // Determine limits based on plan (for copy/download only)
  // Import function to check if user is in first month
  const { isUserInFirstMonth } = await import("@/lib/db")
  const inFirstMonth = await isUserInFirstMonth(dbUser.id)
  const hasActiveSubscription = subscription?.status === 'active'
  
  let maxUsage: number | string
  let remaining: number | string
  if (dbUser.plan === "expert" || dbUser.is_admin) {
    maxUsage = "Unlimited"
    remaining = "Unlimited"
  } else if (dbUser.plan === "pro") {
    // Pro users in first month without subscription get 20, otherwise 50 with subscription
    if (inFirstMonth && !hasActiveSubscription) {
      maxUsage = 20
      remaining = Math.max(0, maxUsage - usageCount)
    } else if (hasActiveSubscription) {
      maxUsage = 50
      remaining = Math.max(0, maxUsage - usageCount)
    } else {
      // Trial ended, no subscription
      maxUsage = 0
      remaining = 0
    }
  } else {
    // Legacy free plan (shouldn't happen for new users)
    maxUsage = 5
    remaining = Math.max(0, maxUsage - usageCount)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] relative">
      <TrackLogin />
      <DashboardBackground />
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{dbUser.plan}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge 
                  variant={
                    dbUser.plan === "expert" ? "default" : 
                    dbUser.plan === "pro" ? "default" : 
                    "secondary"
                  }
                >
                  {dbUser.plan === "expert" ? "Expert Member" : 
                   dbUser.plan === "pro" ? "Pro Member" : 
                   "Pro Member"}
                </Badge>
                {dbUser.is_admin && (
                  <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
                    Admin
                  </Badge>
                )}
              </div>
              {dbUser.plan === "pro" && !dbUser.is_admin && (
                <>
                  {subscription?.status === "active" ? (
                    <Link href="/pricing" className="block mt-4">
                      <Button size="sm" className="w-full">Upgrade to Expert</Button>
                    </Link>
                  ) : inFirstMonth ? (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-2">
                        Free trial: {maxUsage === "Unlimited" ? "Unlimited" : `${remaining} of ${maxUsage} remaining`}
                      </p>
                      <Link href="/api/checkout" className="block">
                        <Button size="sm" className="w-full" variant="outline">
                          Subscribe Early (Optional)
                        </Button>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Enjoy your free trial. Subscribe anytime to continue.
                      </p>
                    </div>
                  ) : (
                    <Link href="/api/checkout" className="block mt-4">
                      <Button size="sm" className="w-full">Subscribe to Pro</Button>
                    </Link>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <DashboardUsageLive 
            initialUsageCount={usageCount}
            plan={dbUser.plan}
            isAdmin={dbUser.is_admin}
          />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscription Status</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subscription?.status === "active" ? "Active" : "Inactive"}
              </div>
              {subscription?.current_period_end && (
                <p className="text-xs text-muted-foreground mt-1">
                  Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with these actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/generator">
                <Button className="w-full" variant="outline">
                  Generate New Section
                </Button>
              </Link>
              {(dbUser.plan === "expert" || dbUser.is_admin) && (
                <Link href="/sections">
                  <Button className="w-full" variant="outline">
                    Browse Section Library
                  </Button>
                </Link>
              )}
              <Link href="/account">
                <Button className="w-full" variant="outline">
                  Manage Account
                </Button>
              </Link>
              {dbUser.is_admin && (
                <Link href="/admin">
                  <Button className="w-full" variant="default">
                    Admin Dashboard
                  </Button>
                </Link>
              )}
              {dbUser.plan === "pro" && !dbUser.is_admin && (
                <>
                  {subscription?.status === "active" ? (
                    <Link href="/pricing">
                      <Button className="w-full">
                        Upgrade to Expert
                      </Button>
                    </Link>
                  ) : inFirstMonth ? (
                    <Link href="/api/checkout">
                      <Button className="w-full" variant="outline">
                        Subscribe Early (Optional)
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/api/checkout">
                      <Button className="w-full">
                        Subscribe to Pro
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <DashboardUsageLimitLive 
            initialUsageCount={usageCount}
            plan={dbUser.plan}
            isAdmin={dbUser.is_admin}
          />
        </div>
      </main>
    </div>
  )
}

