import { redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserByClerkId, getUserStats, getAllUsers, getAllSubscriptions, getAllUsageLogs } from "@/lib/db"
import { Users, UserCheck, CreditCard, FileText, TrendingUp, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { UsersTable } from "@/components/admin/users-table"
import { SyncUsersButton } from "@/components/admin/sync-users-button"
import { SupportRequests } from "@/components/admin/support-requests"
import { RecentUsersLive } from "@/components/admin/recent-users-live"
import { RecentActivityLive } from "@/components/admin/recent-activity-live"

export default async function AdminPage() {
  const { userId } = auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  const user = await currentUser()
  if (!user) {
    redirect("/sign-in")
  }

  // Check if user is admin via Clerk roles (handle different metadata formats)
  const publicMeta = user.publicMetadata as Record<string, unknown> | undefined
  const privateMeta = user.privateMetadata as Record<string, unknown> | undefined
  const hasAdminRole = 
    publicMeta?.role === 'admin' || 
    (typeof publicMeta?.role === 'string' && publicMeta.role.toLowerCase() === 'admin') ||
    privateMeta?.role === 'admin' ||
    (typeof privateMeta?.role === 'string' && privateMeta.role.toLowerCase() === 'admin')
  
  // Check if user is admin via ADMIN_EMAILS environment variable
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
  const emailIsAdmin = adminEmails.includes(user.emailAddresses[0]?.emailAddress?.toLowerCase() || '')
  
  // Check database admin status
  const dbUser = await getUserByClerkId(user.id)
  const isDbAdmin = dbUser?.is_admin || false
  
  // Debug logging (remove in production)
  console.log('Admin check:', {
    userId: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    publicMetadata: publicMeta,
    privateMetadata: privateMeta,
    hasAdminRole,
    emailIsAdmin,
    isDbAdmin
  })
  
  // User is admin if they have admin role in Clerk OR email is in ADMIN_EMAILS OR marked as admin in DB
  const isAdmin = hasAdminRole || emailIsAdmin || isDbAdmin
  
  if (!isAdmin) {
    redirect("/dashboard")
  }
  
  // If user should be admin but isn't marked in DB, update it
  if ((hasAdminRole || emailIsAdmin) && dbUser && !dbUser.is_admin) {
    const { updateUserAdminStatus } = await import("@/lib/db")
    await updateUserAdminStatus(dbUser.id, true)
    // Refresh user data to get updated plan
    const updatedUser = await getUserByClerkId(user.id)
    if (updatedUser) {
      updatedUser.is_admin = true
      updatedUser.plan = 'pro'
    }
  }
  
  // If user is admin but not on pro plan, upgrade them
  if (isAdmin && dbUser && dbUser.plan !== 'pro') {
    const { updateUserPlan } = await import("@/lib/db")
    await updateUserPlan(dbUser.id, 'pro')
  }
  
  // Ensure dbUser exists for stats
  if (!dbUser) {
    const { createUser } = await import("@/lib/db")
    await createUser(user.id, user.emailAddresses[0]?.emailAddress || "", true)
  }

  // Get admin stats
  const stats = await getUserStats()
  const allUsers = await getAllUsers()
  const allSubscriptions = await getAllSubscriptions()
  const allLogs = await getAllUsageLogs()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, subscriptions, and track usage</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.freeUsers} free, {stats.proUsers} pro
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalSubscriptions} total subscriptions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Generations</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGenerations}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.generationsThisMonth} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pro Users</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.proUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalUsers > 0 
                  ? `${Math.round((stats.proUsers / stats.totalUsers) * 100)}% conversion`
                  : '0% conversion'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Users - Live Component */}
          <RecentUsersLive />

          {/* Recent Activity - Live Component */}
          <RecentActivityLive />
        </div>

        {/* All Users Table from Clerk */}
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">User Management</h2>
              <p className="text-sm text-muted-foreground">Sync Clerk users with database</p>
            </div>
            <SyncUsersButton />
          </div>
          <UsersTable />
        </div>

        {/* Database Users Table (Legacy) */}
        {allUsers.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Database Users (Legacy)</CardTitle>
              <CardDescription>Users stored in local database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Plan</th>
                      <th className="text-left p-2">Subscription Status</th>
                      <th className="text-left p-2">Joined</th>
                      <th className="text-left p-2">Total Generations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((user) => {
                      const subscription = allSubscriptions.find(s => s.user_id === user.id)
                      // Filter logs by user's database ID (not clerk_id)
                      const userLogs = allLogs.filter(log => log.user_id === user.id)
                      return (
                        <tr key={user.id} className="border-b">
                          <td className="p-2">{user.email}</td>
                          <td className="p-2">
                            <Badge variant={user.plan === "pro" ? "default" : "secondary"}>
                              {user.plan}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {subscription ? (
                              <Badge 
                                variant={
                                  subscription.status === "active" ? "default" : 
                                  subscription.status === "canceled" ? "destructive" : 
                                  "secondary"
                                }
                              >
                                {subscription.status}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">No subscription</span>
                            )}
                          </td>
                          <td className="p-2 text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-2">
                            <span className="font-medium">{userLogs.length}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Support Requests Section */}
        <SupportRequests />
      </main>
    </div>
  )
}

