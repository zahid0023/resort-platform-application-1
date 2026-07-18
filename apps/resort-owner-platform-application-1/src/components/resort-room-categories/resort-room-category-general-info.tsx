"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { BedDouble, Check, ChevronDown, Cigarette, Loader2, Minus, PawPrint, Pencil, Plus, X } from "lucide-react"
import { Button, Card, CardContent, Dialog, DialogContent, DialogTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@resort/shadcn-ui"
import { resortRoomCategoriesService } from "@/services/resort-room-categories"
import { platformRoomCategoriesService, type PlatformRoomCategorySummary } from "@/services/platform-room-categories"
import { toast } from "sonner"
import type { ResortRoomCategoryDialogMode, ResortRoomCategoryFormState } from "./types"

const PLAT_PAGE_SIZE = 20

interface LocalState {
  sort_order: number
  max_adults: number
  max_children: number
  max_occupancy: number
  default_check_in_time: string
  default_check_out_time: string
  is_extra_bed_allowed: boolean
  max_extra_beds: number
  is_smoking_allowed: boolean
  is_pets_allowed: boolean
}

function PolicyCard({
  icon: Icon,
  label,
  value,
  onChange,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: boolean
  onChange: (v: boolean) => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={`relative flex flex-col items-center gap-2.5 rounded-xl border p-4 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50
        ${value
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
        }`}
    >
      {value && (
        <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
          <Check className="h-2.5 w-2.5 text-primary-foreground" />
        </span>
      )}
      <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors
        ${value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className={`text-xs font-semibold leading-tight ${value ? "text-primary" : "text-muted-foreground"}`}>
        {label}
      </span>
    </button>
  )
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

function to12h(h24: number): { h12: string; ampm: "AM" | "PM" } {
  if (h24 === 0) return { h12: "12", ampm: "AM" }
  if (h24 < 12) return { h12: String(h24).padStart(2, "0"), ampm: "AM" }
  if (h24 === 12) return { h12: "12", ampm: "PM" }
  return { h12: String(h24 - 12).padStart(2, "0"), ampm: "PM" }
}

function to24h(h12: string, ampm: "AM" | "PM"): string {
  const n = parseInt(h12, 10)
  if (ampm === "AM") return String(n === 12 ? 0 : n).padStart(2, "0")
  return String(n === 12 ? 12 : n + 12).padStart(2, "0")
}

function TimeHHMM({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  const [rawHH, rawMM] = (value || "").split(":")
  const h24 = parseInt(rawHH ?? "0", 10) || 0
  const mm = rawMM?.padStart(2, "0") ?? "00"
  const { h12, ampm } = to12h(h24)

  return (
    <div className="flex items-center gap-1.5">
      <Select
        value={h12}
        onValueChange={(h) => onChange(`${to24h(h, ampm)}:${mm}`)}
        disabled={disabled}
      >
        <SelectTrigger className="w-16 font-mono justify-center gap-0 [&>svg]:hidden">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-48">
          {HOURS_12.map((h) => (
            <SelectItem key={h} value={h} className="font-mono">{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-sm text-muted-foreground font-semibold select-none">:</span>

      <Select
        value={mm}
        onValueChange={(m) => onChange(`${to24h(h12, ampm)}:${m}`)}
        disabled={disabled}
      >
        <SelectTrigger className="w-16 font-mono justify-center gap-0 [&>svg]:hidden">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-48">
          {MINUTES.map((m) => (
            <SelectItem key={m} value={m} className="font-mono">{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex rounded-md border overflow-hidden text-xs font-medium">
        {(["AM", "PM"] as const).map((period, i) => (
          <button
            key={period}
            type="button"
            disabled={disabled}
            onClick={() => onChange(`${to24h(h12, period)}:${mm}`)}
            className={`px-2.5 py-1.5 transition-colors disabled:cursor-default
              ${i > 0 ? "border-l" : ""}
              ${ampm === period
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted/40"
              }`}
          >
            {period}
          </button>
        ))}
      </div>
    </div>
  )
}

function BooleanToggle({
  value,
  onChange,
  readOnly,
  yesLabel = "Yes",
  noLabel = "No",
}: {
  value: boolean
  onChange: (v: boolean) => void
  readOnly: boolean
  yesLabel?: string
  noLabel?: string
}) {
  return (
    <div className="flex rounded-md border overflow-hidden text-sm">
      <button
        type="button"
        disabled={readOnly}
        onClick={() => onChange(true)}
        className={`flex-1 py-2 transition-colors ${value ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted/40"} disabled:cursor-default`}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        disabled={readOnly}
        onClick={() => onChange(false)}
        className={`flex-1 py-2 border-l transition-colors ${!value ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted/40"} disabled:cursor-default`}
      >
        {noLabel}
      </button>
    </div>
  )
}

export interface ResortRoomCategoryGeneralInfoProps {
  resortId: number
  mode: ResortRoomCategoryDialogMode
  form: ResortRoomCategoryFormState
  onFormChange: (patch: Partial<ResortRoomCategoryFormState>) => void
  resortRoomCategoryId?: number
  onSaved?: () => void | Promise<void>
  editing: boolean
  onEditingChange: (v: boolean) => void
  open: boolean
}

export function ResortRoomCategoryGeneralInfo({
  resortId,
  mode,
  form,
  onFormChange,
  resortRoomCategoryId,
  onSaved,
  editing,
  onEditingChange,
  open,
}: ResortRoomCategoryGeneralInfoProps) {
  const { t } = useTranslation()
  const [local, setLocal] = useState<LocalState>({
    sort_order: 0,
    max_adults: 2,
    max_children: 0,
    max_occupancy: 2,
    default_check_in_time: "",
    default_check_out_time: "",
    is_extra_bed_allowed: false,
    max_extra_beds: 0,
    is_smoking_allowed: false,
    is_pets_allowed: false,
  })
  const [submitting, setSubmitting] = useState(false)

  // Platform room category picker
  const [platCategories, setPlatCategories] = useState<PlatformRoomCategorySummary[]>([])
  const [platPage, setPlatPage] = useState(0)
  const [platHasNext, setPlatHasNext] = useState(false)
  const [platLoading, setPlatLoading] = useState(false)
  const [platSearch, setPlatSearch] = useState("")
  const [platDialogOpen, setPlatDialogOpen] = useState(false)
  const platLoadedRef = useRef(false)

  useEffect(() => {
    if (!open) {
      setSubmitting(false)
      setPlatCategories([])
      setPlatPage(0)
      setPlatHasNext(false)
      setPlatSearch("")
      setPlatDialogOpen(false)
      platLoadedRef.current = false
    } else if (mode !== "create" && !platLoadedRef.current && form.room_category_id !== "") {
      platLoadedRef.current = true
      loadPlatCategories(0, true)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadPlatCategories(page: number, reset = false) {
    setPlatLoading(true)
    try {
      const res = await platformRoomCategoriesService.list({ page, size: PLAT_PAGE_SIZE, sort_by: "sortOrder" })
      setPlatCategories((prev) => (reset ? res.data : [...prev, ...res.data]))
      setPlatPage(page)
      setPlatHasNext(res.has_next)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setPlatLoading(false)
    }
  }

  function openPlatDialog() {
    setPlatDialogOpen(true)
    if (!platLoadedRef.current) {
      platLoadedRef.current = true
      loadPlatCategories(0, true)
    }
  }

  const filteredPlatCategories = platSearch.trim()
    ? platCategories.filter((c) => {
        const q = platSearch.toLowerCase()
        return c.code.toLowerCase().includes(q) || (c.locales[0]?.name ?? "").toLowerCase().includes(q)
      })
    : platCategories

  const selectedPlatCategory = platCategories.find((c) => c.id === form.room_category_id)
  const selectedPlatLabel = selectedPlatCategory
    ? `${selectedPlatCategory.locales[0]?.name ?? selectedPlatCategory.code} (${selectedPlatCategory.code})`
    : t("resortRoomCategory.selectPlatformCategory")

  // Edit handlers
  function startEdit() {
    setLocal({
      sort_order: form.sort_order,
      max_adults: form.max_adults,
      max_children: form.max_children,
      max_occupancy: form.max_occupancy,
      default_check_in_time: form.default_check_in_time,
      default_check_out_time: form.default_check_out_time,
      is_extra_bed_allowed: form.is_extra_bed_allowed,
      max_extra_beds: form.max_extra_beds,
      is_smoking_allowed: form.is_smoking_allowed,
      is_pets_allowed: form.is_pets_allowed,
    })
    onEditingChange(true)
  }

  async function save() {
    if (resortRoomCategoryId == null) return
    const adults = Number(local.max_adults) || 1
    const children = Number(local.max_children) || 0
    const occupancy = Number(local.max_occupancy) || 1
    if (occupancy < adults + children) {
      toast.error(t("resortRoomCategory.errOccupancy"))
      return
    }
    setSubmitting(true)
    try {
      await resortRoomCategoriesService.update(resortId, resortRoomCategoryId, {
        sort_order: Number(local.sort_order) || 0,
        max_adults: adults,
        max_children: children,
        max_occupancy: occupancy,
        default_check_in_time: local.default_check_in_time || null,
        default_check_out_time: local.default_check_out_time || null,
        is_extra_bed_allowed: local.is_extra_bed_allowed,
        max_extra_beds: Number(local.max_extra_beds) || 0,
        is_smoking_allowed: local.is_smoking_allowed,
        is_pets_allowed: local.is_pets_allowed,
      })
      toast.success(t("resortRoomCategory.updated"))
      onEditingChange(false)
      onFormChange({
        sort_order: Number(local.sort_order) || 0,
        max_adults: adults,
        max_children: children,
        max_occupancy: occupancy,
        default_check_in_time: local.default_check_in_time,
        default_check_out_time: local.default_check_out_time,
        is_extra_bed_allowed: local.is_extra_bed_allowed,
        max_extra_beds: Number(local.max_extra_beds) || 0,
        is_smoking_allowed: local.is_smoking_allowed,
        is_pets_allowed: local.is_pets_allowed,
      })
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const isReadOnly = !editing && mode !== "create"
  const noPlatformSelected = mode === "create" && !form.room_category_id
  const fieldDisabled = isReadOnly || noPlatformSelected
  const vals = editing ? local : form

  function patch(p: Partial<LocalState>) {
    if (mode === "create") {
      onFormChange(p)
    } else {
      setLocal((prev) => ({ ...prev, ...p }))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("common.generalInfo")}
          </h3>
        </div>
        {mode !== "create" && !editing && (
          <Button type="button" size="sm" variant="outline" onClick={startEdit} className="h-7 text-xs px-2.5 gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
          </Button>
        )}
        {editing && (
          <div className="flex items-center gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={() => onEditingChange(false)} disabled={submitting} className="h-7 text-xs px-2.5 gap-1.5">
              <X className="h-3.5 w-3.5" /> {t("common.cancel")}
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={submitting} className="h-7 text-xs px-2.5 gap-1.5">
              <Check className="h-3.5 w-3.5" />
              {submitting ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="space-y-4">

          {/* Platform room category picker — create mode */}
          {mode === "create" && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("resortRoomCategory.platformCategory")} *</Label>
              <Button type="button" variant="outline" className="w-full justify-between font-normal" onClick={openPlatDialog}>
                <span className={form.room_category_id ? "" : "text-muted-foreground"}>{selectedPlatLabel}</span>
                <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
              </Button>
            </div>
          )}

          {/* Platform room category — view mode */}
          {mode !== "create" && selectedPlatCategory && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("resortRoomCategory.platformCategory")}</Label>
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <BedDouble className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{selectedPlatCategory.locales[0]?.name ?? selectedPlatCategory.code}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedPlatCategory.code} · #{selectedPlatCategory.id}</p>
                </div>
              </div>
            </div>
          )}
          {mode !== "create" && !selectedPlatCategory && form.room_category_id !== "" && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("resortRoomCategory.platformCategory")}</Label>
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                {platLoading
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  : <span className="text-sm font-mono">#{form.room_category_id}</span>
                }
              </div>
            </div>
          )}

          {/* Platform room category picker dialog */}
          <Dialog open={platDialogOpen} onOpenChange={(v) => { setPlatDialogOpen(v); if (!v) setPlatSearch("") }}>
            <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden flex flex-col max-h-[80vh]" onInteractOutside={(e) => e.preventDefault()}>
              <DialogTitle className="sr-only">{t("resortRoomCategory.selectPlatformCategory")}</DialogTitle>
              <div className="px-5 pt-5 pb-4 border-b shrink-0">
                <p className="text-sm font-semibold mb-3">{t("resortRoomCategory.selectPlatformCategory")}</p>
                <Input
                  placeholder={t("resortRoomCategory.searchPlatformCategory")}
                  value={platSearch}
                  onChange={(e) => setPlatSearch(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                />
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {platLoading && platCategories.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredPlatCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">{t("resortRoomCategory.noPlatformCategories")}</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredPlatCategories.map((c) => {
                      const name = c.locales[0]?.name ?? c.code
                      const desc = c.locales[0]?.description
                      const isSelected = form.room_category_id === c.id
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            onFormChange({
                              room_category_id: c.id,
                              locales: c.locales.map((l) => ({
                                locale_id: l.locale_id,
                                name: l.name,
                                description: l.description ?? "",
                                sort_order: l.sort_order,
                                _new: true,
                              })),
                            })
                            setPlatDialogOpen(false)
                            setPlatSearch("")
                          }}
                          className={`text-left rounded-lg border p-4 transition-all hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-card hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                              <BedDouble className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm truncate">{name}</span>
                                {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                              </div>
                              <span className="text-xs text-muted-foreground font-mono">{c.code}</span>
                              {desc && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{desc}</p>}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {platHasNext && !platSearch.trim() && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => loadPlatCategories(platPage + 1)}
                      disabled={platLoading}
                      className="gap-1.5"
                    >
                      {platLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {t("common.loadMore")}
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="rrc-code" className="text-xs font-medium">{t("resortRoomCategory.code")} {mode === "create" && "*"}</Label>
            <Input
              id="rrc-code"
              value={form.code}
              onChange={(e) => onFormChange({ code: e.target.value.toUpperCase() })}
              placeholder="DLX-KING"
              disabled={mode !== "create" || noPlatformSelected}
              className="font-mono"
            />
          </div>

          {/* Sort order */}
          <div className="space-y-2">
            <Label htmlFor="rrc-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
            <Input
              id="rrc-sort"
              type="number"
              min={0}
              value={vals.sort_order}
              onChange={(e) => patch({ sort_order: Number(e.target.value) })}
              disabled={fieldDisabled}
            />
          </div>

          {/* Occupancy */}
          <div className="space-y-3">
            {(
              [
                { key: "max_adults",   label: t("resortRoomCategory.maxAdults"),   min: 1 },
                { key: "max_children", label: t("resortRoomCategory.maxChildren"), min: 0 },
                { key: "max_occupancy",label: t("resortRoomCategory.maxOccupancy"),min: 1 },
              ] as const
            ).map(({ key, label, min }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <Label className="text-xs font-medium shrink-0">{label} *</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 shrink-0"
                    disabled={fieldDisabled || vals[key] <= min}
                    onClick={() => patch({ [key]: vals[key] - 1 })}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium tabular-nums">{vals[key]}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 shrink-0"
                    disabled={fieldDisabled}
                    onClick={() => patch({ [key]: vals[key] + 1 })}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Check-in / Check-out times */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Label className="text-xs font-medium shrink-0">{t("resortRoomCategory.checkInTime")}</Label>
              <TimeHHMM
                value={vals.default_check_in_time}
                onChange={(v) => patch({ default_check_in_time: v })}
                disabled={fieldDisabled}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label className="text-xs font-medium shrink-0">{t("resortRoomCategory.checkOutTime")}</Label>
              <TimeHHMM
                value={vals.default_check_out_time}
                onChange={(v) => patch({ default_check_out_time: v })}
                disabled={fieldDisabled}
              />
            </div>
          </div>

          {/* Policies */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">{t("resortRoomCategory.policies")} *</Label>
            <div className="grid grid-cols-3 gap-3">
              <PolicyCard
                icon={BedDouble}
                label={t("resortRoomCategory.extraBedAllowed")}
                value={vals.is_extra_bed_allowed}
                onChange={(v) => patch({ is_extra_bed_allowed: v })}
                disabled={fieldDisabled}
              />
              <PolicyCard
                icon={Cigarette}
                label={t("resortRoomCategory.smokingAllowed")}
                value={vals.is_smoking_allowed}
                onChange={(v) => patch({ is_smoking_allowed: v })}
                disabled={fieldDisabled}
              />
              <PolicyCard
                icon={PawPrint}
                label={t("resortRoomCategory.petsAllowed")}
                value={vals.is_pets_allowed}
                onChange={(v) => patch({ is_pets_allowed: v })}
                disabled={fieldDisabled}
              />
            </div>
          </div>

          {vals.is_extra_bed_allowed && (
            <div className="flex items-center justify-between gap-4">
              <Label className="text-xs font-medium shrink-0">{t("resortRoomCategory.maxExtraBeds")} *</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 shrink-0"
                  disabled={fieldDisabled || vals.max_extra_beds <= 0}
                  onClick={() => patch({ max_extra_beds: vals.max_extra_beds - 1 })}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="w-8 text-center text-sm font-medium tabular-nums">{vals.max_extra_beds}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 shrink-0"
                  disabled={fieldDisabled}
                  onClick={() => patch({ max_extra_beds: vals.max_extra_beds + 1 })}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
