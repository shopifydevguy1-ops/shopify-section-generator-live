"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Loader2 } from "lucide-react"
import Link from "next/link"

interface UsageStats {
  count: number
  limit: number | null
  remaining: number | null
  allowed: boolean
  plan: string
  isAdmin: boolean
}

interface DashboardUsageLiveProps {
  initialUsageCount: number
  plan: 'free' | 'pro' | 'expert'
  isAdmin: boolean
}

export function DashboardUsageLive({ initialUsageCount, plan, isAdmin }: DashboardUsageLiveProps) {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true) // Start with loading true to fetch immediately

  const fetchUsageStats = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true)
    }
    try {
      const response = await fetch(`/api/sections/download?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const stats = {
          count: data.count,
          limit: data.limit === null ? Infinity : data.limit,
          remaining: data.remaining === null ? Infinity : data.remaining,
          allowed: data.allowed,
          plan: data.plan,
          isAdmin: data.isAdmin
        }
        setUsageStats(stats)
        console.log('[DashboardUsageLive] Fetched usage stats:', stats)
      }
    } catch (error) {
      console.error("Error fetching usage stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch immediately with loading state
    fetchUsageStats(true)
    // Auto-refresh every 5 seconds to catch updates quickly
    const interval = setInterval(() => fetchUsageStats(false), 5000)
    return () => clearInterval(interval)
  }, [])

  // Use limit from API response (accounts for trial period, subscription status, etc.)
  // Fallback to plan-based defaults only if API hasn't responded yet
  const maxUsage: number | string = usageStats?.limit === Infinity || usageStats?.limit === null
    ? "Unlimited"
    : usageStats?.limit !== undefined
    ? usageStats.limit
    : plan === "expert" || isAdmin
    ? "Unlimited"
    : plan === "pro"
    ? 50
    : 5
  
  // Use count from API response - only use initial as very temporary fallback
  // Prefer showing API data even if it's 0, as it's the source of truth
  const usageCount = usageStats !== null ? (usageStats.count ?? 0) : (loading ? 0 : initialUsageCount)
  
  // Use remaining from API response - this is the source of truth
  const remaining = usageStats?.remaining !== undefined && usageStats?.remaining !== null
    ? (usageStats.remaining === Infinity ? "Unlimited" : usageStats.remaining)
    : usageStats !== null && usageStats.limit !== undefined && usageStats.limit !== null
    ? (usageStats.limit === Infinity ? "Unlimited" : Math.max(0, (usageStats.limit === null ? 0 : usageStats.limit) - usageCount))
    : loading
    ? (typeof maxUsage === 'number' ? maxUsage : "Unlimited")
    : (typeof maxUsage === 'number' ? Math.max(0, maxUsage - initialUsageCount) : "Unlimited")

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Usage This Month</CardTitle>
        <FileText className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold flex items-center gap-2">
          {usageCount}
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {plan === "expert" || isAdmin
            ? "Unlimited copy/download" 
            : plan === "pro"
            ? `${remaining} copy/download remaining out of ${maxUsage}`
            : `${remaining} copy/download remaining out of ${maxUsage}`}
        </p>
        <p className="text-xs text-muted-foreground mt-1 italic">
          Generation/search is unlimited
        </p>
      </CardContent>
    </Card>
  )
}

