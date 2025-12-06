"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, User, Code } from "lucide-react"

interface RecentActivity {
  type: 'generation' | 'login'
  id: string
  user_id: string
  email: string
  action: string
  timestamp: Date
}

export function RecentActivityLive() {
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActivity = async () => {
    try {
      const response = await fetch("/api/admin/recent-activity")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch activity")
      }

      setActivities(data.recentActivity || [])
    } catch (error: any) {
      console.error("Error fetching recent activity:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivity()
    // Poll every 3 seconds for real-time updates
    const interval = setInterval(fetchActivity, 3000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest section generations and logins</CardDescription>
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
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest section generations and logins (updates every 3s)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  {activity.type === 'login' ? (
                    <User className="h-4 w-4 text-green-500" />
                  ) : (
                    <Code className="h-4 w-4 text-primary" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.action} • {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge variant={activity.type === 'login' ? 'default' : 'secondary'}>
                  {activity.type === 'login' ? 'Login' : 'Generation'}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

