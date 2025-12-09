"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Mail, Send, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SupportReply {
  id: string
  support_request_id: string
  message: string
  from_admin: boolean
  created_at: string
  admin_email?: string
}

interface SupportRequest {
  id: string
  user_id: string
  clerk_id: string
  email: string
  subject: string
  message: string
  category: 'Error' | 'Custom Section' | 'Suggestion'
  urgency: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'closed' | 'pending' | 'in_progress'
  created_at: string
  updated_at: string
  replies?: SupportReply[]
}

export function UserMessages() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<SupportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [replyMessage, setReplyMessage] = useState("")
  const [sending, setSending] = useState(false)

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/support/my-requests")
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

  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedRequest) return

    setSending(true)
    try {
      const response = await fetch(`/api/support/${selectedRequest.id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: replyMessage,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reply")
      }

      toast({
        title: "Success",
        description: "Reply sent successfully",
      })

      setReplyMessage("")
      await fetchRequests()
      // Refresh the selected request
      const updated = requests.find(r => r.id === selectedRequest.id)
      if (updated) {
        setSelectedRequest(updated)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reply",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const openTicket = (request: SupportRequest) => {
    setSelectedRequest(request)
    setModalOpen(true)
    setReplyMessage("")
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  const sortedReplies = selectedRequest
    ? [...(selectedRequest.replies || [])].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    : []

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Support Messages</CardTitle>
          </div>
          <CardDescription>
            View and reply to your support tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No support requests yet</p>
              <Button asChild>
                <a href="/support">Create Support Request</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => openTicket(request)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-semibold">{request.subject}</h4>
                        <Badge
                          variant={
                            request.status === 'open'
                              ? 'default'
                              : request.status === 'pending'
                              ? 'secondary'
                              : request.status === 'in_progress'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {request.status}
                        </Badge>
                        <Badge
                          variant={
                            request.category === 'Error'
                              ? 'destructive'
                              : request.category === 'Custom Section'
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {request.category}
                        </Badge>
                        <Badge
                          variant={
                            request.urgency === 'critical'
                              ? 'destructive'
                              : request.urgency === 'high'
                              ? 'default'
                              : request.urgency === 'medium'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-xs"
                        >
                          {request.urgency}
                        </Badge>
                        {request.replies && request.replies.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {request.replies.length} {request.replies.length === 1 ? 'reply' : 'replies'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {request.message}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.subject}</DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  {new Date(selectedRequest.created_at).toLocaleString()} • Status:{" "}
                  <Badge
                    variant={
                      selectedRequest.status === 'open'
                        ? 'default'
                        : selectedRequest.status === 'in_progress'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {selectedRequest.status}
                  </Badge>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Original Message */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">You</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedRequest.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{selectedRequest.message}</p>
              </div>

              {/* Replies */}
              {sortedReplies.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Conversation</h4>
                  {sortedReplies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`border rounded-lg p-4 ${
                        reply.from_admin ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">
                          {reply.from_admin ? (
                            <span className="text-primary">
                              Admin {reply.admin_email ? `(${reply.admin_email})` : ''}
                            </span>
                          ) : (
                            <span>You</span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(reply.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="reply">Add Reply</Label>
              <Textarea
                id="reply"
                placeholder="Type your reply here..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={4}
              />
            </div>
            <Button
              onClick={handleReply}
              disabled={!replyMessage.trim() || sending}
              className="w-full"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Reply
                </>
              )}
            </Button>
          </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

