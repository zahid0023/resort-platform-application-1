"use client"

import { CalendarRange, Layers, Pencil, Trash2, TrendingDown } from "lucide-react"
import { Button } from "@resort/shadcn-ui"
import type { ResortRoomCategoryPrice, PriceTypeCode } from "@/services/resort-room-category-prices"

const TYPE_COLORS: Record<PriceTypeCode, string> = {
  BAS: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  WKD: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  WKE: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  HOL: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  SPE: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
}

const DAY_LABELS: Record<number, string> = {
  1: "Mo", 2: "Tu", 3: "We", 4: "Th", 5: "Fr", 6: "Sa", 7: "Su",
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  })
}

export interface ResortRoomCategoryPriceCardProps {
  price: ResortRoomCategoryPrice
  onEdit: (price: ResortRoomCategoryPrice) => void
  onDelete: (price: ResortRoomCategoryPrice) => void
}

export function ResortRoomCategoryPriceCard({ price, onEdit, onDelete }: ResortRoomCategoryPriceCardProps) {
  const typeCode = price.price_type.code as PriceTypeCode
  const typeColor = TYPE_COLORS[typeCode] ?? TYPE_COLORS.BAS
  const typeName = price.price_type.locales[0]?.name ?? typeCode
  const unitName = price.price_unit.locales[0]?.name ?? price.price_unit.code
  const currencyName = price.currency.locales[0]?.name ?? price.currency.code
  const hasDiscount = price.discount_amount != null && price.discount_percentage != null

  return (
    <div className="rounded-xl border bg-card transition-shadow hover:shadow-sm">
      <div className="flex items-start gap-3 p-4">

        {/* Type badge */}
        <div className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide ${typeColor}`}>
          {typeCode}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {/* Name + type label */}
              <div className="flex flex-wrap items-baseline gap-1.5">
                <p className="truncate text-sm font-semibold leading-tight">{price.name}</p>
                <span className="text-[11px] text-muted-foreground/70">{typeName}</span>
              </div>

              {/* Price row */}
              <div className="mt-1.5 flex flex-wrap items-baseline gap-1.5">
                <span className="text-base font-bold text-muted-foreground">{price.currency.symbol}</span>
                <span className="text-lg font-bold tabular-nums">
                  {Number(price.price).toLocaleString(undefined, {
                    minimumFractionDigits: price.currency.decimal_places,
                    maximumFractionDigits: price.currency.decimal_places,
                  })}
                </span>
                <span className="font-mono text-xs font-semibold text-muted-foreground">{price.currency.code}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Layers className="h-3 w-3 shrink-0" />
                  {unitName}
                </span>
                <span className="ml-1 font-mono text-[11px] text-muted-foreground/50">p:{price.priority}</span>
              </div>

              {/* Currency full name */}
              <p className="mt-0.5 text-[11px] text-muted-foreground/60">{currencyName}</p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-0.5">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(price)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete(price)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Description */}
          {price.description && (
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{price.description}</p>
          )}

          {/* Days of week */}
          {price.day_of_week_ids && price.day_of_week_ids.length > 0 && (
            <div className="mt-2.5 flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <span
                  key={d}
                  className={`flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold ${
                    price.day_of_week_ids!.includes(d)
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground/30"
                  }`}
                >
                  {DAY_LABELS[d]}
                </span>
              ))}
            </div>
          )}

          {/* Date range */}
          {(price.valid_from || price.valid_to) && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarRange className="h-3 w-3 shrink-0" />
              <span>
                {price.valid_from && price.valid_to
                  ? `${formatDate(price.valid_from)} – ${formatDate(price.valid_to)}`
                  : price.valid_from
                  ? `From ${formatDate(price.valid_from)}`
                  : `Until ${formatDate(price.valid_to!)}`}
              </span>
            </div>
          )}

          {/* Discount info */}
          {hasDiscount && (
            <div className="mt-2 flex items-center gap-1.5">
              <TrendingDown className="h-3 w-3 shrink-0 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {Number(price.discount_percentage).toFixed(0)}% off base · saves{" "}
                {price.currency.symbol}{Number(price.discount_amount).toLocaleString(undefined, {
                  minimumFractionDigits: price.currency.decimal_places,
                  maximumFractionDigits: price.currency.decimal_places,
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
