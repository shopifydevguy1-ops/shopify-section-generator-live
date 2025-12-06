"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Send } from "lucide-react"

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
  created_at: string
  status: 'open' | 'closed' | 'in_progress'
  replies?: SupportReply[]
}

interface SupportTicketModalProps {
  request: SupportRequest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onReplyAdded: () => void
}

export function SupportTicketModal({
  request,
  open,
  onOpenChange,
  onReplyAdded,
}: SupportTicketModalProps) {
  const { toast } = useToast()
  const [replyMessage, setReplyMessage] = useState("")
  const [status, setStatus] = useState<'open' | 'closed' | 'in_progress'>('open')
  const [sending, setSending] = useState(false)
  const [fullRequest, setFullRequest] = useState<SupportRequest | null>(request)

  useEffect(() => {
    if (request) {
      setStatus(request.status)
      setFullRequest(request)
      // Fetch full request with replies if needed
      fetchFullRequest()
    }
  }, [request])

  const fetchFullRequest = async () => {
    if (!request) return
    
    try {
      const response = await fetch("/api/support")
      const data = await response.json()
      if (response.ok) {
        const found = data.requests.find((r: SupportRequest) => r.id === request.id)
        if (found) {
          setFullRequest(found)
        }
      }
    } catch (error) {
      console.error("Error fetching full request:", error)
    }
  }

  const handleReply = async () => {
    if (!replyMessage.trim() || !request) return

    setSending(true)
    try {
      const response = await fetch(`/api/support/${request.id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: replyMessage,
          status: status,
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
      await fetchFullRequest()
      onReplyAdded()
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

  if (!fullRequest) return null

  const sortedReplies = [...(fullRequest.replies || [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{fullRequest.subject}</DialogTitle>
            <Badge
              variant={
                fullRequest.status === 'open'
                  ? 'default'
                  : fullRequest.status === 'in_progress'
                  ? 'secondary'
                  : 'outline'
              }
            >
              {fullRequest.status}
            </Badge>
          </div>
          <DialogDescription>
            From: {fullRequest.email} • {new Date(fullRequest.created_at).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original Message */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">{fullRequest.email}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(fullRequest.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{fullRequest.message}</p>
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
                        <span className="text-primary">Admin {reply.admin_email ? `(${reply.admin_email})` : ''}</span>
                      ) : (
                        <span>{fullRequest.email}</span>
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
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reply">Reply</Label>
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
      </DialogContent>
    </Dialog>
  )
}

