"use client"

import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Code } from "lucide-react"

interface SectionCardProps {
  section: {
    filename: string
    name: string
    tags: string[]
    description: string
    previewImage?: string
  }
  onClick: () => void
}

export function SectionCard({ section, onClick }: SectionCardProps) {
  return (
    <Card
      className="relative cursor-pointer group overflow-hidden border-2 border-border hover:border-primary transition-all hover:shadow-lg"
      onClick={onClick}
    >
      {section.previewImage ? (
        <div className="relative aspect-video bg-muted/30">
          <Image
            src={section.previewImage}
            alt={section.name}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        </div>
      ) : (
        <div className="aspect-video flex items-center justify-center bg-muted/50 text-muted-foreground">
          <div className="text-center p-4">
            <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium">{section.name}</p>
          </div>
        </div>
      )}
      <div className="p-3 bg-background border-t">
        <h3 className="font-semibold text-sm truncate">{section.name}</h3>
        {section.description && (
          <p className="text-xs text-muted-foreground truncate mt-1">
            {section.description}
          </p>
        )}
        {section.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {section.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

