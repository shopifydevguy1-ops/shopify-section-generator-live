"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface RecentUser {
  id: string
  email: string
  plan: 'free' | 'pro'
  created_at: Date
  lastLogin: Date | null
}

export function RecentUsersLive() {
  const [users, setUsers] = useState<RecentUser[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/recent-activity")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch users")
      }

      setUsers(data.recentUsers || [])
    } catch (error: any) {
      console.error("Error fetching recent users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchUsers, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>Latest registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Users</CardTitle>
        <CardDescription>Latest registered users (updates every 5s)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users yet</p>
          ) : (
            users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </p>
                    {user.lastLogin && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-xs text-green-500">
                          Last login: {new Date(user.lastLogin).toLocaleString()}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <Badge variant={user.plan === "pro" ? "default" : "secondary"}>
                  {user.plan}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

