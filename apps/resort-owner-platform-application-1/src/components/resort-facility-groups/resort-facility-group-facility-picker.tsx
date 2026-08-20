"use client"

import { useTranslation } from "react-i18next"
import { Check, Loader2 } from "lucide-react"
import { LucideIconRenderer } from "ui-blocks"
import type { PlatformFacilitySummary } from "@/services/platform-facilities"

export interface FacilityPickerProps {
  facilities: PlatformFacilitySummary[]
  loading: boolean
  /** Facilities already created for the group in this session — rendered as done, not re-selectable. */
  addedIds: Set<number>
  /** Selecting a not-yet-added facility opens the full create-facility dialog for it. */
  onSelect: (f: PlatformFacilitySummary) => void
}

export function FacilityPicker({ facilities, loading, addedIds, onSelect }: FacilityPickerProps) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (facilities.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground border rounded-xl border-dashed">
        {t("resortFacilityGroup.noFacilitiesInGroup")}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {facilities.map((f) => {
        const added = addedIds.has(f.id)
        const name = f.locale?.name ?? f.code
        const accentColor = String(f.icon_meta?.color ?? "") || undefined

        return (
          <button
            key={f.id}
            type="button"
            disabled={added}
            onClick={() => onSelect(f)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
              added
                ? "border-border bg-muted/30 cursor-default"
                : "border-border hover:bg-accent/40 hover:border-primary/50 cursor-pointer"
            }`}
          >
            <div
              className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0"
              style={{ background: accentColor ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` : undefined }}
            >
              {f.icon_type === "LUCIDE" && f.icon_value ? (
                <LucideIconRenderer name={f.icon_value} size={14} style={{ color: accentColor ? "white" : undefined }} />
              ) : (f.icon_type === "IMAGE" || f.icon_type === "EXTERNAL") && f.icon_value ? (
                <img src={f.icon_value} alt={name} className="h-4 w-4 object-contain" />
              ) : (
                <span className="text-xs font-mono font-semibold text-muted-foreground">{name[0]?.toUpperCase() ?? "?"}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight truncate">{name}</p>
              <p className="text-xs text-muted-foreground font-mono">{f.code}</p>
            </div>

            {added && (
              <span className="flex items-center gap-1 text-xs font-medium text-green-600 shrink-0">
                <Check className="h-3.5 w-3.5" /> {t("resortFacilityGroup.facilityAdded")}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
