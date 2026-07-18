"use client"

import { Globe, Tag } from "lucide-react"
import { Badge, Dialog, DialogContent, DialogTitle } from "@resort/shadcn-ui"
import type { PriceType } from "@/services/price-types"

export interface PriceTypeDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  priceType: PriceType | null
}

export function PriceTypeDetailDialog({ open, onOpenChange, priceType: pt }: PriceTypeDetailDialogProps) {
  if (!pt) return null

  const title = pt.locales[0]?.name ?? pt.code

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent">
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
            <Tag className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base leading-tight truncate">{title}</p>
            <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-4 mt-1 border-amber-500/30 text-amber-600 dark:text-amber-400">
              {pt.code}
            </Badge>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Meta */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-md bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground font-mono">
              sort order: {pt.sort_order}
            </span>
            <span className="rounded-md bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {pt.locales.length} translation{pt.locales.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Locale rows */}
          {pt.locales.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 border rounded-xl border-dashed">
              No translations yet.
            </p>
          ) : (
            <div className="space-y-3">
              {pt.locales.map((loc) => (
                <div key={loc.id} className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="font-mono text-[11px] uppercase">
                      {loc.locale.code}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground/60 font-mono">sort {loc.sort_order}</span>
                  </div>

                  {loc.name && (
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Name</p>
                      <p className="text-sm font-semibold">{loc.name}</p>
                    </div>
                  )}

                  {loc.description && (
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Description</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{loc.description}</p>
                    </div>
                  )}

                  {loc.purpose && (
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Purpose</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{loc.purpose}</p>
                    </div>
                  )}

                  {loc.usage_example && (
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Usage Example</p>
                      <p className="text-xs text-muted-foreground leading-relaxed italic">{loc.usage_example}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
