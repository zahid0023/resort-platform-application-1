"use client"

import { useTranslation } from "react-i18next"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Trash2 } from "lucide-react"
import type { RoomCategorySummary } from "@/services/room-categories"

interface Props {
  data: RoomCategorySummary
  onView?: (row: RoomCategorySummary) => void
  onDelete?: (id: number) => void
}

export function RoomCategoryCard({ data, onView, onDelete }: Props) {
  const { t } = useTranslation()
  const displayName = data.locales[0]?.name ?? data.code
  const displayDescription = data.locales[0]?.description

  return (
    <Card className="group relative p-5 shadow-card hover:shadow-elegant transition-all hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary font-bold text-lg">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onView && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onView(data)}>
              <Eye className="w-3.5 h-3.5" />
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
        <h3 className="font-semibold text-base truncate">{displayName}</h3>
      </div>
      <Badge variant="secondary" className="mb-3 font-mono text-[10px]">{data.code}</Badge>
      <p className="text-sm text-muted-foreground line-clamp-2 min-h-10">
        {displayDescription || t("roomCategory.noDescription")}
      </p>

      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono">#{data.id}</span>
        <span>{t("facility.order", { n: data.sort_order })}</span>
        <span>{data.locales.length} locale{data.locales.length !== 1 ? "s" : ""}</span>
      </div>
    </Card>
  )
}

export default RoomCategoryCard
