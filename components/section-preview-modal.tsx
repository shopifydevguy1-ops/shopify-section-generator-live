"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { Copy, Download, Code } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DeviceMockup } from "@/components/device-mockup"

interface SectionPreviewModalProps {
  section: {
    filename: string
    name: string
    tags: string[]
    description: string
    liquidCode: string
    previewImage?: string
  } | null
  open: boolean
  onClose: () => void
}

export function SectionPreviewModal({ section, open, onClose }: SectionPreviewModalProps) {
  const { toast } = useToast()

  if (!section) return null

  const handleCopyCode = () => {
    navigator.clipboard.writeText(section.liquidCode)
    toast({
      title: "Copied!",
      description: "Section code copied to clipboard",
    })
  }

  const handleDownload = () => {
    const blob = new Blob([section.liquidCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = section.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Downloaded!",
      description: `${section.filename} downloaded`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{section.name}</DialogTitle>
          <DialogDescription>
            {section.description || `Section file: ${section.filename}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Image */}
          {section.previewImage && (
            <div className="relative w-full bg-muted rounded-lg overflow-hidden py-8">
              <DeviceMockup 
                previewImage={section.previewImage}
                alt={section.name}
                showAllDevices={true}
              />
            </div>
          )}

          {/* Tags */}
          {section.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {section.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 bg-primary/10 text-primary rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Code Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                <span className="text-sm font-medium">Liquid Code</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download .liquid
                </Button>
              </div>
            </div>
            <Textarea
              value={section.liquidCode}
              readOnly
              className="font-mono text-xs min-h-[400px]"
            />
          </div>

          {/* File Info */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>Filename: <code className="bg-muted px-1 rounded">{section.filename}</code></p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

