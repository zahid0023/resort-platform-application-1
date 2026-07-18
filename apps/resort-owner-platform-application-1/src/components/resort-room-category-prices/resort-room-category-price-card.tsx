"use client"

import { Pencil, Trash2 } from "lucide-react"
import { Badge, Button } from "@resort/shadcn-ui"
import type { ResortRoomCategoryPrice } from "@/services/resort-room-category-prices"

const DAYS = [
  { key: "monday" as const, label: "Mo" },
  { key: "tuesday" as const, label: "Tu" },
  { key: "wednesday" as const, label: "We" },
  { key: "thursday" as const, label: "Th" },
  { key: "friday" as const, label: "Fr" },
  { key: "saturday" as const, label: "Sa" },
  { key: "sunday" as const, label: "Su" },
]

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export interface ResortRoomCategoryPriceCardProps {
  price: ResortRoomCategoryPrice
  onEdit: (price: ResortRoomCategoryPrice) => void
  onDelete: (price: ResortRoomCategoryPrice) => void
}

export function ResortRoomCategoryPriceCard({ price, onEdit, onDelete }: ResortRoomCategoryPriceCardProps) {
  const typeName = `#${price.price_type_id}`
  const unitName = `#${price.price_unit_id}`

  const activeDays = DAYS.filter((d) => price[d.key])
  const allDays = activeDays.length === 7
  const weekdaysOnly = ["monday","tuesday","wednesday","thursday","friday"].every((d) => price[d as keyof typeof price]) &&
    !price.saturday && !price.sunday

  return (
    <div className="rounded-xl border bg-card hover:shadow-sm transition-shadow">
      {/* Top row: amount + type badge + actions */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-bold tabular-nums leading-none">
              {Number(price.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-muted-foreground font-medium">{unitName}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <Badge variant="secondary" className="text-xs font-medium">{typeName}</Badge>
            <span className="text-xs text-muted-foreground">priority {price.priority}</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(price)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(price)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* Days of week */}
        <div className="flex items-center gap-1.5">
          {allDays ? (
            <span className="text-xs text-muted-foreground font-medium">All days</span>
          ) : weekdaysOnly ? (
            <span className="text-xs text-muted-foreground font-medium">Weekdays</span>
          ) : (
            DAYS.map((d) => (
              <span
                key={d.key}
                className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold ${
                  price[d.key]
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground/40"
                }`}
              >
                {d.label}
              </span>
            ))
          )}
        </div>

        {/* Validity period */}
        {(price.valid_from || price.valid_to) && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            {price.valid_from && price.valid_to
              ? `${formatDate(price.valid_from)} – ${formatDate(price.valid_to)}`
              : price.valid_from
              ? `From ${formatDate(price.valid_from)}`
              : `Until ${formatDate(price.valid_to!)}`}
          </div>
        )}
      </div>
    </div>
  )
}
