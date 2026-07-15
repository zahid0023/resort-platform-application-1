"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronDown, Link2, Loader2, Pencil, Star, X } from "lucide-react"
import { Button, Card, CardContent, Input, Label, Popover, PopoverContent, PopoverTrigger } from "@resort/shadcn-ui"
import { resortFacilitiesService } from "@/services/resort-facilities"
import { platformFacilitiesService, type PlatformFacilitySummary } from "@/services/platform-facilities"
import { resortFacilityGroupsService, type ResortFacilityGroupSummary } from "@/services/resort-facility-groups"
import { toast } from "sonner"
import type { ResortFacilityDialogMode, ResortFacilityFormState, FacilityMode } from "./types"
import { toApiIconPayload } from "./types"

const PLAT_PAGE_SIZE = 20

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
}: ResortFacilityGeneralInfoProps) {
  const { t } = useTranslation()
  const [local, setLocal] = useState<{ sort_order: number; facility_id: number | "" }>({
    sort_order: 0,
    facility_id: "",
  })
  const [localFacilityMode, setLocalFacilityMode] = useState<FacilityMode>("custom")
  const [submitting, setSubmitting] = useState(false)

  // Platform facility picker
  const [platFacilities, setPlatFacilities] = useState<PlatformFacilitySummary[]>([])
  const [platPage, setPlatPage] = useState(0)
  const [platHasNext, setPlatHasNext] = useState(false)
  const [platLoading, setPlatLoading] = useState(false)
  const [platSearch, setPlatSearch] = useState("")
  const [platPopoverOpen, setPlatPopoverOpen] = useState(false)
  const platLoadedRef = useRef(false)

  // Group picker (create mode when group not pre-set)
  const [groups, setGroups] = useState<ResortFacilityGroupSummary[]>([])
  const [groupSearch, setGroupSearch] = useState("")
  const [groupPopoverOpen, setGroupPopoverOpen] = useState(false)
  const [groupLoading, setGroupLoading] = useState(false)
  const groupLoadedRef = useRef(false)

  useEffect(() => {
    if (!open) {
      setSubmitting(false)
      setPlatFacilities([])
      setPlatPage(0)
      setPlatHasNext(false)
      setPlatSearch("")
      setPlatPopoverOpen(false)
      platLoadedRef.current = false
      setGroups([])
      setGroupSearch("")
      setGroupPopoverOpen(false)
      groupLoadedRef.current = false
    }
  }, [open])

  // ── Platform facility picker ──────────────────────────────────────────────

  async function loadPlatFacilities(page: number, reset = false) {
    setPlatLoading(true)
    try {
      const res = await platformFacilitiesService.list({ page, size: PLAT_PAGE_SIZE, sort_by: "sortOrder" })
      setPlatFacilities((prev) => (reset ? res.data : [...prev, ...res.data]))
      setPlatPage(page)
      setPlatHasNext(res.has_next)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setPlatLoading(false)
    }
  }

  function handlePlatPopoverOpen(v: boolean) {
    setPlatPopoverOpen(v)
    if (v && !platLoadedRef.current) {
      platLoadedRef.current = true
      loadPlatFacilities(0, true)
    }
  }

  function handleCreateModeChange(m: FacilityMode) {
    onFacilityModeChange(m)
    if (m === "custom") onFormChange({ facility_id: "" })
    setPlatPopoverOpen(false)
    setPlatSearch("")
  }

  function handleEditModeChange(m: FacilityMode) {
    setLocalFacilityMode(m)
    if (m === "custom") setLocal((p) => ({ ...p, facility_id: "" }))
    setPlatPopoverOpen(false)
    setPlatSearch("")
  }

  function selectPlatFacility(f: PlatformFacilitySummary) {
    if (mode === "create") {
      onFormChange({
        facility_id: f.id,
        sort_order: f.sort_order ?? 0,
        icon_type: (f.icon_type ?? "") as ResortFacilityFormState["icon_type"],
        icon_value: f.icon_value ?? "",
        icon_color: String(f.icon_meta?.color ?? ""),
        locales: f.locales.length > 0
          ? f.locales.map((l) => ({
              locale_id: l.locale_id,
              name: l.name,
              description: "",
              sort_order: l.sort_order,
            }))
          : [{ locale_id: "", name: "", description: "", sort_order: 0 }],
      })
    } else {
      setLocal((p) => ({ ...p, facility_id: f.id }))
    }
    setPlatPopoverOpen(false)
    setPlatSearch("")
  }

  const filteredPlatFacilities = platSearch.trim()
    ? platFacilities.filter((f) => {
        const q = platSearch.toLowerCase()
        return f.code.toLowerCase().includes(q) || (f.locales[0]?.name ?? "").toLowerCase().includes(q)
      })
    : platFacilities

  const activeMode = mode === "create" ? facilityMode : localFacilityMode
  const activeFacilityId = mode === "create" ? form.facility_id : (editing ? local.facility_id : form.facility_id)
  const selectedPlatFacility = platFacilities.find((f) => f.id === activeFacilityId)
  const selectedPlatLabel = selectedPlatFacility
    ? `${selectedPlatFacility.locales[0]?.name ?? selectedPlatFacility.code} (${selectedPlatFacility.code})`
    : t("resortFacility.selectPlatformFacility")

  // ── Group picker ──────────────────────────────────────────────────────────

  async function loadGroups() {
    setGroupLoading(true)
    try {
      const res = await resortFacilityGroupsService.list(resortId, { size: 50, sort_by: "sortOrder" })
      setGroups(res.data)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setGroupLoading(false)
    }
  }

  function handleGroupPopoverOpen(v: boolean) {
    setGroupPopoverOpen(v)
    if (v && !groupLoadedRef.current) {
      groupLoadedRef.current = true
      loadGroups()
    }
  }

  const filteredGroups = groupSearch.trim()
    ? groups.filter((g) => (g.locales[0]?.name ?? "").toLowerCase().includes(groupSearch.toLowerCase()))
    : groups

  const selectedGroup = groups.find((g) => g.id === form.resort_facility_group_id)
  const selectedGroupLabel = selectedGroup
    ? (selectedGroup.locales[0]?.name ?? `Group #${selectedGroup.id}`)
    : form.resort_facility_group_id
      ? `Group #${form.resort_facility_group_id}`
      : t("resortFacility.selectGroup")

  // ── Edit handlers ─────────────────────────────────────────────────────────

  function startEdit() {
    setLocal({ sort_order: form.sort_order, facility_id: form.facility_id })
    setLocalFacilityMode(form.facility_id ? "platform" : "custom")
    onEditingChange(true)
  }

  async function save() {
    if (facilityId == null) return
    setSubmitting(true)
    try {
      await resortFacilitiesService.update(resortId, facilityId, {
        facility_id: local.facility_id ? Number(local.facility_id) : null,
        sort_order: Number(local.sort_order) || 0,
        ...toApiIconPayload(form),
      })
      toast.success(t("resortFacility.updated"))
      onEditingChange(false)
      onFormChange({ sort_order: Number(local.sort_order) || 0, facility_id: local.facility_id })
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const isReadOnly = !editing && mode !== "create"
  const sortValue = editing ? local.sort_order : form.sort_order
  const showChooser = mode === "create" || editing

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

          {/* Group picker — create mode only */}
          {mode === "create" && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("resortFacility.group")} *</Label>
              <Popover open={groupPopoverOpen} onOpenChange={handleGroupPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between font-normal">
                    <span className={form.resort_facility_group_id ? "" : "text-muted-foreground"}>
                      {selectedGroupLabel}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder={t("resortFacility.searchGroup")}
                      value={groupSearch}
                      onChange={(e) => setGroupSearch(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {groupLoading && groups.length === 0 ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredGroups.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">{t("resortFacility.noGroups")}</p>
                    ) : (
                      filteredGroups.map((g) => {
                        const label = g.locales[0]?.name ?? `Group #${g.id}`
                        const isSelected = form.resort_facility_group_id === g.id
                        return (
                          <button
                            key={g.id}
                            type="button"
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2 ${isSelected ? "bg-accent" : ""}`}
                            onClick={() => {
                              onFormChange({ resort_facility_group_id: g.id })
                              setGroupPopoverOpen(false)
                              setGroupSearch("")
                            }}
                          >
                            {isSelected
                              ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                              : <span className="w-3.5 shrink-0" />
                            }
                            <span>{label}</span>
                            <span className="ml-auto text-xs text-muted-foreground">#{g.id}</span>
                          </button>
                        )
                      })
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* View mode: show group info */}
          {isReadOnly && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("resortFacility.group")}</Label>
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                <span className="text-sm font-mono">Group #{form.resort_facility_group_id}</span>
              </div>
            </div>
          )}

          {/* From Platform / Custom choice */}
          {showChooser && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("resortFacility.facilityType")}</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => mode === "create" ? handleCreateModeChange("platform") : handleEditModeChange("platform")}
                  className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50
                    ${activeMode === "platform" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-medium">{t("resortFacility.fromPlatform")}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{t("resortFacility.fromPlatformDesc")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => mode === "create" ? handleCreateModeChange("custom") : handleEditModeChange("custom")}
                  className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50
                    ${activeMode === "custom" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-medium">{t("resortFacility.custom")}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{t("resortFacility.customDesc")}</span>
                </button>
              </div>
            </div>
          )}

          {/* Platform facility picker */}
          {showChooser && activeMode === "platform" && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("resortFacility.platformFacility")} *</Label>
              <Popover open={platPopoverOpen} onOpenChange={handlePlatPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between font-normal">
                    <span className={activeFacilityId ? "" : "text-muted-foreground"}>{selectedPlatLabel}</span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder={t("resortFacility.searchPlatformFacility")}
                      value={platSearch}
                      onChange={(e) => setPlatSearch(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {platLoading && platFacilities.length === 0 ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredPlatFacilities.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">{t("resortFacility.noPlatformFacilities")}</p>
                    ) : (
                      filteredPlatFacilities.map((f) => {
                        const label = f.locales[0]?.name ?? f.code
                        const isSelected = activeFacilityId === f.id
                        return (
                          <button
                            key={f.id}
                            type="button"
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2 ${isSelected ? "bg-accent" : ""}`}
                            onClick={() => selectPlatFacility(f)}
                          >
                            {isSelected
                              ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                              : <span className="w-3.5 shrink-0" />
                            }
                            <span>{label}</span>
                            <span className="ml-auto text-xs text-muted-foreground font-mono">{f.code}</span>
                          </button>
                        )
                      })
                    )}
                    {platHasNext && !platSearch.trim() && (
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent flex items-center justify-center gap-1.5 border-t"
                        onClick={() => loadPlatFacilities(platPage + 1)}
                        disabled={platLoading}
                      >
                        {platLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {t("common.loadMore")}
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* View mode: show platform link or custom badge */}
          {isReadOnly && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">{t("resortFacility.facilityType")}</Label>
              {form.facility_id ? (
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                  <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-sm font-medium">{t("resortFacility.fromPlatform")}</span>
                  <span className="ml-auto text-xs text-muted-foreground font-mono">#{form.facility_id}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                  <Star className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-sm font-medium">{t("resortFacility.custom")}</span>
                </div>
              )}
            </div>
          )}

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
              disabled={isReadOnly}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
