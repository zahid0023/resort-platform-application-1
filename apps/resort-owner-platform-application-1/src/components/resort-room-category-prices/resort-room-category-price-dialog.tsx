"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Check, ChevronsUpDown, Info, Loader2, Lock, Tag, X } from "lucide-react"
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Input,
  Label,
} from "@resort/shadcn-ui"
import {
  resortRoomCategoryPricesService,
  type ResortRoomCategoryPrice,
  type PriceTypeCode,
  type CreatePriceRequest,
  type UpdatePriceRequest,
} from "@/services/resort-room-category-prices"
import { priceTypesService } from "@/services/price-types"
import type { PriceUnit } from "@/services/price-units"
import { PriceUnitPickerDialog } from "@/components/price-units/price-unit-picker-dialog"
import type { Currency } from "@/services/currencies"
import { CurrencyPickerDialog } from "@/components/currencies/currency-picker-dialog"

// ─── Type configuration ───────────────────────────────────────────────────────

interface TypeConfig {
  label: string
  desc: string
  gradient: string
  iconColor: string
  badgeColor: string
  hasDays: boolean
  daysRequired: boolean
  hasDates: boolean
  priorityEditable: boolean
  priorityMin: number
  defaultName: string
  defaultDays: number[]
}

const TYPE_CONFIG: Record<PriceTypeCode, TypeConfig> = {
  BAS: {
    label: "Base Rate",
    desc: "Your default rack rate. Used when no other rule applies.",
    gradient: "from-blue-500/15 via-blue-500/8 to-transparent",
    iconColor: "bg-blue-500/20 text-blue-500",
    badgeColor: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    hasDays: false,
    daysRequired: false,
    hasDates: false,
    priorityEditable: false,
    priorityMin: 0,
    defaultName: "Base Price",
    defaultDays: [],
  },
  WKD: {
    label: "Weekday Rate",
    desc: "Applied on your configured weekdays. Price must not exceed the base price.",
    gradient: "from-emerald-500/15 via-emerald-500/8 to-transparent",
    iconColor: "bg-emerald-500/20 text-emerald-500",
    badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    hasDays: true,
    daysRequired: true,
    hasDates: false,
    priorityEditable: false,
    priorityMin: 10,
    defaultName: "Weekday Price",
    defaultDays: [1, 2, 3, 4, 5],
  },
  WKE: {
    label: "Weekend Rate",
    desc: "Applied on your configured weekend days. Price must not exceed the base price.",
    gradient: "from-violet-500/15 via-violet-500/8 to-transparent",
    iconColor: "bg-violet-500/20 text-violet-500",
    badgeColor: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    hasDays: true,
    daysRequired: true,
    hasDates: false,
    priorityEditable: false,
    priorityMin: 20,
    defaultName: "Weekend Price",
    defaultDays: [6, 7],
  },
  HOL: {
    label: "Holiday Rate",
    desc: "Applied during holiday periods. Any price allowed.",
    gradient: "from-orange-500/15 via-orange-500/8 to-transparent",
    iconColor: "bg-orange-500/20 text-orange-500",
    badgeColor: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
    hasDays: true,
    daysRequired: false,
    hasDates: true,
    priorityEditable: true,
    priorityMin: 100,
    defaultName: "",
    defaultDays: [],
  },
  SPE: {
    label: "Special Rate",
    desc: "Promotional or event-specific pricing. Any price allowed.",
    gradient: "from-rose-500/15 via-rose-500/8 to-transparent",
    iconColor: "bg-rose-500/20 text-rose-500",
    badgeColor: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    hasDays: true,
    daysRequired: false,
    hasDates: true,
    priorityEditable: true,
    priorityMin: 200,
    defaultName: "",
    defaultDays: [],
  },
}

const DAY_LABELS: Record<number, string> = {
  1: "Mo", 2: "Tu", 3: "We", 4: "Th", 5: "Fr", 6: "Sa", 7: "Su",
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  price_type_id: number | ""
  currency_id: number | ""
  price_unit_id: number | ""
  name: string
  description: string
  price: string
  day_of_week_ids: number[]
  valid_from: string
  valid_to: string
  priority: string
}

