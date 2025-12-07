"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import Link from "next/link"

interface UsageStats {
  count: number
  limit: number | null
  remaining: number | null
  allowed: boolean
  plan: string
  isAdmin: boolean
}

interface DashboardUsageLimitLiveProps {
  initialUsageCount: number
  plan: 'free' | 'pro' | 'expert'
  isAdmin: boolean
}

export function DashboardUsageLimitLive({ initialUsageCount, plan, isAdmin }: DashboardUsageLimitLiveProps) {
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
        console.log('[DashboardUsageLimitLive] Fetched usage stats:', stats)
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

  // Determine limits based on plan
  const maxUsage: number | string = plan === "expert" || isAdmin ? "Unlimited" : plan === "pro" ? 50 : 5
  // Only use initialUsageCount as fallback if we haven't fetched yet and we're not loading
  const usageCount = usageStats?.count ?? (loading ? 0 : initialUsageCount)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Limit</CardTitle>
        <CardDescription>Your copy/download quota for this month (generation/search is unlimited)</CardDescription>
      </CardHeader>
      <CardContent>
        {plan === "expert" || isAdmin ? (
          <div className="text-center py-8">
            <p className="text-2xl font-bold text-primary">Unlimited</p>
            <p className="text-muted-foreground mt-2">You have unlimited copy/download</p>
            <p className="text-xs text-muted-foreground mt-1 italic">Generation/search is unlimited</p>
            <Link href="/sections" className="block mt-4">
              <Button size="sm" variant="outline">Browse Section Library</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Used</span>
              <span className="flex items-center gap-2">
                {usageCount} / {maxUsage}
                {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ 
                  width: typeof maxUsage === 'number' 
                    ? `${Math.min(100, (usageCount / maxUsage) * 100)}%` 
                    : '0%'
                }}
              />
            </div>
            {typeof maxUsage === 'number' && usageCount >= maxUsage && (
              <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
                <p className="text-sm text-destructive font-semibold">
                  {plan === "free" 
                    ? "You've reached your copy/download limit. You can still search/browse unlimited sections. Upgrade to Pro for 50 copies/downloads per month, or Expert for unlimited."
                    : "You've reached your copy/download limit. You can still search/browse unlimited sections. Upgrade to Expert for unlimited access and full library access."}
                </p>
                <Link href="/pricing" className="block mt-2">
                  <Button size="sm">Upgrade Now</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

