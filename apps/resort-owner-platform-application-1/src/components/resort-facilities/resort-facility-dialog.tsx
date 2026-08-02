"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Ban, Check, Layers, Pencil, X } from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Button, Card, CardContent, Dialog, DialogContent, DialogTitle, Input, Label,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea,
} from "@resort/shadcn-ui"
import { LucideIconPicker, LucideIconRenderer } from "ui-blocks"
import { resortFacilitiesService } from "@/services/resort-facilities"
import type { IconType } from "@/services/resort-facilities"
import type { Locale } from "@/services/locales"
import { toast } from "sonner"
import type { ResortFacilityDialogMode, ResortFacilityFormState, FacilityMode } from "./types"
import { emptyForm, toApiIconPayload } from "./types"
import { ResortFacilityGeneralInfo } from "./resort-facility-general-info"
import { ResortFacilityPriceSection } from "./resort-facility-price-section"
import { ResortFacilityLocaleTranslations } from "./resort-facility-locale-translations"

const ICON_TYPES: { value: IconType; label: string }[] = [
  { value: "LUCIDE", label: "Lucide Icon" },
  { value: "IMAGE", label: "Image URL" },
  { value: "EXTERNAL", label: "External URL" },
  { value: "SVG", label: "SVG Markup" },
]

interface IconSectionProps {
  form: ResortFacilityFormState
  onFormChange: (patch: Partial<ResortFacilityFormState>) => void
  readOnly: boolean
  showAutoFillHint?: boolean
  disabled?: boolean
  editingHint?: boolean
  onEditingHintChange?: (v: boolean) => void
}

