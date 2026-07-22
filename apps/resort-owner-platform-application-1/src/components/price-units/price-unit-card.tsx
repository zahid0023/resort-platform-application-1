"use client"

import { useState } from "react"
import { Eye, Globe, Info, Layers, Trash2 } from "lucide-react"
import { Badge, Button, Card } from "@resort/shadcn-ui"
import type { PriceUnit } from "@/services/price-units"
import { PriceUnitDetailDialog } from "./price-unit-detail-dialog"

export interface PriceUnitCardProps {
  priceUnit: PriceUnit
  onView: (pu: PriceUnit) => void
  onDelete: (pu: PriceUnit) => void
}

export function PriceUnitCard({ priceUnit: pu, onView, onDelete }: PriceUnitCardProps) {
  const primaryLocale = pu.locales[0]
  const title = primaryLocale?.name ?? pu.code
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={() => onView(pu)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView(pu) } }}
        className="group overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-indigo-500/15 via-indigo-500/8 to-transparent px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0 shadow-sm ring-1 ring-indigo-500/10">
                <Layers className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base leading-tight truncate">{title}</h3>
                <div className="mt-1">
                  <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-4 border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
                    {pu.code}
                  </Badge>
                </div>
              </div>
            </div>

            <div
              className="flex items-center gap-0.5 shrink-0"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Button
                size="icon" variant="ghost"
                className="h-8 w-8 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10"
                onClick={(e) => { e.stopPropagation(); setDetailsOpen(true) }}
                title="View details"
              >
                <Info className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-8 w-8"
                  onClick={(e) => { e.stopPropagation(); onView(pu) }}>
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(pu) }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          {primaryLocale?.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{primaryLocale.description}</p>
          )}

          {primaryLocale?.calculation_method && (
            <div className="rounded-md bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">Calculation: </span>
              <span className="line-clamp-1">{primaryLocale.calculation_method}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-border/60">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span>{pu.locales.length} lang{pu.locales.length !== 1 ? "s" : ""}</span>
            </div>
            <span className="text-[11px] text-muted-foreground/60 font-mono">sort {pu.sort_order}</span>
          </div>
        </div>
      </Card>

      <PriceUnitDetailDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        priceUnit={pu}
      />
    </>
  )
}
