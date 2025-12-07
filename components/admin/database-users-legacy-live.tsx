"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface User {
  id: string
  email: string
  plan: 'free' | 'pro' | 'expert'
  is_admin: boolean
  created_at: Date
}

interface Subscription {
  id: string
  user_id: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
}

interface ActivityStats {
  generations: number
  copies: number
  downloads: number
  total: number
}

interface UserWithStats {
  user: User
  activityStats: ActivityStats
  subscription?: Subscription
}

export function DatabaseUsersLegacyLive() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true)
    }
    try {
      const response = await fetch(`/api/admin/database-users?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch database users")
      }

      console.log(`[DatabaseUsersLegacyLive] Fetched ${data.users?.length || 0} users`)
      if (data.users && Array.isArray(data.users)) {
        setUsers(data.users)
      }
    } catch (error: any) {
      console.error("Error fetching database users:", error)
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchUsers(true)
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      console.log('[DatabaseUsersLegacyLive] Auto-refreshing...')
      fetchUsers(false)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading && users.length === 0) {
    return (
      <Card className="mt-6">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (users.length === 0) {
    return null
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Database Users (Legacy)</CardTitle>
            <CardDescription>Users stored in local database (auto-refreshes every 10s)</CardDescription>
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
                <th className="text-left p-2">Plan</th>
                <th className="text-left p-2">Subscription Status</th>
                <th className="text-left p-2">Joined</th>
                <th className="text-left p-2">Generations</th>
                <th className="text-left p-2">Copies</th>
                <th className="text-left p-2">Downloads</th>
              </tr>
            </thead>
            <tbody>
              {users.map(({ user, activityStats, subscription }) => (
                <tr key={user.id} className="border-b hover:bg-muted/50">
                  <td className="p-2">{user.email}</td>
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
                    <span className="font-medium">{activityStats.generations}</span>
                  </td>
                  <td className="p-2">
                    <span className="font-medium">{activityStats.copies}</span>
                  </td>
                  <td className="p-2">
                    <span className="font-medium">{activityStats.downloads}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

