"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { BedDouble, Check, ChevronDown, Cigarette, Loader2, Minus, PawPrint, Pencil, Plus, X } from "lucide-react"
import { Button, Card, CardContent, Dialog, DialogContent, DialogTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@resort/shadcn-ui"
import { resortRoomCategoriesService } from "@/services/resort-room-categories"
import { platformRoomCategoriesService, type PlatformRoomCategorySummary } from "@/services/platform-room-categories"
import type { Unit } from "@/services/units"
import { UnitPickerDialog } from "@/components/units/unit-picker-dialog"
import { toast } from "sonner"
import type { ResortRoomCategoryDialogMode, ResortRoomCategoryFormState } from "./types"

const PLAT_PAGE_SIZE = 20

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
      <Select value={h12} onValueChange={(h) => onChange(`${to24h(h, ampm)}:${mm}`)} disabled={disabled}>
        <SelectTrigger className="w-16 font-mono justify-center gap-0 [&>svg]:hidden">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-48">
          {HOURS_12.map((h) => <SelectItem key={h} value={h} className="font-mono">{h}</SelectItem>)}
        </SelectContent>
      </Select>

      <span className="text-sm text-muted-foreground font-semibold select-none">:</span>

      <Select value={mm} onValueChange={(m) => onChange(`${to24h(h12, ampm)}:${m}`)} disabled={disabled}>
        <SelectTrigger className="w-16 font-mono justify-center gap-0 [&>svg]:hidden">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-48">
          {MINUTES.map((m) => <SelectItem key={m} value={m} className="font-mono">{m}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="flex rounded-md border overflow-hidden text-xs font-medium">
        {(["AM", "PM"] as const).map((period, i) => (
          <button
            key={period}
            type="button"
            disabled={disabled}
            onClick={() => onChange(`${to24h(h12, period)}:${mm}`)}
            className={`px-2.5 py-1.5 transition-colors disabled:cursor-default ${i > 0 ? "border-l" : ""} ${
              ampm === period ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted/40"
            }`}
          >
            {period}
          </button>
        ))}
      </div>
    </div>
  )
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
      <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
        value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      }`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className={`text-xs font-semibold leading-tight ${value ? "text-primary" : "text-muted-foreground"}`}>
        {label}
      </span>
    </button>
  )
}

function Counter({
  label,
  value,
  onChange,
  disabled,
  min = 0,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  disabled: boolean
  min?: number
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-xs font-medium shrink-0">{label}</Label>
      <div className="flex items-center gap-2">
        <Button type="button" size="icon" variant="outline" className="h-8 w-8 shrink-0"
          disabled={disabled || value <= min}
          onClick={() => onChange(value - 1)}>
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-8 text-center text-sm font-medium tabular-nums">{value}</span>
        <Button type="button" size="icon" variant="outline" className="h-8 w-8 shrink-0"
          disabled={disabled}
          onClick={() => onChange(value + 1)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
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
  const [localSortOrder, setLocalSortOrder] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Platform room category picker
  const [platCategories, setPlatCategories] = useState<PlatformRoomCategorySummary[]>([])
  const [platPage, setPlatPage] = useState(0)
  const [platHasNext, setPlatHasNext] = useState(false)
  const [platLoading, setPlatLoading] = useState(false)
  const [platSearch, setPlatSearch] = useState("")
  const [platDialogOpen, setPlatDialogOpen] = useState(false)
  const platLoadedRef = useRef(false)

  // Unit picker (create mode only, for room_size_unit)
  const [selectedRoomSizeUnit, setSelectedRoomSizeUnit] = useState<Unit | null>(null)
  const [unitPickerOpen, setUnitPickerOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      setSubmitting(false)
      setPlatCategories([])
      setPlatPage(0)
      setPlatHasNext(false)
      setPlatSearch("")
      setPlatDialogOpen(false)
      platLoadedRef.current = false
      setSelectedRoomSizeUnit(null)
      setUnitPickerOpen(false)
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

  function startEdit() {
    setLocalSortOrder(form.sort_order)
    onEditingChange(true)
  }

  async function save() {
    if (resortRoomCategoryId == null) return
    setSubmitting(true)
    try {
      await resortRoomCategoriesService.update(resortId, resortRoomCategoryId, {
        sort_order: Number(localSortOrder) || 0,
      })
      toast.success(t("resortRoomCategory.updated"))
      onEditingChange(false)
      onFormChange({ sort_order: Number(localSortOrder) || 0 })
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

  function patchForm(p: Partial<ResortRoomCategoryFormState>) {
    onFormChange(p)
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
          {mode !== "create" && form.room_category_id !== "" && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("resortRoomCategory.platformCategory")}</Label>
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <BedDouble className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate font-mono">{form.room_category_code || `#${form.room_category_id}`}</p>
                  <p className="text-xs text-muted-foreground font-mono">#{form.room_category_id}</p>
                </div>
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
                              room_category_code: c.code,
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
              value={editing ? localSortOrder : form.sort_order}
              onChange={(e) => {
                if (mode === "create") onFormChange({ sort_order: Number(e.target.value) })
                else setLocalSortOrder(Number(e.target.value))
              }}
              disabled={isReadOnly || noPlatformSelected}
            />
          </div>

          {/* ── Meta fields — create mode only ─────────────────────────────── */}
          {mode === "create" && (
            <>
              {/* Occupancy */}
              <div className="space-y-3">
                <Label className="text-xs font-medium">{t("resortRoomCategory.occupancy")} *</Label>
                <Counter label={t("resortRoomCategory.maxAdults")}   value={form.max_adults}   onChange={(v) => patchForm({ max_adults: v })}   disabled={fieldDisabled} min={1} />
                <Counter label={t("resortRoomCategory.maxChildren")} value={form.max_children} onChange={(v) => patchForm({ max_children: v })} disabled={fieldDisabled} />
                <Counter label={t("resortRoomCategory.maxInfants")}  value={form.max_infants}  onChange={(v) => patchForm({ max_infants: v })}  disabled={fieldDisabled} />
                <Counter label={t("resortRoomCategory.maxOccupancy")} value={form.max_occupancy} onChange={(v) => patchForm({ max_occupancy: v })} disabled={fieldDisabled} min={1} />
              </div>

              {/* Room size */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">{t("resortRoomCategory.roomSize")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.room_size}
                    onChange={(e) => patchForm({ room_size: e.target.value })}
                    placeholder="e.g. 32"
                    disabled={fieldDisabled}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 gap-1.5 font-normal min-w-[120px] justify-between"
                    disabled={fieldDisabled}
                    onClick={() => setUnitPickerOpen(true)}
                  >
                    <span className={selectedRoomSizeUnit ? "" : "text-muted-foreground"}>
                      {selectedRoomSizeUnit ? (selectedRoomSizeUnit.symbol || selectedRoomSizeUnit.code) : t("resortRoomCategory.selectUnit")}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </div>
              </div>

              {/* Bedroom / Bathroom count */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t("resortRoomCategory.bedroomCount")}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.bedroom_count}
                    onChange={(e) => patchForm({ bedroom_count: e.target.value })}
                    placeholder="0"
                    disabled={fieldDisabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t("resortRoomCategory.bathroomCount")}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.bathroom_count}
                    onChange={(e) => patchForm({ bathroom_count: e.target.value })}
                    placeholder="0"
                    disabled={fieldDisabled}
                  />
                </div>
              </div>

              {/* Check-in / Check-out times */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-xs font-medium shrink-0">{t("resortRoomCategory.checkInTime")}</Label>
                  <TimeHHMM value={form.default_check_in_time} onChange={(v) => patchForm({ default_check_in_time: v })} disabled={fieldDisabled} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-xs font-medium shrink-0">{t("resortRoomCategory.checkOutTime")}</Label>
                  <TimeHHMM value={form.default_check_out_time} onChange={(v) => patchForm({ default_check_out_time: v })} disabled={fieldDisabled} />
                </div>
              </div>

              {/* Policies */}
              <div className="space-y-3">
                <Label className="text-xs font-medium">{t("resortRoomCategory.policies")}</Label>
                <div className="grid grid-cols-3 gap-3">
                  <PolicyCard icon={BedDouble} label={t("resortRoomCategory.extraBedAllowed")} value={form.is_extra_bed_allowed} onChange={(v) => patchForm({ is_extra_bed_allowed: v })} disabled={fieldDisabled} />
                  <PolicyCard icon={Cigarette} label={t("resortRoomCategory.smokingAllowed")} value={form.is_smoking_allowed} onChange={(v) => patchForm({ is_smoking_allowed: v })} disabled={fieldDisabled} />
                  <PolicyCard icon={PawPrint} label={t("resortRoomCategory.petsAllowed")} value={form.is_pets_allowed} onChange={(v) => patchForm({ is_pets_allowed: v })} disabled={fieldDisabled} />
                </div>
              </div>

              {form.is_extra_bed_allowed && (
                <Counter label={t("resortRoomCategory.maxExtraBeds")} value={form.max_extra_beds} onChange={(v) => patchForm({ max_extra_beds: v })} disabled={fieldDisabled} />
              )}

              {/* Min / Max stay */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t("resortRoomCategory.minimumStayNights")}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.minimum_stay_nights}
                    onChange={(e) => patchForm({ minimum_stay_nights: e.target.value })}
                    placeholder="—"
                    disabled={fieldDisabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t("resortRoomCategory.maximumStayNights")}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.maximum_stay_nights}
                    onChange={(e) => patchForm({ maximum_stay_nights: e.target.value })}
                    placeholder="—"
                    disabled={fieldDisabled}
                  />
                </div>
              </div>
            </>
          )}

        </CardContent>
      </Card>

      <UnitPickerDialog
        open={unitPickerOpen}
        onOpenChange={setUnitPickerOpen}
        selectedId={selectedRoomSizeUnit?.id}
        onSelect={(u) => {
          setSelectedRoomSizeUnit(u)
          patchForm({ room_size_unit_id: u.id })
          setUnitPickerOpen(false)
        }}
      />
    </div>
  )
}
