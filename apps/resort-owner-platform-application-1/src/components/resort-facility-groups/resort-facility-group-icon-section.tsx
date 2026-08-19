"use client"

import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Ban, Pencil } from "lucide-react"
import { Button, Card, CardContent, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "@resort/shadcn-ui"
import { LucideIconPicker, LucideIconRenderer } from "ui-blocks"
import type { IconType } from "@/services/resort-facility-groups"
import type { ResortFacilityGroupFormState } from "./types"

export const ICON_TYPES: { value: IconType; label: string }[] = [
  { value: "LUCIDE", label: "Lucide Icon" },
  { value: "IMAGE", label: "Image URL" },
  { value: "EXTERNAL", label: "External URL" },
  { value: "SVG", label: "SVG Markup" },
]

interface IconSectionInnerProps {
  form: ResortFacilityGroupFormState
  onFormChange: (patch: Partial<ResortFacilityGroupFormState>) => void
  readOnly: boolean
}

function IconFields({ form, onFormChange, readOnly }: IconSectionInnerProps) {
  const { t } = useTranslation()
  return (
    <>
      <div className="space-y-2">
        <Label className="text-xs font-medium">{t("resortFacilityGroup.iconType")}</Label>
        <Select
          value={form.icon_type || "__none"}
          onValueChange={(v) => onFormChange({ icon_type: v === "__none" ? "" : v as IconType, icon_value: "", icon_color: "" })}
          disabled={readOnly}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("resortFacilityGroup.iconTypePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">{t("resortFacilityGroup.iconNone")}</SelectItem>
            {ICON_TYPES.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {form.icon_type === "LUCIDE" && (
        <>
          <div className="space-y-2">
            <Label className="text-xs font-medium">{t("resortFacilityGroup.iconValue")} *</Label>
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
            <Label className="text-xs font-medium">{t("resortFacilityGroup.iconColor")}</Label>
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
                  {t("resortFacilityGroup.clearColor")}
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      {(form.icon_type === "IMAGE" || form.icon_type === "EXTERNAL") && (
        <div className="space-y-2">
          <Label className="text-xs font-medium">{t("resortFacilityGroup.iconUrl")} *</Label>
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
            <Label className="text-xs font-medium">{t("resortFacilityGroup.iconSvg")} *</Label>
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
            <Label className="text-xs font-medium">{t("resortFacilityGroup.iconColor")}</Label>
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
                  {t("resortFacilityGroup.clearColor")}
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

export interface IconSectionProps {
  form: ResortFacilityGroupFormState
  onFormChange: (patch: Partial<ResortFacilityGroupFormState>) => void
  readOnly: boolean
  showAutoFillHint?: boolean
  disabled?: boolean
  editingHint?: boolean
  onEditingHintChange?: (v: boolean) => void
}

export function IconSection({ form, onFormChange, readOnly, showAutoFillHint, disabled, editingHint, onEditingHintChange }: IconSectionProps) {
  const { t } = useTranslation()
  const hasIcon = !!form.icon_type && !!form.icon_value

  // Reset edit state whenever the platform group changes (icon_value changes from auto-fill)
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
          <p className="text-sm">{t("resortFacilityGroup.selectGroupFirst")}</p>
        </CardContent>
      </Card>
    )
  }

  // Platform mode: preview with hover overlay edit button
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
                  <p className="text-xs text-muted-foreground">{t("resortFacilityGroup.iconAutoFilled")}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed px-3 py-3">
                <p className="text-xs text-muted-foreground">{t("resortFacilityGroup.iconNoAutoFill")}</p>
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
