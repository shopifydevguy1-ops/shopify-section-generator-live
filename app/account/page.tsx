import { redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getUserByClerkId, getSubscriptionByUserId, isUserInFirstMonth } from "@/lib/db"
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
  const inFirstMonth = await isUserInFirstMonth(dbUser.id)
  const hasActiveSubscription = subscription?.status === 'active'

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
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge 
                    variant={
                      dbUser.plan === "expert" ? "default" : 
                      dbUser.plan === "pro" ? "default" : 
                      "secondary"
                    }
                  >
                    {dbUser.plan === "expert" ? "Expert" : 
                     dbUser.plan === "pro" ? "Pro" : 
                     "Pro"}
                  </Badge>
                  {dbUser.is_admin && (
                    <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
                      Admin
                    </Badge>
                  )}
                </div>
                {dbUser.is_admin && (
                  <p className="text-xs text-muted-foreground mt-2">
                    As an admin, you have unlimited access to all features including the full section library.
                  </p>
                )}
              </div>

              {dbUser.plan === "pro" && inFirstMonth && !hasActiveSubscription && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-md mb-4">
                  <p className="text-sm font-semibold text-primary">Free Trial Active</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You&apos;re in your first month with 10 free sections. Subscribe to continue after the trial ends.
                  </p>
                </div>
              )}
              {subscription && (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <p className="text-sm capitalize">{subscription.status}</p>
                  </div>
                  {subscription.current_period_end && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {dbUser.plan === "expert" 
                          ? "Access Type" 
                          : subscription.status === "active" 
                          ? "Renews" 
                          : "Expires"}
                      </p>
                      <p className="text-sm">
                        {dbUser.plan === "expert" 
                          ? "Lifetime Access" 
                          : new Date(subscription.current_period_end).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </>
              )}
              {dbUser.plan === "pro" && !inFirstMonth && !hasActiveSubscription && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md mb-4">
                  <p className="text-sm font-semibold text-destructive">Trial Ended</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your free trial has ended. Subscribe to continue using Pro features.
                  </p>
                </div>
              )}

              {dbUser.plan === "pro" ? (
                subscription?.status === "active" ? (
                  <>
                    <Link href="/pricing">
                      <Button className="w-full" variant="outline">Upgrade to Expert</Button>
                    </Link>
                    <form action="/api/cancel-subscription" method="POST" className="mt-2">
                      <Button type="submit" variant="destructive" className="w-full" size="sm">
                        Cancel Subscription
                      </Button>
                    </form>
                  </>
                ) : inFirstMonth ? (
                  <>
                    <Link href="/api/checkout">
                      <Button className="w-full" variant="outline">
                        Subscribe Early (Optional)
                      </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      You&apos;re in your free trial. Subscribe anytime to continue after trial ends.
                    </p>
                  </>
                ) : (
                  <Link href="/api/checkout">
                    <Button className="w-full">Subscribe to Pro</Button>
                  </Link>
                )
              ) : dbUser.plan === "expert" ? (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    You have lifetime access to Expert features. No subscription needed.
                  </p>
                </div>
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
              {(dbUser.plan === "expert" || dbUser.is_admin) && (
                <Link href="/sections">
                  <Button variant="outline" className="w-full">
                    Browse Section Library
                  </Button>
                </Link>
              )}
              {dbUser.is_admin && (
                <Link href="/admin">
                  <Button variant="default" className="w-full">
                    Admin Dashboard
                  </Button>
                </Link>
              )}
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

