"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SupportTicketModal } from "./support-ticket-modal"

interface SupportRequest {
  id: string
  user_id: string
  clerk_id: string
  email: string
  subject: string
  message: string
  created_at: string
  status: 'open' | 'closed' | 'in_progress'
}

export function SupportRequests() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<SupportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/support")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch support requests")
      }

      setRequests(data.requests || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load support requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Support Requests
            </CardTitle>
            <CardDescription>
              {requests.filter(r => r.status === 'open').length} open request(s)
            </CardDescription>
          </div>
          <Button onClick={fetchRequests} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No support requests yet
          </p>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedRequest(request)
                  setModalOpen(true)
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{request.subject}</h4>
                      <Badge
                        variant={
                          request.status === 'open'
                            ? 'default'
                            : request.status === 'in_progress'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {request.status}
                      </Badge>
                      {request.replies && request.replies.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {request.replies.length} {request.replies.length === 1 ? 'reply' : 'replies'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      From: {request.email}
                    </p>
                    <p className="text-sm whitespace-pre-wrap line-clamp-2">{request.message}</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(request.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <SupportTicketModal
        request={selectedRequest}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onReplyAdded={fetchRequests}
      />
    </Card>
  )
}