function IconFields({ form, onFormChange, readOnly }: { form: ResortFacilityFormState; onFormChange: (patch: Partial<ResortFacilityFormState>) => void; readOnly: boolean }) {
  const { t } = useTranslation()
  return (
    <>
      <div className="space-y-2">
        <Label className="text-xs font-medium">{t("resortFacility.iconType")}</Label>
        <Select
          value={form.icon_type || "__none"}
          onValueChange={(v) => onFormChange({ icon_type: v === "__none" ? "" : v as IconType, icon_value: "", icon_color: "" })}
          disabled={readOnly}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("resortFacility.iconTypePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">{t("resortFacility.iconNone")}</SelectItem>
            {ICON_TYPES.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {form.icon_type === "LUCIDE" && (
        <>
          <div className="space-y-2">
            <Label className="text-xs font-medium">{t("resortFacility.iconValue")} *</Label>
            {readOnly ? (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-3">
                {form.icon_value && (
                  <LucideIconRenderer name={form.icon_value} size={18} style={{ color: form.icon_color || undefined }} />
                )}
                <span className="font-mono text-sm">{form.icon_value || "—"}</span>
              </div>
            ) : (
              <LucideIconPicker
                value={form.icon_value}
                color={form.icon_color || undefined}
                onChange={(name) => onFormChange({ icon_value: name })}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">{t("resortFacility.iconColor")}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.icon_color || "#6366f1"}
                onChange={(e) => onFormChange({ icon_color: e.target.value })}
                disabled={readOnly}
                className="h-9 w-12 rounded border cursor-pointer disabled:opacity-50 disabled:cursor-default"
              />
              <Input
                value={form.icon_color}
                onChange={(e) => onFormChange({ icon_color: e.target.value })}
                placeholder="#6366f1"
                disabled={readOnly}
                className="font-mono h-9"
              />
              {!readOnly && form.icon_color && (
                <Button type="button" size="sm" variant="ghost" className="h-9 px-2 text-xs"
                  onClick={() => onFormChange({ icon_color: "" })}>
                  {t("resortFacility.clearColor")}
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      {(form.icon_type === "IMAGE" || form.icon_type === "EXTERNAL") && (
        <div className="space-y-2">
          <Label className="text-xs font-medium">{t("resortFacility.iconUrl")} *</Label>
          <Input
            value={form.icon_value}
            onChange={(e) => onFormChange({ icon_value: e.target.value })}
            placeholder="https://…"
            disabled={readOnly}
          />
          {form.icon_value && (
            <img src={form.icon_value} alt="preview" className="h-12 w-12 object-contain rounded border" />
          )}
        </div>
      )}

      {form.icon_type === "SVG" && (
        <>
          <div className="space-y-2">
            <Label className="text-xs font-medium">{t("resortFacility.iconSvg")} *</Label>
            <Textarea
              value={form.icon_value}
              onChange={(e) => onFormChange({ icon_value: e.target.value })}
              placeholder="<svg …>…</svg>"
              disabled={readOnly}
              rows={4}
              className="font-mono text-xs resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">{t("resortFacility.iconColor")}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.icon_color || "#6366f1"}
                onChange={(e) => onFormChange({ icon_color: e.target.value })}
                disabled={readOnly}
                className="h-9 w-12 rounded border cursor-pointer disabled:opacity-50 disabled:cursor-default"
              />
              <Input
                value={form.icon_color}
                onChange={(e) => onFormChange({ icon_color: e.target.value })}
                placeholder="#6366f1"
                disabled={readOnly}
                className="font-mono h-9"
              />
              {!readOnly && form.icon_color && (
                <Button type="button" size="sm" variant="ghost" className="h-9 px-2 text-xs"
                  onClick={() => onFormChange({ icon_color: "" })}>
                  {t("resortFacility.clearColor")}
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

function IconSection({ form, onFormChange, readOnly, showAutoFillHint, disabled, editingHint, onEditingHintChange }: IconSectionProps) {
  const { t } = useTranslation()
  const hasIcon = !!form.icon_type && !!form.icon_value

  // Reset edit state when auto-fill changes the icon (new platform facility selected)
  const prevIconValue = useRef(form.icon_value)
  useEffect(() => {
    if (showAutoFillHint && form.icon_value !== prevIconValue.current) {
      onEditingHintChange?.(false)
    }
    prevIconValue.current = form.icon_value
  }, [form.icon_value, showAutoFillHint])

  if (disabled) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-6 text-muted-foreground">
          <Ban className="h-4 w-4 shrink-0 opacity-40" />
          <p className="text-sm">{t("resortFacility.selectFacilityFirst")}</p>
        </CardContent>
      </Card>
    )
  }

  if (showAutoFillHint) {
    return (
      <Card>
        <CardContent className="space-y-4">
          <div className="relative group/preview">
            {hasIcon ? (
              <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
                {form.icon_type === "LUCIDE" && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background">
                    <LucideIconRenderer name={form.icon_value} size={22} style={{ color: form.icon_color || undefined }} />
                  </div>
                )}
                {(form.icon_type === "IMAGE" || form.icon_type === "EXTERNAL") && (
                  <img src={form.icon_value} alt="icon preview" className="h-10 w-10 shrink-0 object-contain rounded-md border bg-background" />
                )}
                {form.icon_type === "SVG" && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background">
                    <span className="text-xs font-mono font-bold text-muted-foreground">SVG</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{form.icon_value}</p>
                  <p className="text-xs text-muted-foreground">{t("resortFacility.iconAutoFilled")}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed px-3 py-3">
                <p className="text-xs text-muted-foreground">{t("resortFacility.iconNoAutoFill")}</p>
              </div>
            )}
            {!readOnly && (
              <div className={[
                "absolute inset-0 rounded-lg flex items-center justify-end pr-3 transition-all duration-200",
                "bg-black/50 backdrop-blur-[2px]",
                editingHint ? "opacity-100" : "opacity-0 group-hover/preview:opacity-100",
              ].join(" ")}>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => onEditingHintChange?.(!editingHint)}
                  className="h-7 text-xs px-3 gap-1.5 shadow-lg"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {editingHint ? t("common.cancel") : t("common.edit")}
                </Button>
              </div>
            )}
          </div>
          {editingHint && (
            <IconFields form={form} onFormChange={onFormChange} readOnly={false} />
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <IconFields form={form} onFormChange={onFormChange} readOnly={readOnly} />
      </CardContent>
    </Card>
  )
}

export interface ResortFacilityDialogProps {
  resortId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: ResortFacilityDialogMode
  facilityId?: number
  form: ResortFacilityFormState
  onFormChange: (form: ResortFacilityFormState) => void
  availableLocales: Locale[]
  onSaved?: () => void | Promise<void>
  lockedGroupName?: string
  defaultFacilityMode?: FacilityMode
  platformFacilityGroupId?: number
}

export function ResortFacilityDialog({
  resortId,
  open,
  onOpenChange,
  mode,
  facilityId,
  form,
  onFormChange,
  availableLocales,
  onSaved,
  lockedGroupName,
  defaultFacilityMode = "platform",
  platformFacilityGroupId,
}: ResortFacilityDialogProps) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [generalEditing, setGeneralEditing] = useState(false)
  const [priceEditing, setPriceEditing] = useState(false)
  const [iconEditing, setIconEditing] = useState(false)
  const [iconSubmitting, setIconSubmitting] = useState(false)
  const [localIcon, setLocalIcon] = useState<Pick<ResortFacilityFormState, "icon_type" | "icon_value" | "icon_color">>({
    icon_type: "", icon_value: "", icon_color: "",
  })
  const [translationsEditing, setTranslationsEditing] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [facilityMode, setFacilityMode] = useState<FacilityMode>(defaultFacilityMode)
  const [createIconEditing, setCreateIconEditing] = useState(false)

  // inputsDisabled: in create mode, no facility group selected yet
  const inputsDisabled = mode === "create" && !form.resort_facility_group_id

  useEffect(() => {
    if (!open) {
      setGeneralEditing(false)
      setPriceEditing(false)
      setIconEditing(false)
      setIconSubmitting(false)
      setTranslationsEditing(false)
      setConfirmClose(false)
      setFacilityMode(defaultFacilityMode)
      setCreateIconEditing(false)
    }
  }, [open, defaultFacilityMode])

  const isDirty = mode === "create"
    ? form.resort_facility_group_id !== "" || form.icon_type !== "" || form.icon_value !== "" || form.sort_order !== 0
      || form.locales.length > 1 || form.locales.some((l) => l.locale_id !== "" || l.name.trim() !== "")
    : generalEditing || priceEditing || iconEditing || translationsEditing

  function requestClose() {
    if (isDirty) setConfirmClose(true)
    else onOpenChange(false)
  }

  function startIconEdit() {
    setLocalIcon({ icon_type: form.icon_type, icon_value: form.icon_value, icon_color: form.icon_color })
    setIconEditing(true)
  }

  async function saveIcon() {
    if (facilityId == null) return
    if (localIcon.icon_type && !localIcon.icon_value) {
      toast.error(t("resortFacility.errIconValue"))
      return
    }
    setIconSubmitting(true)
    try {
      await resortFacilitiesService.update(resortId, facilityId, {
        sort_order: form.sort_order,
        facility_id: form.facility_id ? Number(form.facility_id) : null,
        facility_price_type_id: Number(form.facility_price_type_id) || 0,
        ...toApiIconPayload(localIcon as ResortFacilityFormState),
      })
      toast.success(t("resortFacility.updated"))
      setIconEditing(false)
      onFormChange({ ...form, ...localIcon })
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIconSubmitting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode !== "create") return
    if (!form.resort_facility_group_id) {
      toast.error(t("resortFacility.errGroupRequired"))
      return
    }
    if (!form.facility_price_type_id) {
      toast.error(t("resortFacility.errPriceType"))
      return
    }
    if (form.icon_type && !form.icon_value) {
      toast.error(t("resortFacility.errIconValue"))
      return
    }
    const isPaid = form.facility_price_type?.code === "PAID"
    if (isPaid) {
      if (!form.resort_facility_price?.price_unit_id) {
        toast.error(t("resortFacility.errPriceUnit"))
        return
      }
      if (!form.resort_facility_price?.currency_id) {
        toast.error(t("resortFacility.errCurrency"))
        return
      }
      if (form.resort_facility_price.amount === "" || Number(form.resort_facility_price.amount) < 0) {
        toast.error(t("resortFacility.errAmount"))
        return
      }
    }
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) { toast.error(t("locale.errLang", { n: i + 1 })); return }
      if (!row.name.trim()) { toast.error(t("locale.errName", { n: i + 1 })); return }
    }
    setSubmitting(true)
    try {
      await resortFacilitiesService.create(resortId, {
        resort_facility_group_id: Number(form.resort_facility_group_id),
        facility_id: form.facility_id ? Number(form.facility_id) : undefined,
        facility_price_type_id: Number(form.facility_price_type_id),
        sort_order: Number(form.sort_order) || 0,
        is_highlighted: form.is_highlighted,
        ...toApiIconPayload(form),
        resort_facility_price: isPaid && form.resort_facility_price
          ? {
              price_unit_id: Number(form.resort_facility_price.price_unit_id),
              currency_id: Number(form.resort_facility_price.currency_id),
              amount: Number(form.resort_facility_price.amount),
              notes: form.resort_facility_price.notes.trim() || undefined,
              sort_order: Number(form.resort_facility_price.sort_order) || 0,
            }
          : undefined,
        locales: form.locales
          .filter((row) => row.locale_id !== "" && row.name.trim() !== "")
          .map((row) => ({
            locale_id: Number(row.locale_id),
            name: row.name.trim(),
            description: row.description.trim(),
            sort_order: Number(row.sort_order) || 0,
          })),
      })
      toast.success(t("resortFacility.created"))
      onOpenChange(false)
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const isEditing = generalEditing || priceEditing || iconEditing || translationsEditing
  const headerTitle = mode === "create"
    ? t("resortFacility.dialogCreate")
    : (isEditing ? t("resortFacility.dialogEdit") : t("resortFacility.dialogView"))
  const headerDesc = mode === "create"
    ? t("resortFacility.dialogDescCreate")
    : (isEditing ? t("resortFacility.dialogDescEdit") : t("resortFacility.dialogDescView"))

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose() }}>
        <DialogContent
          className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose() }}
        >
          <DialogTitle className="sr-only">{mode === "create" ? t("resortFacility.dialogCreate") : t("resortFacility.dialogView")}</DialogTitle>
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">

            {/* Dialog header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{headerTitle}</p>
                <p className="text-xs text-muted-foreground">{headerDesc}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <ResortFacilityGeneralInfo
                resortId={resortId}
                mode={mode}
                form={form}
                onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                facilityId={facilityId}
                onSaved={onSaved}
                editing={generalEditing}
                onEditingChange={setGeneralEditing}
                open={open}
                facilityMode={facilityMode}
                onFacilityModeChange={setFacilityMode}
                lockedGroupName={lockedGroupName}
                platformFacilityGroupId={platformFacilityGroupId}
                availableLocales={availableLocales}
              />

              {/* Icon section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                      {t("resortFacility.iconSection")}
                    </h3>
                  </div>
                  {mode !== "create" && !iconEditing && (
                    <Button type="button" size="sm" variant="outline" onClick={startIconEdit} className="h-7 text-xs px-2.5 gap-1.5">
                      <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
                    </Button>
                  )}
                  {iconEditing && (
                    <div className="flex items-center gap-1.5">
                      <Button type="button" size="sm" variant="outline" onClick={() => setIconEditing(false)} disabled={iconSubmitting} className="h-7 text-xs px-2.5 gap-1.5">
                        <X className="h-3.5 w-3.5" /> {t("common.cancel")}
                      </Button>
                      <Button type="button" size="sm" onClick={saveIcon} disabled={iconSubmitting} className="h-7 text-xs px-2.5 gap-1.5">
                        <Check className="h-3.5 w-3.5" />
                        {iconSubmitting ? t("common.saving") : t("common.save")}
                      </Button>
                    </div>
                  )}
                </div>
                <IconSection
                  form={iconEditing ? { ...form, ...localIcon } : form}
                  onFormChange={(patch) => {
                    if (mode === "create") onFormChange({ ...form, ...patch })
                    else setLocalIcon((prev) => ({ ...prev, ...patch }))
                  }}
                  readOnly={!iconEditing && mode !== "create"}
                  showAutoFillHint={mode === "create" && !!form.resort_facility_group_id && !!form.facility_id}
                  disabled={inputsDisabled}
                  editingHint={createIconEditing}
                  onEditingHintChange={setCreateIconEditing}
                />
              </div>

              <ResortFacilityLocaleTranslations
                resortId={resortId}
                mode={mode}
                form={form}
                onFormChange={onFormChange}
                facilityId={facilityId}
                availableLocales={availableLocales}
                onSaved={onSaved}
                editing={translationsEditing}
                onEditingChange={setTranslationsEditing}
                open={open}
                disabled={inputsDisabled}
              />

              {/* Price section */}
              <ResortFacilityPriceSection
                resortId={resortId}
                mode={mode}
                form={form}
                onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                facilityId={facilityId}
                onSaved={onSaved}
                editing={priceEditing}
                onEditingChange={setPriceEditing}
                disabled={inputsDisabled}
                availableLocales={availableLocales}
              />
            </div>

            {mode === "create" && (
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t shrink-0">
                <Button type="button" variant="outline" onClick={requestClose} disabled={submitting}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? t("common.saving") : t("resortFacility.create")}
                </Button>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialog.discardChanges.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("dialog.discardChanges.desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onOpenChange(false)}>{t("dialog.discardChanges.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { emptyForm as emptyResortFacilityForm }
