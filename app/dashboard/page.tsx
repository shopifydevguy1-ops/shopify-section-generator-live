import { redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getUserUsageCount, getUserByClerkId, getSubscriptionByUserId } from "@/lib/db"
import { Zap, FileText, TrendingUp } from "lucide-react"

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

  const subscription = await getSubscriptionByUserId(dbUser.id)
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const usageCount = await getUserUsageCount(dbUser.id, currentMonth, currentYear)
  const maxUsage = dbUser.plan === "pro" ? Infinity : 5
  const remaining = dbUser.plan === "pro" ? "Unlimited" : Math.max(0, maxUsage - usageCount)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
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
              <Badge variant={dbUser.plan === "pro" ? "default" : "secondary"} className="mt-2">
                {dbUser.plan === "pro" ? "Pro Member" : "Free Plan"}
              </Badge>
              {dbUser.plan === "free" && (
                <Link href="/pricing" className="block mt-4">
                  <Button size="sm" className="w-full">Upgrade to Pro</Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usage This Month</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {dbUser.plan === "pro" 
                  ? "Unlimited generations" 
                  : `${remaining} remaining out of ${maxUsage}`}
              </p>
            </CardContent>
          </Card>

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
              <Link href="/account">
                <Button className="w-full" variant="outline">
                  Manage Account
                </Button>
              </Link>
              {dbUser.plan === "free" && (
                <Link href="/pricing">
                  <Button className="w-full">
                    Upgrade to Pro
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage Limit</CardTitle>
              <CardDescription>Your generation quota for this month</CardDescription>
            </CardHeader>
            <CardContent>
              {dbUser.plan === "pro" ? (
                <div className="text-center py-8">
                  <p className="text-2xl font-bold text-primary">Unlimited</p>
                  <p className="text-muted-foreground mt-2">You have unlimited generations</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Used</span>
                    <span>{usageCount} / {maxUsage}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (usageCount / maxUsage) * 100)}%` }}
                    />
                  </div>
                  {usageCount >= maxUsage && (
                    <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
                      <p className="text-sm text-destructive font-semibold">
                        You&apos;ve reached your monthly limit. Upgrade to Pro for unlimited generations.
                      </p>
                      <Link href="/pricing" className="block mt-2">
                        <Button size="sm">Upgrade Now</Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

