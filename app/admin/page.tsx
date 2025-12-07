import { redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs/server"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserByClerkId } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { UsersTable } from "@/components/admin/users-table"
import { SyncUsersButton } from "@/components/admin/sync-users-button"
import { SupportRequests } from "@/components/admin/support-requests"
import { RecentUsersLive } from "@/components/admin/recent-users-live"
import { RecentActivityLive } from "@/components/admin/recent-activity-live"
import { StatsCardsLive } from "@/components/admin/stats-cards-live"
import { DatabaseUsersLegacyLive } from "@/components/admin/database-users-legacy-live"

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
        updatedUser.plan = 'expert'
      }
    }
  
    // If user is admin but not on expert plan, upgrade them
    if (isAdmin && dbUser && dbUser.plan !== 'expert') {
      const { updateUserPlan } = await import("@/lib/db")
      await updateUserPlan(dbUser.id, 'expert')
    }
  
  // Ensure dbUser exists for stats
  if (!dbUser) {
    const { createUser } = await import("@/lib/db")
    await createUser(user.id, user.emailAddresses[0]?.emailAddress || "", true)
  }

  // Legacy table is now handled by DatabaseUsersLegacyLive component

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, subscriptions, and track usage</p>
        </div>

        {/* Stats Cards - Live Component */}
        <StatsCardsLive />

        {/* All Users Table from Clerk - Moved to top */}
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">All Users from Clerk</h2>
              <p className="text-sm text-muted-foreground">Complete list with activity stats (generations, copies, downloads)</p>
            </div>
            <SyncUsersButton />
          </div>
          <UsersTable />
        </div>

        {/* Database Users Table (Legacy) - Now Live */}
        <DatabaseUsersLegacyLive />

        {/* Support Requests Section */}
        <SupportRequests />
      </main>
    </div>
  )
}

