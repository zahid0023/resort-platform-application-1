"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Check, Layers, ListChecks, Loader2, Pencil, X, Ban } from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Button, Card, CardContent, Dialog, DialogContent, DialogTitle, Input, Label,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea,
} from "@resort/shadcn-ui"
import { LucideIconPicker, LucideIconRenderer } from "ui-blocks"
import { resortFacilityGroupsService } from "@/services/resort-facility-groups"
import type { IconType } from "@/services/resort-facility-groups"
import { resortFacilitiesService } from "@/services/resort-facilities"
import { platformFacilitiesService, type PlatformFacilitySummary } from "@/services/platform-facilities"
import type { Locale } from "@/services/locales"
import { toast } from "sonner"
import type { ResortFacilityGroupDialogMode, ResortFacilityGroupFormState } from "./types"
import { emptyForm, toApiIconPayload } from "./types"
import { ResortFacilityGroupGeneralInfo, type GroupMode } from "./resort-facility-group-general-info"
import { ResortFacilityGroupLocaleTranslations } from "./resort-facility-group-locale-translations"

const ICON_TYPES: { value: IconType; label: string }[] = [
  { value: "LUCIDE", label: "Lucide Icon" },
  { value: "IMAGE", label: "Image URL" },
  { value: "EXTERNAL", label: "External URL" },
  { value: "SVG", label: "SVG Markup" },
]

interface IconSectionProps {
  form: ResortFacilityGroupFormState
  onFormChange: (patch: Partial<ResortFacilityGroupFormState>) => void
  readOnly: boolean
  showAutoFillHint?: boolean
  disabled?: boolean
  editingHint?: boolean
  onEditingHintChange?: (v: boolean) => void
}

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

