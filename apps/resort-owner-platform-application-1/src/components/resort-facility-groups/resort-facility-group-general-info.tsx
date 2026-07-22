"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Check, Link2, Loader2, Pencil, Star, X } from "lucide-react"
import { Button, Card, CardContent, Input, Label } from "@resort/shadcn-ui"
import { LucideIconRenderer } from "ui-blocks"
import { resortFacilityGroupsService } from "@/services/resort-facility-groups"
import { platformFacilityGroupsService, type PlatformFacilityGroupSummary } from "@/services/platform-facility-groups"
import { toast } from "sonner"
import type { ResortFacilityGroupDialogMode, ResortFacilityGroupFormState } from "./types"
import { toApiIconPayload } from "./types"

const PLAT_PAGE_SIZE = 20

export type GroupMode = "platform" | "custom"

export interface ResortFacilityGroupGeneralInfoProps {
  resortId: number
  mode: ResortFacilityGroupDialogMode
  form: ResortFacilityGroupFormState
  onFormChange: (patch: Partial<ResortFacilityGroupFormState>) => void
  groupId?: number
  onSaved?: () => void | Promise<void>
  editing: boolean
  onEditingChange: (v: boolean) => void
  open: boolean
  createGroupMode: GroupMode
  onCreateGroupModeChange: (m: GroupMode) => void
}

