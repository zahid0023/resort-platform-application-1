"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, Coins, DollarSign, Layers, Pencil, Tag, X } from "lucide-react"
import { Badge, Button, Card, CardContent, Input, Label } from "@resort/shadcn-ui"
import { resortFacilitiesService } from "@/services/resort-facilities"
import { type FacilityPriceType } from "@/services/facility-price-types"
import { type PriceUnit } from "@/services/price-units"
import { type Currency } from "@/services/currencies"
import { FacilityPriceTypePickerDialog } from "./facility-price-type-picker-dialog"
import { PriceUnitPickerDialog } from "@/components/price-units/price-unit-picker-dialog"
import { CurrencyPickerDialog } from "@/components/currencies/currency-picker-dialog"
import { toast } from "sonner"
import type { ResortFacilityDialogMode, ResortFacilityFormState, ResortFacilityPriceFormRow } from "./types"
import { toApiIconPayload } from "./types"

export interface ResortFacilityPriceSectionProps {
  resortId: number
  mode: ResortFacilityDialogMode
  form: ResortFacilityFormState
  onFormChange: (patch: Partial<ResortFacilityFormState>) => void
  facilityId?: number
  onSaved?: () => void | Promise<void>
  editing: boolean
  onEditingChange: (v: boolean) => void
  disabled?: boolean
}

