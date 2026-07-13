"use client"

import { useState } from "react"
import { ImageOff, Pencil, Trash2 } from "lucide-react"
import { Button } from "@resort/shadcn-ui"
import type { ResortImage } from "@/services/resort-images"

interface ResortImageCardProps {
  image: ResortImage
  onEdit: () => void
  onDelete: () => void
}

export function ResortImageCard({ image, onEdit, onDelete }: ResortImageCardProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Image area */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {imgError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="size-8" />
            <span className="text-xs">Failed to load</span>
          </div>
        ) : (
          <img
            src={image.url}
            alt={image.caption ?? "Resort image"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        )}

        {/* Bottom gradient + caption */}
        {image.caption && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
            <p className="text-xs text-white/90 leading-tight line-clamp-2">{image.caption}</p>
          </div>
        )}

        {/* Sort order badge */}
        <div className="absolute top-2 left-2 rounded-md bg-black/50 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-mono text-white/80">
          #{image.sort_order}
        </div>

        {/* Hover action buttons */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon-sm"
            variant="ghost"
            className="bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 hover:text-white border-0"
            onClick={onEdit}
          >
            <Pencil className="size-3" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="bg-black/50 backdrop-blur-sm text-rose-300 hover:bg-black/70 hover:text-rose-300 border-0"
            onClick={onDelete}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
