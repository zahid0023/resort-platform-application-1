"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronDown, Link2, Pencil, Star, X } from "lucide-react"
import { Button, Card, CardContent, Input, Label } from "@resort/shadcn-ui"
import { LucideIconRenderer } from "ui-blocks"
import { resortFacilitiesService } from "@/services/resort-facilities"
import { type PlatformFacilitySummary } from "@/services/platform-facilities"
import { type ResortFacilityGroupSummary } from "@/services/resort-facility-groups"
import { ResortFacilityGroupPickerDialog } from "@/components/resort-facility-groups/resort-facility-group-picker-dialog"
import { PlatformFacilityPickerDialog } from "./platform-facility-picker-dialog"
import { toast } from "sonner"
import type { ResortFacilityDialogMode, ResortFacilityFormState, FacilityMode } from "./types"
import { toApiIconPayload } from "./types"


export interface ResortFacilityGeneralInfoProps {
  resortId: number
  mode: ResortFacilityDialogMode
  form: ResortFacilityFormState
  onFormChange: (patch: Partial<ResortFacilityFormState>) => void
  facilityId?: number
  onSaved?: () => void | Promise<void>
  editing: boolean
  onEditingChange: (v: boolean) => void
  open: boolean
  facilityMode: FacilityMode
  onFacilityModeChange: (m: FacilityMode) => void
  lockedGroupName?: string
  platformFacilityGroupId?: number
  /** Owned by the parent dialog — persisted alongside the create-form draft so the picked
   * platform facility's display details survive a close/reopen/restore-draft round trip, not just
   * its bare `facility_id`. */
  selectedPlatFacility: PlatformFacilitySummary | null
  onSelectedPlatFacilityChange: (f: PlatformFacilitySummary | null) => void
}

