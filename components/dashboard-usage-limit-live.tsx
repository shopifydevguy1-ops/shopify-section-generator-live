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
  reason?: string
  trialInfo?: {
    isInTrial: boolean
    daysRemaining: number
    copiesUsed: number
    copiesLimit: number
  }
  trialExpirationInfo?: {
    isInTrial: boolean
    daysRemaining: number
    trialExpiresAt: string | null
    copiesUsed: number
    copiesLimit: number
    hasActiveSubscription: boolean
  }
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
          isAdmin: data.isAdmin,
          reason: data.reason,
          trialInfo: data.trialInfo,
          trialExpirationInfo: data.trialExpirationInfo
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

  // Use limit from API response (accounts for trial period, subscription status, etc.)
  // This is the source of truth - it handles trial (20), subscribed (50), expert (unlimited)
  const maxUsage: number | string = usageStats?.limit === Infinity || usageStats?.limit === null
    ? "Unlimited"
    : usageStats?.limit !== undefined
    ? usageStats.limit
    : plan === "expert" || isAdmin
    ? "Unlimited"
    : plan === "pro"
    ? 50  // Fallback only if API hasn't responded
    : 5
  
  // Use count from API response - only use initial as very temporary fallback
  // Prefer showing API data even if it's 0, as it's the source of truth
  const usageCount = usageStats !== null ? (usageStats.count ?? 0) : (loading ? 0 : initialUsageCount)

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
            {/* Trial Expiration Warning */}
            {usageStats?.trialExpirationInfo?.isInTrial && (
              <div className={`p-4 rounded-md border-2 ${
                usageStats.trialExpirationInfo.daysRemaining <= 3 || 
                usageStats.trialExpirationInfo.copiesUsed >= usageStats.trialExpirationInfo.copiesLimit
                  ? 'bg-destructive/20 border-destructive animate-pulse'
                  : usageStats.trialExpirationInfo.daysRemaining <= 7 || 
                    usageStats.trialExpirationInfo.copiesUsed >= usageStats.trialExpirationInfo.copiesLimit * 0.8
                  ? 'bg-yellow-500/20 border-yellow-500'
                  : 'bg-blue-500/10 border-blue-500'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-bold mb-1">
                      {usageStats.trialExpirationInfo.daysRemaining <= 3
                        ? `🚨 Trial expires in ${usageStats.trialExpirationInfo.daysRemaining} day${usageStats.trialExpirationInfo.daysRemaining !== 1 ? 's' : ''}!`
                        : usageStats.trialExpirationInfo.daysRemaining <= 7
                        ? `⚠️ Trial expires in ${usageStats.trialExpirationInfo.daysRemaining} days`
                        : `Free Trial Active: ${usageStats.trialExpirationInfo.daysRemaining} days remaining`}
                    </p>
                    <p className="text-xs opacity-90 mb-2">
                      Copies used: {usageStats.trialExpirationInfo.copiesUsed} / {usageStats.trialExpirationInfo.copiesLimit}
                      {usageStats.trialExpirationInfo.trialExpiresAt && (
                        <span className="block mt-1">
                          Expires: {new Date(usageStats.trialExpirationInfo.trialExpiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                    {(usageStats.trialExpirationInfo.daysRemaining <= 7 || 
                      usageStats.trialExpirationInfo.copiesUsed >= usageStats.trialExpirationInfo.copiesLimit * 0.8) && (
                      <Link href="/api/checkout" className="block mt-2">
                        <Button size="sm" variant={usageStats.trialExpirationInfo.daysRemaining <= 3 ? "destructive" : "default"}>
                          Subscribe Now to Continue
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Trial Expired Warning */}
            {usageStats?.trialExpirationInfo && !usageStats.trialExpirationInfo.isInTrial && !usageStats.trialExpirationInfo.hasActiveSubscription && (
              <div className="p-4 bg-destructive/20 border-2 border-destructive rounded-md">
                <p className="text-sm font-bold mb-2">🚨 Your Free Trial Has Expired</p>
                <p className="text-xs opacity-90 mb-3">
                  Your trial period has ended. Subscribe to Pro to continue using the service with 50 copies/downloads per month.
                </p>
                <Link href="/api/checkout" className="block">
                  <Button size="sm" variant="destructive" className="w-full">Subscribe to Pro Now</Button>
                </Link>
              </div>
            )}

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
                  {plan === "pro" 
                    ? usageStats?.reason || "You've reached your copy/download limit. You can still search/browse unlimited sections. Subscribe to Pro or upgrade to Expert for unlimited access."
                    : "You've reached your copy/download limit. You can still search/browse unlimited sections. Upgrade to Expert for unlimited access and full library access."}
                </p>
                <Link href={plan === "pro" ? "/api/checkout" : "/pricing"} className="block mt-2">
                  <Button size="sm">{plan === "pro" ? "Subscribe Now" : "Upgrade Now"}</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

