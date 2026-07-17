"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, Star } from "lucide-react"
import {
  Button, Checkbox, Dialog, DialogContent, DialogTitle, Label,
} from "@resort/shadcn-ui"
import { toast } from "sonner"
import { resortFacilitiesService, type ResortFacilitySummary } from "@/services/resort-facilities"
import { LucideIconRenderer } from "ui-blocks"

const MIN_HIGHLIGHTS = 4
const MAX_HIGHLIGHTS = 9
const LOAD_SIZE = 50

export interface ResortFacilityHighlightsDialogProps {
  resortId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void | Promise<void>
}

export function ResortFacilityHighlightsDialog({
  resortId,
  open,
  onOpenChange,
  onSaved,
}: ResortFacilityHighlightsDialogProps) {
  const { t } = useTranslation()
  const [facilities, setFacilities] = useState<ResortFacilitySummary[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!open) {
      setFacilities([])
      setSelectedIds(new Set())
      setCurrentPage(0)
      setHasMore(false)
      loadedRef.current = false
      return
    }
    loadPage(0, true)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadPage(page: number, reset = false) {
    setLoading(true)
    try {
      const res = await resortFacilitiesService.list(resortId, {
        page,
        size: LOAD_SIZE,
        sort_by: "sortOrder",
        sort_dir: "ASC",
      })
      const next = reset ? res.data : [...facilities, ...res.data]
      setFacilities(next)
      setCurrentPage(page)
      setHasMore(res.has_next)

      if (reset) {
        setSelectedIds(new Set(res.data.filter((f) => f.is_highlighted).map((f) => f.id)))
      } else {
        setSelectedIds((prev) => {
          const n = new Set(prev)
          res.data.filter((f) => f.is_highlighted).forEach((f) => n.add(f.id))
          return n
        })
      }
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function toggle(id: number) {
    setSelectedIds((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  async function handleSubmit() {
    const ids = Array.from(selectedIds)
    if (ids.length < MIN_HIGHLIGHTS) {
      toast.error(t("resortFacility.highlightMin", { min: MIN_HIGHLIGHTS }))
      return
    }
    if (ids.length > MAX_HIGHLIGHTS) {
      toast.error(t("resortFacility.highlightMax", { max: MAX_HIGHLIGHTS }))
      return
    }
    setSubmitting(true)
    try {
      await resortFacilitiesService.setHighlights(resortId, { facility_ids: ids })
      toast.success(t("resortFacility.highlightsSaved"))
      onOpenChange(false)
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const count = selectedIds.size
  const countValid = count >= MIN_HIGHLIGHTS && count <= MAX_HIGHLIGHTS
  const countColor = count === 0
    ? "text-muted-foreground"
    : countValid
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-destructive"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogTitle className="sr-only">{t("resortFacility.manageHighlights")}</DialogTitle>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
            <Star className="h-4 w-4 fill-current" />
          </div>
          <div>
            <p className="text-sm font-semibold">{t("resortFacility.manageHighlights")}</p>
            <p className="text-xs text-muted-foreground">{t("resortFacility.highlightsSubtitle", { min: MIN_HIGHLIGHTS, max: MAX_HIGHLIGHTS })}</p>
          </div>
        </div>

        {/* Count indicator */}
        <div className="px-6 py-3 border-b shrink-0 flex items-center gap-2">
          <span className={["text-sm font-medium tabular-nums", countColor].join(" ")}>
            {t("resortFacility.highlightCount", { count, max: MAX_HIGHLIGHTS })}
          </span>
          {!countValid && count > 0 && (
            <span className="text-xs text-destructive">
              {count < MIN_HIGHLIGHTS
                ? t("resortFacility.highlightMin", { min: MIN_HIGHLIGHTS })
                : t("resortFacility.highlightMax", { max: MAX_HIGHLIGHTS })}
            </span>
          )}
        </div>

        {/* Facility list */}
        <div className="flex-1 overflow-y-auto">
          {loading && facilities.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : facilities.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground">
              {t("resortFacility.empty")}
            </div>
          ) : (
            <div className="divide-y">
              {facilities.map((f) => {
                const name = f.locales[0]?.name ?? `Facility #${f.id}`
                const accentColor = String(f.icon_meta?.color ?? "") || undefined
                const checked = selectedIds.has(f.id)
                const wouldExceed = !checked && count >= MAX_HIGHLIGHTS

                return (
                  <Label
                    key={f.id}
                    htmlFor={`hl-${f.id}`}
                    className={[
                      "flex items-center gap-3 px-6 py-3 select-none transition-colors",
                      wouldExceed ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-accent/50",
                      checked ? "bg-amber-50/60 dark:bg-amber-950/20" : "",
                    ].join(" ")}
                  >
                    <Checkbox
                      id={`hl-${f.id}`}
                      checked={checked}
                      disabled={wouldExceed}
                      onCheckedChange={() => !wouldExceed && toggle(f.id)}
                      className="shrink-0 data-checked:bg-amber-500 data-checked:border-amber-500"
                    />

                    <div
                      className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0"
                      style={{
                        background: accentColor ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` : undefined,
                        boxShadow: accentColor ? `0 4px 14px -4px ${accentColor}80` : undefined,
                      }}
                    >
                      {f.icon_type === "LUCIDE" && f.icon_value ? (
                        <LucideIconRenderer name={f.icon_value} size={16} style={{ color: "white" }} />
                      ) : (f.icon_type === "IMAGE" || f.icon_type === "EXTERNAL") && f.icon_value ? (
                        <img src={f.icon_value} alt={name} className="h-4 w-4 object-contain" />
                      ) : (
                        <span className="font-mono text-xs font-semibold text-white">{name[0]?.toUpperCase() ?? "?"}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {f.facility_id ? `Platform #${f.facility_id}` : t("resortFacility.custom")}
                        {" · "}#{f.sort_order}
                      </p>
                    </div>

                    {checked && (
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-current shrink-0" />
                    )}
                  </Label>
                )
              })}

              {hasMore && (
                <div className="px-6 py-3 flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={loading}
                    onClick={() => loadPage(currentPage + 1)}
                    className="text-xs gap-1.5"
                  >
                    {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {t("common.loadMore")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !countValid}
            className="bg-amber-500 hover:bg-amber-600 text-white border-0"
          >
            {submitting ? t("common.saving") : t("resortFacility.saveHighlights")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
