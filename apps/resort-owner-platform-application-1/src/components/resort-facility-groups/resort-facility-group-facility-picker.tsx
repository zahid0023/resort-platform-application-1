"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronDown, Loader2 } from "lucide-react"
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "@resort/shadcn-ui"
import { LucideIconPicker, LucideIconRenderer } from "ui-blocks"
import type { IconType } from "@/services/resort-facility-groups"
import type { PlatformFacilitySummary } from "@/services/platform-facilities"
import { ICON_TYPES } from "./resort-facility-group-icon-section"

export interface FacilityCustomization {
  code: string
  sort_order: number
  icon_type: IconType | ""
  icon_value: string
  icon_color: string
  /** create-only, single "en" translation — the backend resolves the locale server-side */
  locale: { name: string; description: string; sort_order: number }
}

export function initCustomization(f: PlatformFacilitySummary): FacilityCustomization {
  return {
    code: f.code,
    sort_order: f.sort_order ?? 0,
    icon_type: (f.icon_type ?? "") as IconType | "",
    icon_value: f.icon_value ?? "",
    icon_color: String(f.icon_meta?.color ?? ""),
    locale: { name: f.locale?.name ?? "", description: f.locale?.description ?? "", sort_order: 0 },
  }
}

export interface FacilityPickerProps {
  facilities: PlatformFacilitySummary[]
  loading: boolean
  selectedIds: Set<number>
  onToggle: (id: number) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  customizations: Record<number, FacilityCustomization>
  onCustomizationChange: (id: number, patch: Partial<FacilityCustomization>) => void
  onLocaleChange: (id: number, patch: Partial<FacilityCustomization["locale"]>) => void
}

