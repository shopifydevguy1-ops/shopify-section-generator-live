"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OnlineUser {
  user_id: string
  email: string
  last_activity: string
  activity_type: string
}

export function OnlineUsersLive() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOnlineUsers = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true)
    }
    try {
      const response = await fetch(`/api/admin/online-users?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch online users")
      }

      console.log(`[OnlineUsersLive] Fetched ${data.onlineUsers?.length || 0} online users`)
      if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
        setOnlineUsers(data.onlineUsers)
      }
    } catch (error: any) {
      console.error("Error fetching online users:", error)
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchOnlineUsers(true)
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      console.log('[OnlineUsersLive] Auto-refreshing...')
      fetchOnlineUsers(false)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const getActivityBadgeVariant = (activityType: string) => {
    switch (activityType) {
      case 'login':
        return 'default'
      case 'copy':
        return 'secondary'
      case 'download':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffSecs = Math.floor((diffMs % 60000) / 1000)
    
    if (diffMins < 1) {
      return `${diffSecs}s ago`
    }
    return `${diffMins}m ago`
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Online Users
            </CardTitle>
            <CardDescription>
              Users active in the last 10 minutes (auto-refreshes every 10s)
            </CardDescription>
          </div>
          <Button onClick={() => fetchOnlineUsers(false)} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && onlineUsers.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : onlineUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No users online</p>
            <p className="text-sm mt-2">Users active in the last 10 minutes will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mb-4">
              <Badge variant="default" className="text-sm">
                {onlineUsers.length} {onlineUsers.length === 1 ? 'user' : 'users'} online
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Last Activity</th>
                    <th className="text-left p-2">Activity Type</th>
                    <th className="text-left p-2">Time Ago</th>
                  </tr>
                </thead>
                <tbody>
                  {onlineUsers.map((user) => (
                    <tr key={user.user_id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{user.email}</td>
                      <td className="p-2 text-muted-foreground">
                        {new Date(user.last_activity).toLocaleString()}
                      </td>
                      <td className="p-2">
                        <Badge variant={getActivityBadgeVariant(user.activity_type)}>
                          {user.activity_type}
                        </Badge>
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {formatTimeAgo(user.last_activity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