export function ResortFacilityGeneralInfo({
  resortId,
  mode,
  form,
  onFormChange,
  facilityId,
  onSaved,
  editing,
  onEditingChange,
  open,
  facilityMode,
  onFacilityModeChange,
  lockedGroupName,
  platformFacilityGroupId,
  selectedPlatFacility,
  onSelectedPlatFacilityChange,
}: ResortFacilityGeneralInfoProps) {
  const { t } = useTranslation()
  const [local, setLocal] = useState<{ sort_order: number }>({ sort_order: 0 })
  const [submitting, setSubmitting] = useState(false)

  // Platform facility picker dialog state — create mode only, facility_id is immutable afterward
  const [platPickerOpen, setPlatPickerOpen] = useState(false)

  // Group picker dialog (create mode when group not pre-set)
  const [groupPickerOpen, setGroupPickerOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<ResortFacilityGroupSummary | null>(null)

  useEffect(() => {
    if (!open) {
      setSubmitting(false)
      setPlatPickerOpen(false)
      setGroupPickerOpen(false)
      setSelectedGroup(null)
    }
  }, [open])

  // ── Platform facility picker ──────────────────────────────────────────────

  function handleCreateModeChange(m: FacilityMode) {
    onFacilityModeChange(m)
    if (m === "custom") { onFormChange({ facility_id: "" }); onSelectedPlatFacilityChange(null) }
  }

  function handlePlatFacilitySelect(f: PlatformFacilitySummary) {
    onSelectedPlatFacilityChange(f)
    onFormChange({
      facility_id: f.id,
      code: f.code,
      sort_order: f.sort_order ?? 0,
      icon_type: (f.icon_type ?? "") as ResortFacilityFormState["icon_type"],
      icon_value: f.icon_value ?? "",
      icon_color: String(f.icon_meta?.color ?? ""),
      locale: { name: f.locale?.name ?? "", description: f.locale?.description ?? "", sort_order: 0 },
    })
  }

  // ── Group picker ──────────────────────────────────────────────────────────

  function handleGroupSelect(group: ResortFacilityGroupSummary) {
    setSelectedGroup(group)
    onSelectedPlatFacilityChange(null)
    onFormChange({ resort_facility_group_id: group.id, facility_id: "" })
  }

  // The picker can only filter by an explicitly passed platform group id — when the owning page
  // picked a resort group via `ResortFacilityGroupPickerDialog` (no `lockedGroupName`) rather than
  // being handed one by context, it doesn't resolve `group.facility_group_id` into this prop itself.
  const effectivePlatFacilityGroupId = platformFacilityGroupId

  const selectedGroupLabel = selectedGroup
    ? (selectedGroup.locale?.name ?? `Group #${selectedGroup.id}`)
    : form.resort_facility_group_id
      ? `Group #${form.resort_facility_group_id}`
      : t("resortFacility.selectGroup")

  // ── Edit handlers ─────────────────────────────────────────────────────────

  function startEdit() {
    setLocal({ sort_order: form.sort_order })
    onEditingChange(true)
  }

  async function save() {
    if (facilityId == null) return
    setSubmitting(true)
    try {
      await resortFacilitiesService.update(resortId, facilityId, {
        sort_order: Number(local.sort_order) || 0,
        ...toApiIconPayload(form),
      })
      toast.success(t("resortFacility.updated"))
      onEditingChange(false)
      onFormChange({ sort_order: Number(local.sort_order) || 0 })
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const isReadOnly = !editing && mode !== "create"
  const sortValue = editing ? local.sort_order : form.sort_order

  return (
    <div className="space-y-8">
      {/* ── Section 1: Facility Type — create-only, facility_id is immutable after creation ── */}
      {mode === "create" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              {t("resortFacility.facilityType")}
            </h3>
          </div>

          <Card>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCreateModeChange("platform")}
                  className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left cursor-pointer transition-colors hover:bg-accent/50
                    ${facilityMode === "platform" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-medium">{t("resortFacility.fromPlatform")}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{t("resortFacility.fromPlatformDesc")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateModeChange("custom")}
                  className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left cursor-pointer transition-colors hover:bg-accent/50
                    ${facilityMode === "custom" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-medium">{t("resortFacility.custom")}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{t("resortFacility.customDesc")}</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Section 2: General Info ───────────────────────────────────────── */}
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

            {/* Group — shown whenever known: the create-mode picker, or a group name the
                owning page already knows from context (resort_facility_group_id is write-only
                and never returned by the API, so view/edit mode can only show a locked name). */}
            {(mode === "create" || lockedGroupName) && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">{t("resortFacility.group")}{mode === "create" ? " *" : ""}</Label>
                {lockedGroupName ? (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                    <span className="text-sm">{lockedGroupName}</span>
                  </div>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between font-normal"
                      onClick={() => setGroupPickerOpen(true)}
                    >
                      <span className={form.resort_facility_group_id ? "" : "text-muted-foreground"}>
                        {selectedGroupLabel}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                    <ResortFacilityGroupPickerDialog
                      resortId={resortId}
                      open={groupPickerOpen}
                      onOpenChange={setGroupPickerOpen}
                      selectedId={form.resort_facility_group_id || undefined}
                      onSelect={handleGroupSelect}
                    />
                  </>
                )}
              </div>
            )}

            {/* Platform facility picker — create mode only */}
            {mode === "create" && facilityMode === "platform" && !!form.resort_facility_group_id && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t("resortFacility.platformFacility")} *</Label>
                {selectedPlatFacility ? (
                  <div className="flex items-center gap-3 rounded-lg border border-primary bg-primary/5 px-3 py-2.5">
                    <div
                      className="h-8 w-8 shrink-0 rounded-md flex items-center justify-center bg-primary/10"
                      style={String(selectedPlatFacility.icon_meta?.color ?? "") ? { background: `linear-gradient(135deg, ${String(selectedPlatFacility.icon_meta?.color ?? "")}, ${String(selectedPlatFacility.icon_meta?.color ?? "")}cc)` } : undefined}
                    >
                      {selectedPlatFacility.icon_type === "LUCIDE" && selectedPlatFacility.icon_value ? (
                        <LucideIconRenderer name={selectedPlatFacility.icon_value} size={15} style={{ color: String(selectedPlatFacility.icon_meta?.color ?? "") ? "white" : undefined }} />
                      ) : (selectedPlatFacility.icon_type === "IMAGE" || selectedPlatFacility.icon_type === "EXTERNAL") && selectedPlatFacility.icon_value ? (
                        <img src={selectedPlatFacility.icon_value} alt={selectedPlatFacility.code} className="h-4 w-4 object-contain" />
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground">{(selectedPlatFacility.locale?.name ?? selectedPlatFacility.code)[0]?.toUpperCase() ?? "?"}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{selectedPlatFacility.locale?.name ?? selectedPlatFacility.code}</p>
                      <p className="text-xs text-muted-foreground font-mono">{selectedPlatFacility.code}</p>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={() => setPlatPickerOpen(true)} className="h-7 text-xs px-2.5 shrink-0">
                      {t("common.change")}
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPlatPickerOpen(true)}
                    className="w-full flex items-center justify-between rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent/50 cursor-pointer transition-colors"
                  >
                    <span>{t("resortFacility.selectPlatformFacility")}</span>
                  </button>
                )}
                <PlatformFacilityPickerDialog
                  open={platPickerOpen}
                  onOpenChange={setPlatPickerOpen}
                  selectedId={form.facility_id || undefined}
                  facilityGroupId={effectivePlatFacilityGroupId}
                  onSelect={handlePlatFacilitySelect}
                />
              </div>
            )}

            {/* Code — auto-filled from the platform facility when linked, always owner-editable, immutable after creation */}
            <div className="space-y-2">
              <Label htmlFor="rf-code" className="text-xs font-medium">{t("resortFacility.code")} {mode === "create" && "*"}</Label>
              <Input
                id="rf-code"
                value={form.code}
                onChange={(e) => onFormChange({ code: e.target.value.toUpperCase() })}
                placeholder="RESTAURANT"
                disabled={isReadOnly || (mode === "create" && !form.resort_facility_group_id)}
                className="font-mono"
              />
            </div>

            {/* Sort order */}
            <div className="space-y-2">
              <Label htmlFor="rf-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
              <Input
                id="rf-sort"
                type="number"
                value={sortValue}
                onChange={(e) => {
                  if (mode === "create") onFormChange({ sort_order: Number(e.target.value) })
                  else setLocal((p) => ({ ...p, sort_order: Number(e.target.value) }))
                }}
                required={mode === "create"}
                disabled={isReadOnly || (mode === "create" && !form.resort_facility_group_id)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
