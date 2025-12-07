"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EditUserDialog } from "./edit-user-dialog"
import { Edit, Loader2, RefreshCw, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/db"

interface ClerkUserData {
  id: string
  firstName: string | null
  lastName: string | null
  imageUrl: string
  createdAt: number
}

interface ActivityStats {
  generations: number
  copies: number
  downloads: number
  total: number
}

interface UserWithClerk extends User {
  clerkUser?: ClerkUserData
  activityStats?: ActivityStats
}

export function UsersTable() {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserWithClerk[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserWithClerk | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [resettingUserId, setResettingUserId] = useState<string | null>(null)

  const fetchUsers = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true)
    }
    try {
      // Add cache-busting timestamp to ensure fresh data
      const response = await fetch(`/api/admin/clerk-users?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch users")
      }

      // Always update users with fresh data from server
      if (data.users && Array.isArray(data.users)) {
        console.log(`[UsersTable] Fetched ${data.users.length} users, updating state`)
        setUsers(data.users)
      }
    } catch (error: any) {
      // Only show error toast on initial load, not on silent refreshes
      if (showLoading) {
        toast({
          title: "Error",
          description: error.message || "Failed to load users",
          variant: "destructive",
        })
      } else {
        // Silently log error for background refreshes
        console.error("Background refresh failed:", error)
      }
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    // Initial load with loading state
    fetchUsers(true)
    // Auto-refresh every 10 seconds to catch activity updates faster
    const interval = setInterval(() => {
      console.log('[UsersTable] Auto-refreshing users list...')
      fetchUsers(false)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleEdit = (user: UserWithClerk) => {
    setSelectedUser(user)
    setIsEditDialogOpen(true)
  }

  const handleUserUpdated = () => {
    fetchUsers()
  }

  const handleResetLimit = async (userId: string) => {
    if (!confirm("Are you sure you want to reset this user's usage limit for the current month? This will delete all their usage logs (generations, downloads, copies) for this month.")) {
      return
    }

    setResettingUserId(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-usage" }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset usage limit")
      }

      toast({
        title: "Success",
        description: data.message || `Reset ${data.deleted || 0} usage log(s) for user`,
      })

      // Refresh users list
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset usage limit",
        variant: "destructive",
      })
    } finally {
      setResettingUserId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users from Clerk</CardTitle>
              <CardDescription>Complete list of all registered users (auto-refreshes every 10s)</CardDescription>
            </div>
            <Button onClick={() => fetchUsers(false)} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Plan</th>
                  <th className="text-left p-2">Admin</th>
                  <th className="text-left p-2">Joined</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">{user.email}</td>
                      <td className="p-2">
                        {user.clerkUser?.firstName || user.clerkUser?.lastName
                          ? `${user.clerkUser.firstName || ""} ${user.clerkUser.lastName || ""}`.trim()
                          : "-"}
                      </td>
                      <td className="p-2">
                        <Badge 
                          variant={
                            user.plan === "expert" ? "default" : 
                            user.plan === "pro" ? "default" : 
                            "secondary"
                          }
                        >
                          {user.plan}
                        </Badge>
                      </td>
                      <td className="p-2">
                        {user.is_admin ? (
                          <Badge variant="default">Admin</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {user.clerkUser?.createdAt
                          ? new Date(user.clerkUser.createdAt).toLocaleDateString()
                          : new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEdit(user)}
                            variant="ghost"
                            size="sm"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleResetLimit(user.id)}
                            variant="ghost"
                            size="sm"
                            disabled={resettingUserId === user.id}
                            title="Reset usage limit for current month"
                          >
                            {resettingUserId === user.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4 mr-1" />
                            )}
                            Reset Limit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <EditUserDialog
        user={selectedUser}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUserUpdated={handleUserUpdated}
      />
    </>
  )
}

