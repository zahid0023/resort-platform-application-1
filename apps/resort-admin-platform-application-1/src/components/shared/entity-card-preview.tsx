"use client"

import { Badge } from "@/components/ui/badge"
import { LucideIconRenderer } from "ui-blocks"

interface EntityCardPreviewProps {
  name: string
  code: string
  description: string
  sort_order: number
  icon_type: string
  icon_value: string
  icon_color: string
  id?: number
  namePlaceholder?: string
  readOnly?: boolean
}

export function EntityCardPreview({
  name, code, description, sort_order, icon_type, icon_value, icon_color,
  id, namePlaceholder = "Untitled", readOnly = false,
}: EntityCardPreviewProps) {
  return (
    <div className="relative rounded-xl border border-border bg-card p-5 text-left text-card-foreground shadow-card">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {readOnly ? "Card Preview" : "Live Card Preview"}
        </span>
        {!readOnly && (
          <span className="text-[10px] text-muted-foreground">updates as you edit</span>
        )}
      </div>

      <div className="mb-4 flex items-start justify-between">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary"
          style={{
            background: icon_color
              ? `linear-gradient(135deg, ${icon_color}, ${icon_color}cc)`
              : undefined,
            boxShadow: icon_color
              ? `0 8px 24px -8px ${icon_color}80`
              : undefined,
          }}
        >
          {icon_type === "LUCIDE" && icon_value ? (
            <LucideIconRenderer name={icon_value} className="h-6 w-6 text-white" />
          ) : icon_type === "IMAGE" && icon_value ? (
            <img src={icon_value} alt="" className="h-6 w-6 object-contain" />
          ) : (
            <span className="text-xs font-medium text-white/80">?</span>
          )}
        </div>
      </div>

      <div className="mb-1 flex items-center gap-2">
        <h3 className="truncate text-base font-semibold">{name || namePlaceholder}</h3>
      </div>
      <Badge variant="secondary" className="mb-3 font-mono text-[10px]">
        {code || "CODE"}
      </Badge>
      <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
        {description || "No description"}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4 text-xs text-muted-foreground">
        <span className="font-mono">#{id ?? "—"}</span>
        <span>Order: {sort_order}</span>
        <span className="font-mono truncate max-w-[40%] text-right">{icon_value || "—"}</span>
      </div>
    </div>
  )
}