function makeEmptyForm(code?: PriceTypeCode, suggestedCurrencyId?: number): FormState {
  const cfg = code ? TYPE_CONFIG[code] : null
  return {
    price_type_id: "",
    currency_id: suggestedCurrencyId ?? "",
    price_unit_id: "",
    name: cfg?.defaultName ?? "",
    description: "",
    price: "",
    day_of_week_ids: cfg?.defaultDays ?? [],
    valid_from: "",
    valid_to: "",
    priority: String(cfg?.priorityMin ?? 0),
  }
}

function formFromPrice(price: ResortRoomCategoryPrice): FormState {
  return {
    price_type_id: price.price_type.id,
    currency_id: price.currency.id,
    price_unit_id: price.price_unit.id,
    name: price.name,
    description: price.description ?? "",
    price: String(price.price),
    day_of_week_ids: price.day_of_week_ids ?? [],
    valid_from: price.valid_from ?? "",
    valid_to: price.valid_to ?? "",
    priority: String(price.priority),
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ResortRoomCategoryPriceDialogProps {
  resortId: number
  resortRoomCategoryId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  /** Existing price — required in edit mode */
  price?: ResortRoomCategoryPrice
  /** Which type to create — required in create mode */
  priceTypeCode?: PriceTypeCode
  /** Pre-fill currency for WKD / WKE guided creation (makes the field read-only) */
  suggestedCurrencyId?: number
  onSaved: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ResortRoomCategoryPriceDialog({
  resortId,
  resortRoomCategoryId,
  open,
  onOpenChange,
  mode,
  price,
  priceTypeCode,
  suggestedCurrencyId,
  onSaved,
}: ResortRoomCategoryPriceDialogProps) {
  const isEdit = mode === "edit"
  const activeCode: PriceTypeCode | undefined = isEdit ? price?.price_type.code as PriceTypeCode : priceTypeCode
  const cfg = activeCode ? TYPE_CONFIG[activeCode] : null

  // Currency field is locked for WKD/WKE when the section provides a suggested currency
  const currencyLocked =
    isEdit ||
    (mode === "create" && suggestedCurrencyId != null && (activeCode === "WKD" || activeCode === "WKE"))

  const [form, setForm] = useState<FormState>(makeEmptyForm())
  const [submitting, setSubmitting] = useState(false)
  const [typeLoading, setTypeLoading] = useState(false)

  const [priceUnitPickerOpen, setPriceUnitPickerOpen] = useState(false)
  const [selectedPriceUnit, setSelectedPriceUnit] = useState<PriceUnit | undefined>()

  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | undefined>()

  // ── Reset & seed on open ──────────────────────────────────────────────────

  useEffect(() => {
    if (!open) {
      setForm(makeEmptyForm())
      setSelectedPriceUnit(undefined)
      setSelectedCurrency(undefined)
      return
    }

    if (isEdit && price) {
      setForm(formFromPrice(price))
      setSelectedCurrency(price.currency)
      setSelectedPriceUnit(price.price_unit)
    } else if (priceTypeCode) {
      setForm(makeEmptyForm(priceTypeCode, suggestedCurrencyId))
      resolveTypeId(priceTypeCode)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function resolveTypeId(code: PriceTypeCode) {
    setTypeLoading(true)
    try {
      const res = await priceTypesService.list({ code, size: 1 })
      const found = res.data[0]
      if (found) {
        setForm((prev) => ({ ...prev, price_type_id: found.id }))
      } else {
        toast.error(`Price type "${code}" is not configured on this platform.`)
      }
    } catch {
      toast.error("Failed to load price type.")
    } finally {
      setTypeLoading(false)
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function patch(p: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...p }))
  }

  function toggleDay(id: number) {
    setForm((prev) => ({
      ...prev,
      day_of_week_ids: prev.day_of_week_ids.includes(id)
        ? prev.day_of_week_ids.filter((d) => d !== id)
        : [...prev.day_of_week_ids, id],
    }))
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.name.trim()) { toast.error("Name is required."); return }
    const priceNum = parseFloat(form.price)
    if (isNaN(priceNum) || priceNum < 0) { toast.error("Price must be 0 or greater."); return }
    if (!form.price_unit_id) { toast.error("Please select a price unit."); return }
    if (!isEdit && !form.currency_id) { toast.error("Please select a currency."); return }
    if (cfg?.hasDays && cfg.daysRequired && form.day_of_week_ids.length === 0) {
      toast.error("Please select at least one day."); return
    }
    if (cfg?.hasDates) {
      if (!form.valid_from || !form.valid_to) {
        toast.error("Both Valid From and Valid To are required."); return
      }
      if (form.valid_to < form.valid_from) {
        toast.error("Valid To must be on or after Valid From."); return
      }
    }
    if (cfg?.priorityEditable) {
      const pri = parseInt(form.priority, 10)
      if (isNaN(pri) || pri < cfg.priorityMin) {
        toast.error(`Priority must be at least ${cfg.priorityMin}.`); return
      }
    }

    setSubmitting(true)
    try {
      if (isEdit && price) {
        const body: UpdatePriceRequest = {
          price_unit_id: Number(form.price_unit_id),
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: priceNum,
          ...(cfg?.hasDays && (cfg.daysRequired || form.day_of_week_ids.length > 0) && { day_of_week_ids: form.day_of_week_ids }),
          ...(cfg?.hasDates && {
            valid_from: form.valid_from || null,
            valid_to: form.valid_to || null,
          }),
          ...(cfg?.priorityEditable && { priority: parseInt(form.priority, 10) }),
        }
        await resortRoomCategoryPricesService.update(resortId, resortRoomCategoryId, price.id, body)
        toast.success("Price rule updated.")
      } else {
        if (!form.price_type_id) {
          toast.error("Price type is still loading. Please wait a moment.")
          setSubmitting(false)
          return
        }
        const body: CreatePriceRequest = {
          price_type_id: Number(form.price_type_id),
          currency_id: Number(form.currency_id),
          price_unit_id: Number(form.price_unit_id),
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: priceNum,
          ...(cfg?.hasDays && (cfg.daysRequired || form.day_of_week_ids.length > 0) && { day_of_week_ids: form.day_of_week_ids }),
          ...(cfg?.hasDates && {
            valid_from: form.valid_from || null,
            valid_to: form.valid_to || null,
          }),
          ...(cfg?.priorityEditable && { priority: parseInt(form.priority, 10) }),
        }
        await resortRoomCategoryPricesService.create(resortId, resortRoomCategoryId, body)
        toast.success("Price rule created.")
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const title = isEdit ? `Edit ${cfg?.label ?? "Price Rule"}` : `Set ${cfg?.label ?? "Price Rule"}`

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => { if (!submitting) onOpenChange(v) }}>
      <DialogContent
        className="max-w-lg p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => { e.preventDefault(); if (!submitting) onOpenChange(false) }}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b shrink-0 bg-gradient-to-br ${cfg?.gradient ?? ""}`}>
          <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${cfg?.iconColor ?? "bg-muted text-muted-foreground"}`}>
            <Tag className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight">{title}</p>
            {cfg && <p className="mt-0.5 text-xs text-muted-foreground">{cfg.desc}</p>}
          </div>
          {typeLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0 text-muted-foreground" />}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">

            {/* Currency — create only */}
            {!isEdit && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Currency *</Label>
                {currencyLocked ? (
                  <div className="flex h-9 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                    <Lock className="h-3.5 w-3.5 shrink-0" />
                    <span>Currency #{form.currency_id} · same as base rate</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrencyPickerOpen(true)}
                    className={`flex h-9 w-full items-center justify-between rounded-md border px-3 text-sm transition-colors hover:bg-muted/50 ${
                      form.currency_id ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <span className="truncate">
                      {selectedCurrency
                        ? `${selectedCurrency.code} – ${selectedCurrency.locales[0]?.name ?? selectedCurrency.symbol}`
                        : "Select currency…"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                  </button>
                )}
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="e.g. Base Price"
                className="h-9 text-sm"
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Description <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                value={form.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder="Optional description…"
                className="h-9 text-sm"
              />
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Price *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => patch({ price: e.target.value })}
                className="h-9 font-mono text-sm"
              />
              {(activeCode === "WKD" || activeCode === "WKE") && (
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Info className="h-3 w-3 shrink-0" />
                  Must be ≤ the base price for this currency
                </p>
              )}
            </div>

            {/* Price Unit */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Price Unit *</Label>
              <button
                type="button"
                onClick={() => setPriceUnitPickerOpen(true)}
                className={`flex h-9 w-full items-center justify-between rounded-md border px-3 text-sm transition-colors hover:bg-muted/50 ${
                  form.price_unit_id ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <span className="truncate">
                  {selectedPriceUnit
                    ? `${selectedPriceUnit.locales[0]?.name ?? selectedPriceUnit.code}`
                    : "Select price unit…"}
                </span>
                <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
              </button>
            </div>

            {/* Days of week — WKD / WKE required, HOL / SPE optional */}
            {cfg?.hasDays && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">
                    Applies On{cfg.daysRequired ? " *" : " "}
                    {!cfg.daysRequired && (
                      <span className="font-normal text-muted-foreground">(optional — restricts to these days within the date range)</span>
                    )}
                  </Label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => patch({ day_of_week_ids: [1, 2, 3, 4, 5] })}
                      className="rounded-md border px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                    >
                      Weekdays
                    </button>
                    <button
                      type="button"
                      onClick={() => patch({ day_of_week_ids: [6, 7] })}
                      className="rounded-md border px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                    >
                      Weekends
                    </button>
                    {!cfg.daysRequired && form.day_of_week_ids.length > 0 && (
                      <button
                        type="button"
                        onClick={() => patch({ day_of_week_ids: [] })}
                        className="rounded-md border px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                        form.day_of_week_ids.includes(d)
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {DAY_LABELS[d]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Date range — HOL / SPE */}
            {cfg?.hasDates && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Valid From *</Label>
                  <Input
                    type="date"
                    value={form.valid_from}
                    onChange={(e) => patch({ valid_from: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Valid To *</Label>
                  <Input
                    type="date"
                    value={form.valid_to}
                    min={form.valid_from || undefined}
                    onChange={(e) => patch({ valid_to: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Priority — HOL / SPE */}
            {cfg?.priorityEditable && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Priority *</Label>
                <Input
                  type="number"
                  min={cfg.priorityMin}
                  step="1"
                  value={form.priority}
                  onChange={(e) => patch({ priority: e.target.value })}
                  className="h-9 font-mono text-sm"
                />
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Info className="h-3 w-3 shrink-0" />
                  Min {cfg.priorityMin}. Higher value wins when multiple rules match the same date.
                </p>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-end gap-2 border-t px-5 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || typeLoading}>
              {submitting ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving…</>
              ) : (
                <><Check className="mr-1.5 h-3.5 w-3.5" />{isEdit ? "Save Changes" : "Create"}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <CurrencyPickerDialog
      open={currencyPickerOpen}
      onOpenChange={setCurrencyPickerOpen}
      selectedId={form.currency_id !== "" ? form.currency_id : undefined}
      onSelect={(c) => {
        patch({ currency_id: c.id })
        setSelectedCurrency(c)
      }}
    />

    <PriceUnitPickerDialog
      open={priceUnitPickerOpen}
      onOpenChange={setPriceUnitPickerOpen}
      selectedId={form.price_unit_id !== "" ? form.price_unit_id : undefined}
      onSelect={(pu) => {
        patch({ price_unit_id: pu.id })
        setSelectedPriceUnit(pu)
      }}
    />
    </>
  )
}