function IconSection({ form, onFormChange, readOnly, showAutoFillHint, disabled, editingHint, onEditingHintChange }: IconSectionProps) {
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

// ── Step 2: Platform facility selector ───────────────────────────────────────

interface FacilityPickerProps {
  facilities: PlatformFacilitySummary[]
  loading: boolean
  selectedIds: Set<number>
  onToggle: (id: number) => void
  onSelectAll: () => void
  onDeselectAll: () => void
}

function FacilityPicker({ facilities, loading, selectedIds, onToggle, onSelectAll, onDeselectAll }: FacilityPickerProps) {
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

      {/* Facility cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {facilities.map((f) => {
          const selected = selectedIds.has(f.id)
          const name = f.locales[0]?.name ?? f.code
          const accentColor = String(f.icon_meta?.color ?? "") || undefined

          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onToggle(f.id)}
              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all
                ${selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:bg-accent/40 hover:border-border"
                }`}
            >
              {/* Checkbox */}
              <div className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors
                ${selected ? "border-primary bg-primary" : "border-muted-foreground/40 bg-background"}`}
              >
                {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
              </div>

              {/* Icon */}
              <div
                className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0"
                style={{
                  background: accentColor ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` : undefined,
                }}
              >
                {f.icon_type === "LUCIDE" && f.icon_value ? (
                  <LucideIconRenderer name={f.icon_value} size={14} style={{ color: accentColor ? "white" : undefined }} />
                ) : (f.icon_type === "IMAGE" || f.icon_type === "EXTERNAL") && f.icon_value ? (
                  <img src={f.icon_value} alt={name} className="h-4 w-4 object-contain" />
                ) : (
                  <span className="text-xs font-mono font-semibold text-muted-foreground">
                    {name[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight truncate">{name}</p>
                <p className="text-xs text-muted-foreground font-mono">{f.code}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main dialog ──────────────────────────────────────────────────────────────

export interface ResortFacilityGroupDialogProps {
  resortId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: ResortFacilityGroupDialogMode
  groupId?: number
  form: ResortFacilityGroupFormState
  onFormChange: (form: ResortFacilityGroupFormState) => void
  availableLocales: Locale[]
  onSaved?: () => void | Promise<void>
}

export function ResortFacilityGroupDialog({
  resortId,
  open,
  onOpenChange,
  mode,
  groupId,
  form,
  onFormChange,
  availableLocales,
  onSaved,
}: ResortFacilityGroupDialogProps) {
  const { t } = useTranslation()

  // Step 1 state
  const [submitting, setSubmitting] = useState(false)
  const [generalEditing, setGeneralEditing] = useState(false)
  const [iconEditing, setIconEditing] = useState(false)
  const [createIconEditing, setCreateIconEditing] = useState(false)
  const [iconSubmitting, setIconSubmitting] = useState(false)
  const [localIcon, setLocalIcon] = useState<Pick<ResortFacilityGroupFormState, "icon_type" | "icon_value" | "icon_color">>({
    icon_type: "", icon_value: "", icon_color: "",
  })
  const [translationsEditing, setTranslationsEditing] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [createGroupMode, setCreateGroupMode] = useState<GroupMode>("platform")

  // Step 2 state
  const [step, setStep] = useState<1 | 2>(1)
  const [newGroupId, setNewGroupId] = useState(0)
  const [platformFacilities, setPlatformFacilities] = useState<PlatformFacilitySummary[]>([])
  const [platformFacilitiesLoading, setPlatformFacilitiesLoading] = useState(false)
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<Set<number>>(new Set())
  const [creatingFacilities, setCreatingFacilities] = useState(false)

  const inputsDisabled = mode === "create" && createGroupMode === "platform" && !form.facility_group_id

  useEffect(() => {
    if (!open) {
      setGeneralEditing(false)
      setIconEditing(false)
      setIconSubmitting(false)
      setCreateIconEditing(false)
      setTranslationsEditing(false)
      setConfirmClose(false)
      setCreateGroupMode("platform")
      setStep(1)
      setNewGroupId(0)
      setPlatformFacilities([])
      setSelectedFacilityIds(new Set())
      setCreatingFacilities(false)
    }
  }, [open])

  const isDirty = mode === "create"
    ? form.icon_type !== "" || form.icon_value !== "" || form.sort_order !== 0
      || form.locales.length > 1 || form.locales.some((l) => l.locale_id !== "" || l.name.trim() !== "")
    : generalEditing || iconEditing || translationsEditing

  function requestClose() {
    if (step === 2) {
      // Group already saved — safe to close, just trigger refresh
      finishAndClose()
      return
    }
    if (isDirty) setConfirmClose(true)
    else onOpenChange(false)
  }

  async function finishAndClose() {
    onOpenChange(false)
    await onSaved?.()
  }

  function startIconEdit() {
    setLocalIcon({ icon_type: form.icon_type, icon_value: form.icon_value, icon_color: form.icon_color })
    setIconEditing(true)
  }

  async function saveIcon() {
    if (groupId == null) return
    if (localIcon.icon_type && !localIcon.icon_value) {
      toast.error(t("resortFacilityGroup.errIconValue"))
      return
    }
    setIconSubmitting(true)
    try {
      await resortFacilityGroupsService.update(resortId, groupId, {
        sort_order: form.sort_order,
        facility_group_id: form.facility_group_id ? Number(form.facility_group_id) : null,
        ...toApiIconPayload(localIcon as ResortFacilityGroupFormState),
      })
      toast.success(t("resortFacilityGroup.updated"))
      setIconEditing(false)
      onFormChange({ ...form, ...localIcon })
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIconSubmitting(false)
    }
  }

  async function loadPlatformFacilities(platformGroupId: number) {
    setPlatformFacilitiesLoading(true)
    try {
      const res = await platformFacilitiesService.list({
        facilityGroupId: platformGroupId,
        size: 50,
        sort_by: "sortOrder",
      })
      setPlatformFacilities(res.data)
      setSelectedFacilityIds(new Set(res.data.map((f) => f.id)))
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setPlatformFacilitiesLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode !== "create") return
    if (form.icon_type && !form.icon_value) {
      toast.error(t("resortFacilityGroup.errIconValue"))
      return
    }
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) { toast.error(t("locale.errLang", { n: i + 1 })); return }
      if (!row.name.trim()) { toast.error(t("locale.errName", { n: i + 1 })); return }
    }
    setSubmitting(true)
    try {
      const result = await resortFacilityGroupsService.create(resortId, {
        facility_group_id: form.facility_group_id ? Number(form.facility_group_id) : undefined,
        sort_order: Number(form.sort_order) || 0,
        ...toApiIconPayload(form),
        locales: form.locales.map((row) => ({
          locale_id: Number(row.locale_id),
          name: row.name.trim(),
          description: row.description.trim(),
          sort_order: Number(row.sort_order) || 0,
        })),
      })
      toast.success(t("resortFacilityGroup.created"))

      // Platform group → proceed to step 2 (facility selection)
      if (form.facility_group_id) {
        setNewGroupId(result.id)
        setStep(2)
        loadPlatformFacilities(Number(form.facility_group_id))
      } else {
        // Custom group → done
        onOpenChange(false)
        await onSaved?.()
      }
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateFacilities() {
    if (selectedFacilityIds.size === 0) {
      finishAndClose()
      return
    }
    setCreatingFacilities(true)
    try {
      const toCreate = platformFacilities.filter((f) => selectedFacilityIds.has(f.id))
      await Promise.all(
        toCreate.map((f) =>
          resortFacilitiesService.create(resortId, {
            resort_facility_group_id: newGroupId,
            facility_id: f.id,
            sort_order: f.sort_order ?? 0,
            icon_type: f.icon_type ? (f.icon_type as "LUCIDE" | "IMAGE" | "SVG" | "EXTERNAL") : null,
            icon_value: f.icon_value ?? null,
            icon_meta: f.icon_meta ?? null,
            locales: f.locales.map((l) => ({
              locale_id: l.locale_id,
              name: l.name,
              description: "",
              sort_order: l.sort_order,
            })),
          }),
        ),
      )
      toast.success(t("resortFacilityGroup.facilitiesAdded", { count: toCreate.length }))
      finishAndClose()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setCreatingFacilities(false)
    }
  }

  function toggleFacility(id: number) {
    setSelectedFacilityIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const isEditing = generalEditing || iconEditing || translationsEditing

  // ── Header content switches on step ──────────────────────────────────────
  const headerIcon = step === 2 ? <ListChecks className="h-4 w-4" /> : <Layers className="h-4 w-4" />
  const headerTitle = step === 2
    ? t("resortFacilityGroup.addFacilitiesStep")
    : mode === "create"
      ? t("resortFacilityGroup.dialogCreate")
      : isEditing ? t("resortFacilityGroup.dialogEdit") : t("resortFacilityGroup.dialogView")
  const headerDesc = step === 2
    ? t("resortFacilityGroup.addFacilitiesDesc")
    : mode === "create"
      ? t("resortFacilityGroup.dialogDescCreate")
      : isEditing ? t("resortFacilityGroup.dialogDescEdit") : t("resortFacilityGroup.dialogDescView")

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose() }}>
        <DialogContent
          className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose() }}
        >
          <DialogTitle className="sr-only">{mode === "create" ? t("resortFacilityGroup.dialogCreate") : t("resortFacilityGroup.dialogView")}</DialogTitle>
          {/* ── Step indicator (only in create mode, step 2) ─────────────────── */}
          {step === 2 && (
            <div className="flex items-center gap-2 px-6 pt-4 shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="flex size-5 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Check className="h-3 w-3" />
                </div>
                <span className="text-xs text-muted-foreground">{t("resortFacilityGroup.stepGroup")}</span>
              </div>
              <div className="flex-1 h-px bg-border" />
              <div className="flex items-center gap-1.5">
                <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  2
                </div>
                <span className="text-xs font-medium">{t("resortFacilityGroup.stepFacilities")}</span>
              </div>
            </div>
          )}

          {/* ── Dialog header ─────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {headerIcon}
            </div>
            <div>
              <p className="text-sm font-semibold">{headerTitle}</p>
              <p className="text-xs text-muted-foreground">{headerDesc}</p>
            </div>
          </div>

          {/* ── Step 1: Group creation form ───────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                <ResortFacilityGroupGeneralInfo
                  resortId={resortId}
                  mode={mode}
                  form={form}
                  onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                  groupId={groupId}
                  onSaved={onSaved}
                  editing={generalEditing}
                  onEditingChange={setGeneralEditing}
                  open={open}
                  createGroupMode={createGroupMode}
                  onCreateGroupModeChange={setCreateGroupMode}
                />

                {/* Icon section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                        {t("resortFacilityGroup.iconSection")}
                      </h3>
                    </div>
                      {mode !== "create" && !iconEditing && (
                      <Button type="button" size="sm" variant="outline" onClick={startIconEdit} className="h-7 text-xs px-2.5 gap-1.5">
                        <Layers className="h-3.5 w-3.5" /> {t("common.edit")}
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
                    showAutoFillHint={mode === "create" && !!form.facility_group_id}
                    disabled={inputsDisabled}
                    editingHint={createIconEditing}
                    onEditingHintChange={setCreateIconEditing}
                  />
                </div>

                <ResortFacilityGroupLocaleTranslations
                  resortId={resortId}
                  mode={mode}
                  form={form}
                  onFormChange={onFormChange}
                  groupId={groupId}
                  availableLocales={availableLocales}
                  onSaved={onSaved}
                  editing={translationsEditing}
                  onEditingChange={setTranslationsEditing}
                  open={open}
                  disabled={inputsDisabled}
                />
              </div>

              {mode === "create" && (
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t shrink-0">
                  <Button type="button" variant="outline" onClick={requestClose} disabled={submitting}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? t("common.saving") : t("resortFacilityGroup.create")}
                  </Button>
                </div>
              )}
            </form>
          )}

          {/* ── Step 2: Platform facility selection ───────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col min-h-0 flex-1">
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <FacilityPicker
                  facilities={platformFacilities}
                  loading={platformFacilitiesLoading}
                  selectedIds={selectedFacilityIds}
                  onToggle={toggleFacility}
                  onSelectAll={() => setSelectedFacilityIds(new Set(platformFacilities.map((f) => f.id)))}
                  onDeselectAll={() => setSelectedFacilityIds(new Set())}
                />
              </div>

              <div className="flex items-center justify-between gap-2 px-6 py-4 border-t shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={finishAndClose}
                  disabled={creatingFacilities}
                >
                  {t("resortFacilityGroup.addFacilitiesSkip")}
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateFacilities}
                  disabled={creatingFacilities || platformFacilitiesLoading}
                >
                  {creatingFacilities
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("resortFacilityGroup.creatingFacilities")}</>
                    : selectedFacilityIds.size === 0
                      ? t("resortFacilityGroup.addFacilitiesSkip")
                      : t("resortFacilityGroup.addFacilitiesBtn", { count: selectedFacilityIds.size })
                  }
                </Button>
              </div>
            </div>
          )}
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

export { emptyForm as emptyResortFacilityGroupForm }
