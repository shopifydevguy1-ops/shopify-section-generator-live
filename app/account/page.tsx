import { redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getUserByClerkId, getSubscriptionByUserId } from "@/lib/db"
import { CreditCard, Settings, User } from "lucide-react"
import { AccountProfileCard } from "@/components/account/account-profile-card"
import { UserMessages } from "@/components/account/user-messages"

export default async function AccountPage() {
  const { userId } = auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  const user = await currentUser()
  
  if (!user) {
    redirect("/sign-in")
  }

  const dbUser = await getUserByClerkId(user.id)
  if (!dbUser) {
    redirect("/dashboard")
  }

  const subscription = await getSubscriptionByUserId(dbUser.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account and subscription</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          <AccountProfileCard
            user={{
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.emailAddresses[0]?.emailAddress || "",
              id: user.id,
            }}
          />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <CardTitle>Subscription</CardTitle>
              </div>
              <CardDescription>Manage your subscription plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={dbUser.plan === "pro" ? "default" : "secondary"}>
                    {dbUser.plan === "pro" ? "Pro" : "Free"}
                  </Badge>
                </div>
              </div>

              {subscription && (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <p className="text-sm capitalize">{subscription.status}</p>
                  </div>
                  {subscription.current_period_end && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {subscription.status === "active" ? "Renews" : "Expires"}
                      </p>
                      <p className="text-sm">
                        {new Date(subscription.current_period_end).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </>
              )}

              {dbUser.plan === "free" ? (
                <Link href="/pricing">
                  <Button className="w-full">Upgrade to Pro</Button>
                </Link>
              ) : subscription?.status === "active" ? (
                <form action="/api/cancel-subscription" method="POST">
                  <Button type="submit" variant="destructive" className="w-full">
                    Cancel Subscription
                  </Button>
                </form>
              ) : (
                <Link href="/api/checkout">
                  <Button className="w-full">Reactivate Subscription</Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <CardTitle>Settings</CardTitle>
              </div>
              <CardDescription>Additional account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/generator">
                <Button variant="outline" className="w-full">
                  Section Generator
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Support Messages */}
        <div className="mt-6 max-w-4xl">
          <UserMessages />
        </div>
      </main>
    </div>
  )
}