export function ResortFacilityGroupGeneralInfo({
  resortId,
  mode,
  form,
  onFormChange,
  groupId,
  onSaved,
  editing,
  onEditingChange,
  open,
  createGroupMode,
  onCreateGroupModeChange,
}: ResortFacilityGroupGeneralInfoProps) {
  const { t } = useTranslation()
  const [local, setLocal] = useState<{ sort_order: number; facility_group_id: number | "" }>({
    sort_order: 0,
    facility_group_id: "",
  })
  const [localGroupMode, setLocalGroupMode] = useState<GroupMode>("custom")
  const [submitting, setSubmitting] = useState(false)

  // Platform group picker state
  const [platGroups, setPlatGroups] = useState<PlatformFacilityGroupSummary[]>([])
  const [platPage, setPlatPage] = useState(0)
  const [platHasNext, setPlatHasNext] = useState(false)
  const [platLoading, setPlatLoading] = useState(false)
  const [platSearch, setPlatSearch] = useState("")
  const [platOpen, setPlatOpen] = useState(false)
  const platLoadedRef = useRef(false)

  useEffect(() => {
    if (!open) {
      setSubmitting(false)
      setPlatGroups([])
      setPlatPage(0)
      setPlatHasNext(false)
      setPlatSearch("")
      setPlatOpen(false)
      platLoadedRef.current = false
    }
  }, [open])

  function openPlatPicker() {
    setPlatOpen(true)
    if (!platLoadedRef.current) {
      platLoadedRef.current = true
      loadPlatGroups(0, true)
    }
  }

  async function loadPlatGroups(page: number, reset = false) {
    setPlatLoading(true)
    try {
      const res = await platformFacilityGroupsService.list({ page, size: PLAT_PAGE_SIZE, sort_by: "sortOrder", scope_code: "RESORT" })
      setPlatGroups((prev) => (reset ? res.data : [...prev, ...res.data]))
      setPlatPage(page)
      setPlatHasNext(res.has_next)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setPlatLoading(false)
    }
  }

  function handleCreateGroupModeChange(m: GroupMode) {
    onCreateGroupModeChange(m)
    if (m === "custom") { onFormChange({ facility_group_id: "" }); setPlatOpen(false) }
    setPlatSearch("")
  }

  function startEdit() {
    setLocal({ sort_order: form.sort_order, facility_group_id: form.facility_group_id })
    setLocalGroupMode(form.facility_group_id ? "platform" : "custom")
    onEditingChange(true)
  }

  function handleEditGroupModeChange(m: GroupMode) {
    setLocalGroupMode(m)
    if (m === "custom") { setLocal((p) => ({ ...p, facility_group_id: "" })); setPlatOpen(false) }
    setPlatSearch("")
  }

  async function save() {
    if (groupId == null) return
    setSubmitting(true)
    try {
      await resortFacilityGroupsService.update(resortId, groupId, {
        facility_group_id: local.facility_group_id ? Number(local.facility_group_id) : null,
        sort_order: Number(local.sort_order) || 0,
        ...toApiIconPayload(form),
      })
      toast.success(t("resortFacilityGroup.updated"))
      onEditingChange(false)
      onFormChange({ sort_order: Number(local.sort_order) || 0, facility_group_id: local.facility_group_id })
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const isReadOnly = !editing && mode !== "create"
  const sortValue = editing ? local.sort_order : form.sort_order
  const activeGroupMode = mode === "create" ? createGroupMode : localGroupMode
  const activeFgId = mode === "create" ? form.facility_group_id : (editing ? local.facility_group_id : form.facility_group_id)

  const filteredPlatGroups = platSearch.trim()
    ? platGroups.filter((g) => {
        const q = platSearch.toLowerCase()
        return g.code.toLowerCase().includes(q) || (g.locales[0]?.name ?? "").toLowerCase().includes(q)
      })
    : platGroups

  function selectPlatGroup(g: PlatformFacilityGroupSummary) {
    if (mode === "create") {
      onFormChange({
        facility_group_id: g.id,
        sort_order: g.sort_order,
        icon_type: (g.icon_type ?? "") as ResortFacilityGroupFormState["icon_type"],
        icon_value: g.icon_value ?? "",
        icon_color: String(g.icon_meta?.color ?? ""),
        locales: g.locales.length > 0
          ? g.locales.map((l) => ({
              locale_id: l.locale_id,
              name: l.name,
              description: "",
              sort_order: l.sort_order,
            }))
          : [{ locale_id: "", name: "", description: "", sort_order: 0 }],
      })
    } else {
      setLocal((p) => ({ ...p, facility_group_id: g.id }))
    }
    setPlatSearch("")
    setPlatOpen(false)
  }

  const showGroupChooser = mode === "create" || editing

  // ── Shared platform group card grid ──────────────────────────────────────
  function renderPlatPicker() {
    const sel = platGroups.find((g) => g.id === activeFgId)

    return (
      <div className="space-y-2">
        {/* Selected display */}
        {activeFgId && !platOpen && sel && (() => {
          const name = sel.locales[0]?.name ?? sel.code
          const accentColor = String(sel.icon_meta?.color ?? "") || undefined
          return (
            <div className="flex items-center gap-3 rounded-lg border border-primary bg-primary/5 px-3 py-2.5">
              <div
                className="h-8 w-8 shrink-0 rounded-md flex items-center justify-center bg-primary/10"
                style={accentColor ? { background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` } : undefined}
              >
                {sel.icon_type === "LUCIDE" && sel.icon_value ? (
                  <LucideIconRenderer name={sel.icon_value} size={15} style={{ color: accentColor ? "white" : undefined }} />
                ) : (sel.icon_type === "IMAGE" || sel.icon_type === "EXTERNAL") && sel.icon_value ? (
                  <img src={sel.icon_value} alt={name} className="h-4 w-4 object-contain" />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">{name[0]?.toUpperCase() ?? "?"}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{name}</p>
                <p className="text-xs text-muted-foreground font-mono">{sel.code}</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={openPlatPicker} className="h-7 text-xs px-2.5 shrink-0">
                {t("common.change")}
              </Button>
            </div>
          )
        })()}

        {/* Trigger when nothing selected */}
        {!activeFgId && !platOpen && (
          <button
            type="button"
            onClick={openPlatPicker}
            className="w-full flex items-center justify-between rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent/50 transition-colors"
          >
            <span>{t("resortFacilityGroup.selectPlatformGroup")}</span>
            {platLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </button>
        )}

        {/* Card grid */}
        {platOpen && (
          <div className="space-y-2">
            <Input
              placeholder={t("resortFacilityGroup.searchPlatformGroup")}
              value={platSearch}
              onChange={(e) => setPlatSearch(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border p-2">
              {platLoading && platGroups.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredPlatGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t("resortFacilityGroup.noPlatformGroups")}
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredPlatGroups.map((g) => {
                      const name = g.locales[0]?.name ?? g.code
                      const isSelected = activeFgId === g.id
                      const accentColor = String(g.icon_meta?.color ?? "") || undefined
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => selectPlatGroup(g)}
                          className={[
                            "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all",
                            isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-accent/50",
                          ].join(" ")}
                        >
                          <div
                            className="h-7 w-7 shrink-0 rounded-md flex items-center justify-center bg-primary/10"
                            style={accentColor ? { background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` } : undefined}
                          >
                            {g.icon_type === "LUCIDE" && g.icon_value ? (
                              <LucideIconRenderer name={g.icon_value} size={13} style={{ color: accentColor ? "white" : undefined }} />
                            ) : (g.icon_type === "IMAGE" || g.icon_type === "EXTERNAL") && g.icon_value ? (
                              <img src={g.icon_value} alt={name} className="h-4 w-4 object-contain" />
                            ) : (
                              <span className="text-xs font-bold text-muted-foreground">{name[0]?.toUpperCase() ?? "?"}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium leading-tight truncate">{name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{g.code}</p>
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                        </button>
                      )
                    })}
                  </div>
                  {platHasNext && !platSearch.trim() && (
                    <button
                      type="button"
                      onClick={() => loadPlatGroups(platPage + 1)}
                      disabled={platLoading}
                      className="w-full mt-2 py-1.5 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 border-t"
                    >
                      {platLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {t("common.loadMore")}
                    </button>
                  )}
                </>
              )}
            </div>
            {activeFgId && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setPlatOpen(false)} className="h-7 text-xs w-full text-muted-foreground">
                {t("common.cancel")}
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* ── Section 1: Group Type ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("resortFacilityGroup.groupType")}
          </h3>
        </div>

        <Card>
          <CardContent className="space-y-4">
            {/* Toggle — shown in create and edit modes */}
            {showGroupChooser && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => mode === "create" ? handleCreateGroupModeChange("platform") : handleEditGroupModeChange("platform")}
                  className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50
                    ${activeGroupMode === "platform" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-medium">{t("resortFacilityGroup.fromPlatform")}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{t("resortFacilityGroup.fromPlatformDesc")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => mode === "create" ? handleCreateGroupModeChange("custom") : handleEditGroupModeChange("custom")}
                  className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50
                    ${activeGroupMode === "custom" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-medium">{t("resortFacilityGroup.custom")}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{t("resortFacilityGroup.customDesc")}</span>
                </button>
              </div>
            )}

            {/* View mode badge */}
            {isReadOnly && (
              form.facility_group_id ? (
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                  <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-sm font-medium">{t("resortFacilityGroup.fromPlatform")}</span>
                  <span className="ml-auto text-xs text-muted-foreground font-mono">#{form.facility_group_id}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                  <Star className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-sm font-medium">{t("resortFacilityGroup.custom")}</span>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>

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
            {/* Platform group picker — shown when From Platform is selected */}
            {showGroupChooser && activeGroupMode === "platform" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t("resortFacilityGroup.platformGroup")} *</Label>
                {renderPlatPicker()}
              </div>
            )}

            {/* Sort order */}
            <div className="space-y-2">
              <Label htmlFor="rfg-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
              <Input
                id="rfg-sort"
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
    </>
  )
}
