"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, CreditCard, FileText } from "lucide-react"
import { Loader2 } from "lucide-react"

interface Stats {
  totalUsers: number
  freeUsers: number
  proUsers: number
  expertUsers: number
  totalSubscriptions: number
  activeSubscriptions: number
  totalGenerations: number
  generationsThisMonth: number
}

export function StatsCardsLive() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/admin/stats?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch stats")
      }

      console.log('[StatsCardsLive] Fetched stats:', data.stats)
      setStats(data.stats)
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // Refresh every 10 seconds to catch updates
    const interval = setInterval(() => {
      console.log('[StatsCardsLive] Auto-refreshing stats...')
      fetchStats()
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.freeUsers} free, {stats.proUsers} pro, {stats.expertUsers} expert
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.activeSubscriptions} active
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
            {stats.totalSubscriptions} total
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
    </div>
  )
}

