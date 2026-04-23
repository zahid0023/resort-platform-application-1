"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2 } from "lucide-react"
import { LucideIconRenderer } from "ui-blocks"
import type { FacilitySummary } from "@/services/facilities"

interface Props {
  data: FacilitySummary
  onEdit?: (row: FacilitySummary) => void
  onDelete?: (id: number) => void
}

export function FacilityCard({ data, onEdit, onDelete }: Props) {
  const iconColor = data.icon_meta?.color as string | undefined
  const iconName = data.icon_type === "LUCIDE" ? data.icon_value : undefined

  return (
    <Card className="group relative p-5 shadow-card hover:shadow-elegant transition-all hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary"
          style={iconColor ? {
            background: `linear-gradient(135deg, ${iconColor}, ${iconColor}cc)`,
            boxShadow: `0 8px 24px -8px ${iconColor}80`,
          } : undefined}
        >
          {data.icon_type === "LUCIDE" && data.icon_value ? (
            <LucideIconRenderer name={iconName} className="w-6 h-6 text-white" />
          ) : data.icon_type === "IMAGE" && data.icon_value ? (
            <img src={data.icon_value} alt="" className="w-6 h-6 object-contain" />
          ) : (
            <span className="text-xs font-medium text-white/80">{data.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(data)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(data.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-base truncate">{data.name}</h3>
      </div>
      <Badge variant="secondary" className="mb-3 font-mono text-[10px]">{data.code}</Badge>
      <p className="text-sm text-muted-foreground line-clamp-2 min-h-10">
        {data.description || "No description"}
      </p>

      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono">#{data.id}</span>
        <span>Order: {data.sort_order ?? 0}</span>
        <span className="font-mono truncate max-w-[40%] text-right">{data.icon_value || "—"}</span>
      </div>
    </Card>
  )
}

export default FacilityCard