export function FacilityPicker({
  facilities, loading, selectedIds, onToggle, onSelectAll, onDeselectAll,
  customizations, onCustomizationChange, onLocaleChange,
}: FacilityPickerProps) {
  const { t } = useTranslation()
  const [expandedId, setExpandedId] = useState<number | null>(null)

  function handleToggle(id: number) {
    const willSelect = !selectedIds.has(id)
    onToggle(id)
    if (willSelect) setExpandedId(id)
    else if (expandedId === id) setExpandedId(null)
  }

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

  const allSelected = facilities.every((f) => selectedIds.has(f.id))

  return (
    <div className="space-y-3">
      {/* Select all / Deselect all */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {selectedIds.size} / {facilities.length} {t("resortFacilityGroup.facilitiesSelected")}
        </p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 text-xs px-2.5"
          onClick={allSelected ? onDeselectAll : onSelectAll}
        >
          {allSelected ? t("resortFacilityGroup.deselectAll") : t("resortFacilityGroup.selectAll")}
        </Button>
      </div>

      {/* Facility list */}
      <div className="space-y-2">
        {facilities.map((f) => {
          const selected = selectedIds.has(f.id)
          const expanded = selected && expandedId === f.id
          const name = f.locale?.name ?? f.code
          const accentColor = String(f.icon_meta?.color ?? "") || undefined
          const custom = customizations[f.id]

          return (
            <div
              key={f.id}
              className={`rounded-lg border overflow-hidden transition-colors ${selected ? "border-primary" : "border-border"}`}
            >
              {/* Row header */}
              <div
                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${selected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-accent/40"}`}
                onClick={() => selected ? setExpandedId(expanded ? null : f.id) : handleToggle(f.id)}
              >
                {/* Checkbox */}
                <div
                  className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${selected ? "border-primary bg-primary" : "border-muted-foreground/40 bg-background"}`}
                  onClick={(e) => { e.stopPropagation(); handleToggle(f.id) }}
                >
                  {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                </div>

                {/* Platform icon */}
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

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight truncate">{name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{f.code}</p>
                </div>

                {/* Expand chevron (only when selected) */}
                {selected && (
                  <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                )}
              </div>

              {/* ── Customization panel ──────────────────────────────────── */}
              {expanded && custom && (
                <div className="border-t bg-muted/20 p-4 space-y-5">

                  {/* Code — auto-filled from the platform facility, owner-editable */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t("resortFacility.code")} *</Label>
                    <Input
                      value={custom.code}
                      onChange={(e) => onCustomizationChange(f.id, { code: e.target.value.toUpperCase() })}
                      className="h-9 font-mono"
                    />
                  </div>

                  {/* Sort order */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t("field.sort")} *</Label>
                    <Input
                      type="number"
                      value={custom.sort_order}
                      onChange={(e) => onCustomizationChange(f.id, { sort_order: Number(e.target.value) })}
                      className="h-9"
                    />
                  </div>

                  {/* Icon override */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                        {t("resortFacilityGroup.iconSection")}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{t("resortFacility.iconType")}</Label>
                      <Select
                        value={custom.icon_type || "__none"}
                        onValueChange={(v) => onCustomizationChange(f.id, {
                          icon_type: v === "__none" ? "" : v as IconType,
                          icon_value: "",
                          icon_color: "",
                        })}
                      >
                        <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">{t("resortFacility.iconNone")}</SelectItem>
                          {ICON_TYPES.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {custom.icon_type === "LUCIDE" && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">{t("resortFacility.iconValue")} *</Label>
                          <LucideIconPicker
                            value={custom.icon_value}
                            color={custom.icon_color || undefined}
                            onChange={(n) => onCustomizationChange(f.id, { icon_value: n })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">{t("resortFacility.iconColor")}</Label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={custom.icon_color || "#6366f1"}
                              onChange={(e) => onCustomizationChange(f.id, { icon_color: e.target.value })}
                              className="h-9 w-12 rounded border cursor-pointer" />
                            <Input value={custom.icon_color}
                              onChange={(e) => onCustomizationChange(f.id, { icon_color: e.target.value })}
                              placeholder="#6366f1" className="font-mono h-9" />
                            {custom.icon_color && (
                              <Button type="button" size="sm" variant="ghost" className="h-9 px-2 text-xs"
                                onClick={() => onCustomizationChange(f.id, { icon_color: "" })}>
                                {t("resortFacility.clearColor")}
                              </Button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    {(custom.icon_type === "IMAGE" || custom.icon_type === "EXTERNAL") && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">{t("resortFacility.iconUrl")} *</Label>
                        <Input value={custom.icon_value}
                          onChange={(e) => onCustomizationChange(f.id, { icon_value: e.target.value })}
                          placeholder="https://…" className="h-9" />
                        {custom.icon_value && (
                          <img src={custom.icon_value} alt="preview" className="h-12 w-12 object-contain rounded border" />
                        )}
                      </div>
                    )}
                    {custom.icon_type === "SVG" && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">{t("resortFacility.iconSvg")} *</Label>
                          <Textarea value={custom.icon_value}
                            onChange={(e) => onCustomizationChange(f.id, { icon_value: e.target.value })}
                            placeholder="<svg …>…</svg>" rows={3} className="font-mono text-xs resize-none" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">{t("resortFacility.iconColor")}</Label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={custom.icon_color || "#6366f1"}
                              onChange={(e) => onCustomizationChange(f.id, { icon_color: e.target.value })}
                              className="h-9 w-12 rounded border cursor-pointer" />
                            <Input value={custom.icon_color}
                              onChange={(e) => onCustomizationChange(f.id, { icon_color: e.target.value })}
                              placeholder="#6366f1" className="font-mono h-9" />
                            {custom.icon_color && (
                              <Button type="button" size="sm" variant="ghost" className="h-9 px-2 text-xs"
                                onClick={() => onCustomizationChange(f.id, { icon_color: "" })}>
                                {t("resortFacility.clearColor")}
                              </Button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Locale translation — create-only, single "en" translation (server-resolved) */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                        {t("locale.translations")}
                      </span>
                    </div>
                    <div className="border rounded-lg p-3 space-y-2.5">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{t("common.name")} *</Label>
                        <Input value={custom.locale.name}
                          onChange={(e) => onLocaleChange(f.id, { name: e.target.value })}
                          className="h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{t("field.sort")}</Label>
                        <Input type="number" value={custom.locale.sort_order}
                          onChange={(e) => onLocaleChange(f.id, { sort_order: Number(e.target.value) })}
                          className="h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{t("resortFacilityGroup.description")}</Label>
                        <Textarea value={custom.locale.description}
                          onChange={(e) => onLocaleChange(f.id, { description: e.target.value })}
                          rows={2} className="text-xs resize-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