export function ResortFacilityPriceSection({
  resortId,
  mode,
  form,
  onFormChange,
  facilityId,
  onSaved,
  editing,
  onEditingChange,
  disabled,
}: ResortFacilityPriceSectionProps) {
  const { t } = useTranslation()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [priceUnitPickerOpen, setPriceUnitPickerOpen] = useState(false)
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false)
  const [localFacilityPriceType, setLocalFacilityPriceType] = useState<FacilityPriceType | null>(null)
  const [selectedFacilityPriceType, setSelectedFacilityPriceType] = useState<FacilityPriceType | null>(null)
  const [selectedPriceUnit, setSelectedPriceUnit] = useState<PriceUnit | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function startEdit() {
    setLocalFacilityPriceType(null)
    onEditingChange(true)
  }

  function cancelEdit() {
    setLocalFacilityPriceType(null)
    onEditingChange(false)
  }

  function handlePriceTypeSelect(pt: FacilityPriceType) {
    if (mode === "create") {
      setSelectedFacilityPriceType(pt)
      const isPaid = pt.code === "PAID"
      onFormChange({
        facility_price_type_id: pt.id,
        facility_price_type: pt,
        resort_facility_price: isPaid
          ? { price_unit_id: "", currency_id: "", amount: "", notes: "", sort_order: 0 }
          : null,
      })
      if (!isPaid) {
        setSelectedPriceUnit(null)
        setSelectedCurrency(null)
      }
    } else {
      setLocalFacilityPriceType(pt)
    }
  }

  function handlePriceUnitSelect(pu: PriceUnit) {
    setSelectedPriceUnit(pu)
    onFormChange({
      resort_facility_price: {
        ...(form.resort_facility_price ?? { currency_id: "", amount: "", notes: "", sort_order: 0 }),
        price_unit_id: pu.id,
      } as ResortFacilityPriceFormRow,
    })
  }

  function handleCurrencySelect(c: Currency) {
    setSelectedCurrency(c)
    onFormChange({
      resort_facility_price: {
        ...(form.resort_facility_price ?? { price_unit_id: "", amount: "", notes: "", sort_order: 0 }),
        currency_id: c.id,
      } as ResortFacilityPriceFormRow,
    })
  }

  function patchPrice(patch: Partial<ResortFacilityPriceFormRow>) {
    onFormChange({
      resort_facility_price: {
        ...(form.resort_facility_price ?? { price_unit_id: "", currency_id: "", amount: "", notes: "", sort_order: 0 }),
        ...patch,
      } as ResortFacilityPriceFormRow,
    })
  }

  async function save() {
    if (facilityId == null) return
    const priceTypeId = localFacilityPriceType?.id ?? form.facility_price_type_id
    if (!priceTypeId) {
      toast.error(t("resortFacility.errFacilityPriceType"))
      return
    }
    setSubmitting(true)
    try {
      await resortFacilitiesService.update(resortId, facilityId, {
        facility_id: form.facility_id ? Number(form.facility_id) : null,
        facility_price_type_id: Number(priceTypeId),
        sort_order: form.sort_order,
        ...toApiIconPayload(form),
      })
      toast.success(t("resortFacility.updated"))
      const saved = localFacilityPriceType ?? form.facility_price_type
      onFormChange({
        facility_price_type_id: Number(priceTypeId),
        facility_price_type: saved,
      })
      if (localFacilityPriceType) setSelectedFacilityPriceType(localFacilityPriceType)
      setLocalFacilityPriceType(null)
      onEditingChange(false)
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const isReadOnly = !editing && mode !== "create"

  // In view mode fall back to form.facility_price_type (populated from API response)
  const displayFacilityPriceType = mode === "create"
    ? selectedFacilityPriceType
    : editing
      ? (localFacilityPriceType ?? selectedFacilityPriceType)
      : (selectedFacilityPriceType ?? form.facility_price_type)

  const activeFacilityPriceTypeId = editing
    ? (localFacilityPriceType?.id ?? form.facility_price_type_id)
    : form.facility_price_type_id

  const effectivePriceTypeCode = displayFacilityPriceType?.code ?? form.facility_price_type?.code
  const isPaid = effectivePriceTypeCode === "PAID"

  function renderSelectedPriceType(pt: FacilityPriceType) {
    const name = pt.locales[0]?.name ?? pt.code
    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary bg-primary/5 px-3 py-2.5">
        <div className="h-8 w-8 shrink-0 rounded-md flex items-center justify-center bg-primary/10">
          <Tag className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{name}</p>
          <p className="text-xs text-muted-foreground font-mono">{pt.code}</p>
        </div>
        {!isReadOnly && (
          <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(true)} className="h-7 text-xs px-2.5 shrink-0">
            {t("common.change")}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("resortFacility.priceSection")}
          </h3>
        </div>
        {mode !== "create" && !editing && (
          <Button type="button" size="sm" variant="outline" onClick={startEdit} className="h-7 text-xs px-2.5 gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
          </Button>
        )}
        {editing && (
          <div className="flex items-center gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={cancelEdit} disabled={submitting} className="h-7 text-xs px-2.5 gap-1.5">
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
        <CardContent className="space-y-3">
          <Label className="text-xs font-medium">
            {t("resortFacility.priceType")}{mode === "create" ? " *" : ""}
          </Label>

          {disabled ? (
            <p className="text-sm text-muted-foreground">{t("resortFacility.selectFacilityFirst")}</p>
          ) : isReadOnly ? (
            displayFacilityPriceType ? renderSelectedPriceType(displayFacilityPriceType) : (
              activeFacilityPriceTypeId ? (
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-mono">#{activeFacilityPriceTypeId}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                  <span className="text-sm text-muted-foreground">—</span>
                </div>
              )
            )
          ) : displayFacilityPriceType ? renderSelectedPriceType(displayFacilityPriceType) : (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="w-full flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent/50 transition-colors"
            >
              <Tag className="h-4 w-4 shrink-0" />
              <span>{t("resortFacility.selectPriceType")}</span>
            </button>
          )}

          {/* Existing prices in view mode */}
          {isReadOnly && isPaid && form.prices.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("resortFacility.prices")}</p>
              {form.prices.map((price) => (
                <div key={price.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-semibold">{price.amount}</span>
                    <span className="text-xs text-muted-foreground">{price.currency.code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-4">{price.price_unit.code}</Badge>
                    {price.notes && (
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">{price.notes}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {isReadOnly && isPaid && form.prices.length === 0 && (
            <p className="text-xs text-muted-foreground border-t pt-3">{t("resortFacility.noPrices")}</p>
          )}

          {/* Price entry for create mode with PAID */}
          {mode === "create" && isPaid && (
            <div className="space-y-3 border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("resortFacility.priceDetails")}</p>

              {/* Price unit */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t("resortFacility.priceUnit")} *</Label>
                {selectedPriceUnit ? (
                  <div className="flex items-center gap-3 rounded-lg border border-primary bg-primary/5 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{selectedPriceUnit.locales[0]?.name ?? selectedPriceUnit.code}</p>
                      <p className="text-xs text-muted-foreground font-mono">{selectedPriceUnit.code}</p>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={() => setPriceUnitPickerOpen(true)} className="h-7 text-xs px-2.5 shrink-0">
                      {t("common.change")}
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPriceUnitPickerOpen(true)}
                    className="w-full flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent/50 transition-colors"
                  >
                    <Layers className="h-4 w-4 shrink-0" />
                    <span>{t("resortFacility.selectPriceUnit")}</span>
                  </button>
                )}
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t("resortFacility.currency")} *</Label>
                {selectedCurrency ? (
                  <div className="flex items-center gap-3 rounded-lg border border-primary bg-primary/5 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{selectedCurrency.locales[0]?.name ?? selectedCurrency.code}</p>
                      <p className="text-xs text-muted-foreground font-mono">{selectedCurrency.symbol} {selectedCurrency.code}</p>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={() => setCurrencyPickerOpen(true)} className="h-7 text-xs px-2.5 shrink-0">
                      {t("common.change")}
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrencyPickerOpen(true)}
                    className="w-full flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent/50 transition-colors"
                  >
                    <Coins className="h-4 w-4 shrink-0" />
                    <span>{t("resortFacility.selectCurrency")}</span>
                  </button>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="rf-price-amount" className="text-xs font-medium">{t("resortFacility.amount")} *</Label>
                <Input
                  id="rf-price-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.resort_facility_price?.amount ?? ""}
                  onChange={(e) => patchPrice({ amount: e.target.value })}
                  placeholder={t("resortFacility.amountPlaceholder")}
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="rf-price-notes" className="text-xs font-medium">{t("resortFacility.priceNotes")}</Label>
                <Input
                  id="rf-price-notes"
                  value={form.resort_facility_price?.notes ?? ""}
                  onChange={(e) => patchPrice({ notes: e.target.value })}
                  placeholder={t("resortFacility.priceNotesPlaceholder")}
                />
              </div>

              {/* Sort order */}
              <div className="space-y-1.5">
                <Label htmlFor="rf-price-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
                <Input
                  id="rf-price-sort"
                  type="number"
                  min="0"
                  value={form.resort_facility_price?.sort_order ?? 0}
                  onChange={(e) => patchPrice({ sort_order: Number(e.target.value) })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <FacilityPriceTypePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectedId={Number(activeFacilityPriceTypeId) || undefined}
        onSelect={handlePriceTypeSelect}
      />

      <PriceUnitPickerDialog
        open={priceUnitPickerOpen}
        onOpenChange={setPriceUnitPickerOpen}
        selectedId={form.resort_facility_price?.price_unit_id ? Number(form.resort_facility_price.price_unit_id) : undefined}
        onSelect={handlePriceUnitSelect}
      />

      <CurrencyPickerDialog
        open={currencyPickerOpen}
        onOpenChange={setCurrencyPickerOpen}
        selectedId={form.resort_facility_price?.currency_id ? Number(form.resort_facility_price.currency_id) : undefined}
        onSelect={handleCurrencySelect}
      />
    </div>
  )
}
