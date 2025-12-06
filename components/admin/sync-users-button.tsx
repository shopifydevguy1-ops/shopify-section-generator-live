"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SyncUsersButton() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleSync = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/sync-users", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync users")
      }

      toast({
        title: "Success",
        description: `Users synced successfully. ${data.stats?.created || 0} created, ${data.stats?.updated || 0} updated.`,
      })

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sync users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleSync} disabled={loading} variant="outline">
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync Users
        </>
      )}
    </Button>
  )
}

