"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronDown, Loader2, Minus, Plus, Tag, X } from "lucide-react"
import {
  Badge, Button, Dialog, DialogContent, DialogTitle, Input, Label,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@resort/shadcn-ui"
import { toast } from "sonner"
import { resortRoomCategoryPricesService, type ResortRoomCategoryPrice } from "@/services/resort-room-category-prices"
import { priceUnitsService, type PriceUnit } from "@/services/price-units"
import { PriceTypePickerDialog } from "@/components/price-types/price-type-picker-dialog"
import type { PriceType } from "@/services/price-types"

export type ResortRoomCategoryPriceDialogMode = "create" | "edit"

export interface PriceFormState {
  price_type_id: number | ""
  price_unit_id: number | ""
  amount: string
  priority: number
  valid_from: string
  valid_to: string
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
}

export const emptyPriceForm: PriceFormState = {
  price_type_id: "",
  price_unit_id: "",
  amount: "",
  priority: 0,
  valid_from: "",
  valid_to: "",
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: false,
  sunday: false,
}

export function priceToFormState(p: ResortRoomCategoryPrice): PriceFormState {
  return {
    price_type_id: p.price_type_id,
    price_unit_id: p.price_unit_id,
    amount: String(p.amount),
    priority: p.priority,
    valid_from: p.valid_from ?? "",
    valid_to: p.valid_to ?? "",
    monday: p.monday,
    tuesday: p.tuesday,
    wednesday: p.wednesday,
    thursday: p.thursday,
    friday: p.friday,
    saturday: p.saturday,
    sunday: p.sunday,
  }
}

const DAYS = [
  { key: "monday" as const, label: "Mo" },
  { key: "tuesday" as const, label: "Tu" },
  { key: "wednesday" as const, label: "We" },
  { key: "thursday" as const, label: "Th" },
  { key: "friday" as const, label: "Fr" },
  { key: "saturday" as const, label: "Sa" },
  { key: "sunday" as const, label: "Su" },
]

export interface ResortRoomCategoryPriceDialogProps {
  resortId: number
  resortRoomCategoryId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: ResortRoomCategoryPriceDialogMode
  price?: ResortRoomCategoryPrice
  onSaved: () => void | Promise<void>
}

export function ResortRoomCategoryPriceDialog({
  resortId,
  resortRoomCategoryId,
  open,
  onOpenChange,
  mode,
  price,
  onSaved,
}: ResortRoomCategoryPriceDialogProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState<PriceFormState>(emptyPriceForm)
  const [submitting, setSubmitting] = useState(false)
  const [priceTypePickerOpen, setPriceTypePickerOpen] = useState(false)
  const [selectedPriceTypeName, setSelectedPriceTypeName] = useState("")

  // Lazy-loaded lookup data
  const [priceUnits, setPriceUnits] = useState<PriceUnit[]>([])
  const [unitsLoading, setUnitsLoading] = useState(false)
  const unitsLoadedRef = useRef(false)

  useEffect(() => {
    if (!open) {
      // Reset lookup flags so they reload if dialog is closed and reopened
      unitsLoadedRef.current = false
      setPriceUnits([])
      setPriceTypePickerOpen(false)
      setSelectedPriceTypeName("")
    }
  }, [open])

  useEffect(() => {
    if (open) {
      if (mode === "edit" && price) {
        setForm(priceToFormState(price))
        setSelectedPriceTypeName(`#${price.price_type_id}`)
      } else {
        setForm(emptyPriceForm)
        setSelectedPriceTypeName("")
      }
    }
  }, [open, mode, price])

  function handlePriceTypeSelect(pt: PriceType) {
    patch({ price_type_id: pt.id })
    setSelectedPriceTypeName(pt.locales[0]?.name ?? pt.code)
  }

  async function loadPriceUnits() {
    if (unitsLoadedRef.current) return
    unitsLoadedRef.current = true
    setUnitsLoading(true)
    try {
      const res = await priceUnitsService.list({ size: 100, sort_by: "sortOrder" })
      setPriceUnits(res.data)
    } catch (err) {
      toast.error((err as Error).message)
      unitsLoadedRef.current = false
    } finally {
      setUnitsLoading(false)
    }
  }

  function patch(p: Partial<PriceFormState>) {
    setForm((prev) => ({ ...prev, ...p }))
  }

  function toggleDay(key: (typeof DAYS)[number]["key"]) {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function quickSelectDays(preset: "all" | "weekdays" | "weekends") {
    const all = preset === "all"
    const wk = preset === "weekdays"
    setForm((prev) => ({
      ...prev,
      monday: all || wk,
      tuesday: all || wk,
      wednesday: all || wk,
      thursday: all || wk,
      friday: all || wk,
      saturday: all || !wk,
      sunday: all || !wk,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.price_type_id) { toast.error(t("resortRoomCategoryPrice.errPriceType")); return }
    if (!form.price_unit_id) { toast.error(t("resortRoomCategoryPrice.errPriceUnit")); return }
    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount < 0) { toast.error(t("resortRoomCategoryPrice.errAmount")); return }
    if (!DAYS.some((d) => form[d.key])) { toast.error(t("resortRoomCategoryPrice.errDays")); return }
    if (form.valid_from && form.valid_to && form.valid_to < form.valid_from) {
      toast.error(t("resortRoomCategoryPrice.errDateRange")); return
    }

    setSubmitting(true)
    const body = {
      price_type_id: Number(form.price_type_id),
      price_unit_id: Number(form.price_unit_id),
      amount,
      priority: form.priority,
      valid_from: form.valid_from || null,
      valid_to: form.valid_to || null,
      monday: form.monday,
      tuesday: form.tuesday,
      wednesday: form.wednesday,
      thursday: form.thursday,
      friday: form.friday,
      saturday: form.saturday,
      sunday: form.sunday,
    }
    try {
      if (mode === "edit" && price) {
        await resortRoomCategoryPricesService.update(resortId, resortRoomCategoryId, price.id, body)
        toast.success(t("resortRoomCategoryPrice.updated"))
      } else {
        await resortRoomCategoryPricesService.create(resortId, resortRoomCategoryId, body)
        toast.success(t("resortRoomCategoryPrice.created"))
      }
      onOpenChange(false)
      await onSaved()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const isEdit = mode === "edit"

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!submitting) onOpenChange(v) }}>
      <DialogContent
        className="max-w-lg p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => { e.preventDefault(); if (!submitting) onOpenChange(false) }}
      >
        <DialogTitle className="sr-only">
          {isEdit ? t("resortRoomCategoryPrice.dialogEdit") : t("resortRoomCategoryPrice.dialogCreate")}
        </DialogTitle>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
              <Tag className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {isEdit ? t("resortRoomCategoryPrice.dialogEdit") : t("resortRoomCategoryPrice.dialogCreate")}
              </p>
              <p className="text-xs text-muted-foreground">
                {isEdit ? t("resortRoomCategoryPrice.dialogDescEdit") : t("resortRoomCategoryPrice.dialogDescCreate")}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

            {/* Price Type */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("resortRoomCategoryPrice.priceType")} *</Label>
              <button
                type="button"
                onClick={() => setPriceTypePickerOpen(true)}
                className="flex w-full items-center justify-between rounded-md border bg-background px-3 h-9 text-sm hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {form.price_type_id ? (
                  <span className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-4 border-amber-500/30 text-amber-600 dark:text-amber-400">
                      #{form.price_type_id}
                    </Badge>
                    <span className="truncate">{selectedPriceTypeName}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">{t("resortRoomCategoryPrice.selectPriceType")}</span>
                )}
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
              </button>
            </div>

            {/* Price Unit */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("resortRoomCategoryPrice.priceUnit")} *</Label>
              <Select
                value={form.price_unit_id ? String(form.price_unit_id) : ""}
                onValueChange={(v) => patch({ price_unit_id: Number(v) })}
                onOpenChange={(isOpen) => { if (isOpen) loadPriceUnits() }}
              >
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue placeholder={t("resortRoomCategoryPrice.selectPriceUnit")} />
                </SelectTrigger>
                <SelectContent>
                  {unitsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : priceUnits.length === 0 ? (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      {t("resortRoomCategoryPrice.noPriceUnits")}
                    </div>
                  ) : (
                    priceUnits.map((pu) => (
                      <SelectItem key={pu.id} value={String(pu.id)}>
                        {pu.locales[0]?.name ?? pu.code}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("resortRoomCategoryPrice.amount")} *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => patch({ amount: e.target.value })}
                className="w-full h-9 text-sm font-mono"
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("resortRoomCategoryPrice.priority")}</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button" size="icon" variant="outline" className="h-9 w-9 shrink-0"
                  disabled={form.priority <= 0}
                  onClick={() => patch({ priority: form.priority - 1 })}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="flex-1 text-center text-sm font-semibold tabular-nums">{form.priority}</span>
                <Button
                  type="button" size="icon" variant="outline" className="h-9 w-9 shrink-0"
                  onClick={() => patch({ priority: form.priority + 1 })}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Valid From */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("resortRoomCategoryPrice.validFrom")}</Label>
              <Input
                type="date"
                value={form.valid_from}
                onChange={(e) => patch({ valid_from: e.target.value })}
                className="w-full h-9 text-sm"
              />
            </div>

            {/* Valid To */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("resortRoomCategoryPrice.validTo")}</Label>
              <Input
                type="date"
                value={form.valid_to}
                min={form.valid_from || undefined}
                onChange={(e) => patch({ valid_to: e.target.value })}
                className="w-full h-9 text-sm"
              />
            </div>

            {/* Days of week */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">{t("resortRoomCategoryPrice.days")} *</Label>
                <div className="flex items-center gap-1">
                  {(["all", "weekdays", "weekends"] as const).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => quickSelectDays(preset)}
                      className="rounded-md border px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                    >
                      {t(`resortRoomCategoryPrice.${preset}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {DAYS.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggleDay(d.key)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      form[d.key]
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              <X className="h-3.5 w-3.5 mr-1.5" />
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />{t("common.saving")}</>
              ) : (
                <><Check className="h-3.5 w-3.5 mr-1.5" />{isEdit ? t("common.save") : t("resortRoomCategoryPrice.create")}</>
              )}
            </Button>
          </div>

        </form>
      </DialogContent>

      <PriceTypePickerDialog
        open={priceTypePickerOpen}
        onOpenChange={setPriceTypePickerOpen}
        selectedId={form.price_type_id || undefined}
        onSelect={handlePriceTypeSelect}
      />
    </Dialog>
  )
}
