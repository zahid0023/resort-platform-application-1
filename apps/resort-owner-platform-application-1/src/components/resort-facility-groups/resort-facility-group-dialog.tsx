"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ArrowRight, Check, CircleCheck, Layers, ListChecks, Pencil, Plus, RefreshCw, Save, X } from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Button, Sheet, SheetContent,
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@resort/shadcn-ui"
import { DialogEntityHeader } from "@/components/shared/dialog-entity-header"
import { DialogCreateFooter } from "@/components/shared/dialog-create-footer"
import { resortFacilityGroupsService } from "@/services/resort-facility-groups"
import type { PlatformFacilityGroupSummary } from "@/services/platform-facility-groups"
import { resortFacilitiesService, type ResortFacilitySummary } from "@/services/resort-facilities"
import { ResortFacilityCard } from "@/components/resort-facilities/resort-facility-card"
import { ResortFacilityDialog, emptyResortFacilityForm } from "@/components/resort-facilities/resort-facility-dialog"
import type { ResortFacilityFormState } from "@/components/resort-facilities/types"
import type { Locale } from "@/services/locales"
import { toast } from "sonner"
import type { ResortFacilityGroupDialogMode, ResortFacilityGroupFormState } from "./types"
import { emptyForm, toApiIconPayload } from "./types"
import { ResortFacilityGroupGeneralInfo, type GroupMode } from "./resort-facility-group-general-info"
import { ResortFacilityGroupLocaleTranslations } from "./resort-facility-group-locale-translations"
import { IconSection } from "./resort-facility-group-icon-section"
import { ResortFacilityGroupAddFacilitiesStep } from "./resort-facility-group-add-facilities-step"

// Local autosave for the create form — never sent to the backend, just a browser-local checkpoint,
// scoped per-resort so a draft started for one resort never bleeds into another's create dialog.
const DRAFT_SAVE_DEBOUNCE_MS = 500
function draftKey(resortId: number) {
  return `resort-facility-group-dialog-draft-${resortId}`
}

interface DraftState {
  form: ResortFacilityGroupFormState
  /** The picked platform group's own display details — persisted alongside `form.facility_group_id`
   * so the "Select a platform group" section can render the picked group's name/icon/code again
   * after a close/reopen/restore-draft round trip, rather than falling back to the empty picker
   * prompt (there's no `GET /facility-groups/{id}` to re-derive it from just the id). */
  selectedPlatGroup: PlatformFacilityGroupSummary | null
}

function hasDraftContent(f: ResortFacilityGroupFormState): boolean {
  return !!f.facility_group_id || f.code.trim() !== "" || f.sort_order !== 0 || f.icon_type !== ""
    || f.locale.name.trim() !== "" || f.locale.description.trim() !== ""
}

function readDraft(resortId: number): DraftState | null {
  try {
    const raw = localStorage.getItem(draftKey(resortId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as DraftState
    return hasDraftContent(parsed.form) ? parsed : null
  } catch {
    return null
  }
}

function clearDraft(resortId: number) {
  localStorage.removeItem(draftKey(resortId))
}

export interface ResortFacilityGroupDialogProps {
  resortId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: ResortFacilityGroupDialogMode
  groupId?: number
  form: ResortFacilityGroupFormState
  onFormChange: (form: ResortFacilityGroupFormState) => void
  availableLocales: Locale[]
  totalLocaleCount: number | null
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
  totalLocaleCount,
  onSaved,
}: ResortFacilityGroupDialogProps) {
  const { t } = useTranslation()

  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
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
  const [activeTab, setActiveTab] = useState<"general" | "icon" | "locales" | "facilities">("general")

  // Create mode only — the group is created when the "Locales" tab is submitted, then the
  // Facilities tab unlocks for the post-creation bulk-add flow.
  const [groupCreated, setGroupCreated] = useState(false)
  const [newGroupId, setNewGroupId] = useState(0)
  const [addFacStep, setAddFacStep] = useState<2 | 3>(2)

  // View/edit mode only — lazy-loaded once the Facilities tab is first selected.
  const [groupFacilities, setGroupFacilities] = useState<ResortFacilitySummary[]>([])
  const [facilitiesLoaded, setFacilitiesLoaded] = useState(false)
  const [facilitiesLoading, setFacilitiesLoading] = useState(false)
  const [groupName, setGroupName] = useState("")

  // View/edit mode only — creates a new ResortFacility scoped to this group via the
  // standalone facility-create dialog, reused rather than duplicating its create flow here.
  const [facilityCreateOpen, setFacilityCreateOpen] = useState(false)
  const [facilityCreateForm, setFacilityCreateForm] = useState<ResortFacilityFormState>(emptyResortFacilityForm)

  // View/edit mode only — the Locale Translations section loads/refetches its own data
  // internally, so a manual refresh signals it by incrementing this counter rather than
  // calling a fetch function owned by this dialog.
  const [localesRefreshSignal, setLocalesRefreshSignal] = useState(0)

  // Owned here (not inside the Locales tab content) so it survives that tab unmounting on switch.
  const [localeSearch, setLocaleSearch] = useState("")

  // Create mode only — the picked platform group's own display details, kept alongside `form` so it
  // can round-trip through the draft (see DraftState above).
  const [selectedPlatGroup, setSelectedPlatGroup] = useState<PlatformFacilityGroupSummary | null>(null)

  const [draftPrompt, setDraftPrompt] = useState<DraftState | null>(null)
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null)
  const [draftSyncing, setDraftSyncing] = useState(false)

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
      setActiveTab("general")
      setGroupCreated(false)
      setNewGroupId(0)
      setAddFacStep(2)
      setGroupFacilities([])
      setFacilitiesLoaded(false)
      setGroupName("")
      setFacilityCreateOpen(false)
      setFacilityCreateForm(emptyResortFacilityForm)
      setLocalesRefreshSignal(0)
      setLocaleSearch("")
      setSelectedPlatGroup(null)
      setDraftPrompt(null)
      setDraftSavedAt(null)
      setDraftSyncing(false)
    }
  }, [open])

  // On opening a fresh create form, offer to resume a locally-saved draft.
  useEffect(() => {
    if (open && mode === "create") setDraftPrompt(readDraft(resortId))
  }, [open, mode, resortId])

  // Debounced local autosave of the create form — skipped while the restore prompt is pending or
  // once the group has actually been created (further edits then go through the real API instead).
  useEffect(() => {
    if (!open || mode !== "create" || draftPrompt || groupCreated) return
    if (hasDraftContent(form)) setDraftSyncing(true)
    const timer = setTimeout(() => {
      if (hasDraftContent(form)) {
        localStorage.setItem(draftKey(resortId), JSON.stringify({ form, selectedPlatGroup }))
        setDraftSavedAt(new Date())
      } else {
        clearDraft(resortId)
        setDraftSavedAt(null)
      }
      setDraftSyncing(false)
    }, DRAFT_SAVE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [form, selectedPlatGroup, open, mode, draftPrompt, groupCreated, resortId])

  function restoreDraft() {
    if (draftPrompt) {
      onFormChange(draftPrompt.form)
      setSelectedPlatGroup(draftPrompt.selectedPlatGroup)
      setDraftSavedAt(new Date())
    }
    setDraftPrompt(null)
  }

  function discardDraft() {
    clearDraft(resortId)
    setDraftSavedAt(null)
    setDraftSyncing(false)
    setDraftPrompt(null)
  }

  const draftIndicator = mode === "create" && !groupCreated && (draftSyncing || draftSavedAt) ? (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {draftSyncing ? (
        <>
          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> {t("dialog.draftSyncing")}
        </>
      ) : (
        <>
          <Save className="h-3.5 w-3.5" />
          {t("dialog.draftSaved", { time: draftSavedAt!.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" }) })}
        </>
      )}
    </span>
  ) : undefined

  const isDirty = generalEditing || iconEditing || translationsEditing

  async function finishAndClose() {
    onOpenChange(false)
    await onSaved?.()
  }

  function requestClose() {
    if (mode === "create") {
      if (groupCreated) { finishAndClose(); return }
      onOpenChange(false)
      return
    }
    if (isDirty) setConfirmClose(true)
    else onOpenChange(false)
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

  // Silent checks — drive the tabs' disabled state without firing toasts on every render.
  function isGeneralValid(): boolean {
    if (mode !== "create") return true
    if (!form.code.trim()) return false
    if (createGroupMode === "platform") return !!form.facility_group_id
    return true
  }
  function isIconValid(): boolean {
    if (!form.icon_type) return true
    return !!form.icon_value
  }
  function isLocaleValid(): boolean {
    return form.locale.name.trim() !== ""
  }

  // Same checks, but report which field is missing — used by both the Next buttons and submit.
  function validateGeneral(): boolean {
    if (mode !== "create") return true
    if (!form.code.trim()) {
      toast.error(t("resortFacilityGroup.errCode"))
      return false
    }
    if (createGroupMode === "platform" && !form.facility_group_id) {
      toast.error(t("resortFacilityGroup.selectGroupFirst"))
      return false
    }
    return true
  }
  function validateIcon(): boolean {
    if (form.icon_type && !form.icon_value) {
      toast.error(t("resortFacilityGroup.errIconValue"))
      return false
    }
    return true
  }
  function validateLocale(): boolean {
    if (!form.locale.name.trim()) { toast.error(t("locale.errName", { n: 1 })); return false }
    return true
  }

  function handleNextFromGeneral() {
    if (!validateGeneral()) return
    setActiveTab("icon")
  }

  function handleNextFromIcon() {
    if (!validateIcon()) return
    setActiveTab("locales")
  }

  async function fetchGroupFacilities(): Promise<void> {
    if (groupId == null) return
    setFacilitiesLoading(true)
    try {
      const [facRes, groupRes] = await Promise.all([
        resortFacilitiesService.list(resortId, { resort_facility_group_id: groupId, size: 12, sort_by: "createdAt" }),
        resortFacilityGroupsService.get(resortId, groupId),
      ])
      setGroupFacilities(facRes.data)
      setGroupName(groupRes.data.locale?.name ?? "")
      onFormChange({ ...form, facility_group_id: groupRes.data.facility_group_id ?? "" })
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setFacilitiesLoading(false)
    }
  }

  function openCreateFacility() {
    if (groupId == null) return
    setFacilityCreateForm({ ...emptyResortFacilityForm, resort_facility_group_id: groupId })
    setFacilityCreateOpen(true)
  }

  // View/edit mode only — lazy-loaded once, the first time the Facilities tab is selected.
  useEffect(() => {
    if (!open || mode === "create" || activeTab !== "facilities" || facilitiesLoaded || groupId == null) return
    setFacilitiesLoaded(true)
    fetchGroupFacilities()
  }, [open, mode, activeTab, facilitiesLoaded, groupId, resortId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Manual refresh only — switching tabs never re-fetches on its own otherwise (see the lazy-load
  // effects above). Pulls whichever the active tab needs. The Locales tab's own data lives inside
  // ResortFacilityGroupLocaleTranslations, so it's refreshed by bumping a signal counter instead
  // of calling a fetch function this dialog doesn't own.
  async function handleRefresh(): Promise<void> {
    if (groupId == null) return
    setRefreshing(true)
    try {
      if (activeTab === "general" || activeTab === "icon") {
        const res = await resortFacilityGroupsService.get(resortId, groupId)
        onFormChange({
          ...form,
          sort_order: res.data.sort_order,
          icon_type: (res.data.icon_type ?? "") as ResortFacilityGroupFormState["icon_type"],
          icon_value: res.data.icon_value ?? "",
          icon_color: String(res.data.icon_meta?.color ?? ""),
        })
      }
      if (activeTab === "locales") {
        setLocalesRefreshSignal((n) => n + 1)
      }
      if (activeTab === "facilities") {
        await fetchGroupFacilities()
      }
      toast.success(t("common.refreshed"))
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setRefreshing(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode !== "create") return
    if (!validateGeneral()) { setActiveTab("general"); return }
    if (!validateIcon()) { setActiveTab("icon"); return }
    if (!validateLocale()) { setActiveTab("locales"); return }
    setSubmitting(true)
    try {
      const result = await resortFacilityGroupsService.create(resortId, {
        facility_group_id: form.facility_group_id ? Number(form.facility_group_id) : undefined,
        code: form.code.trim(),
        sort_order: Number(form.sort_order) || 0,
        ...toApiIconPayload(form),
        locale: {
          name: form.locale.name.trim(),
          description: form.locale.description.trim(),
          sort_order: Number(form.locale.sort_order) || 0,
        },
      })
      clearDraft(resortId)
      toast.success(t("resortFacilityGroup.created"))
      setNewGroupId(result.id)
      setGroupCreated(true)
      setAddFacStep(2)
      setActiveTab("facilities")
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const isEditing = generalEditing || iconEditing || translationsEditing

  const headerIcon = mode === "create" && activeTab === "facilities"
    ? (addFacStep === 3 ? <ListChecks className="h-4 w-4" /> : <CircleCheck className="h-4 w-4 text-green-500" />)
    : <Layers className="h-4 w-4" />
  const headerTitle = mode === "create" && activeTab === "facilities"
    ? (addFacStep === 3 ? t("resortFacilityGroup.addFacilitiesStep") : t("resortFacilityGroup.createdTitle"))
    : mode === "create"
      ? t("resortFacilityGroup.dialogCreate")
      : isEditing ? t("resortFacilityGroup.dialogEdit") : t("resortFacilityGroup.dialogView")
  const headerDesc = mode === "create" && activeTab === "facilities"
    ? (addFacStep === 3 ? t("resortFacilityGroup.addFacilitiesDesc") : t("resortFacilityGroup.createdAsk"))
    : mode === "create"
      ? t("resortFacilityGroup.dialogDescCreate")
      : isEditing ? t("resortFacilityGroup.dialogDescEdit") : t("resortFacilityGroup.dialogDescView")

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => { if (!v) requestClose() }}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl p-0 gap-0 overflow-hidden flex flex-col h-full"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose() }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">

            <DialogEntityHeader icon={headerIcon} title={headerTitle} description={headerDesc} />

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "general" | "icon" | "locales" | "facilities")}
              className="flex-1 min-h-0 flex-col"
            >
              <div className="flex items-center justify-between mx-6 mt-4 gap-2">
                <TabsList className="w-fit shrink-0">
                  <TabsTrigger value="general" disabled={mode === "create" && groupCreated} className="cursor-pointer disabled:cursor-not-allowed">
                    {t("common.generalInfo")}
                  </TabsTrigger>
                  <TabsTrigger value="icon" disabled={mode === "create" && (groupCreated || !isGeneralValid())} className="cursor-pointer disabled:cursor-not-allowed">
                    {t("resortFacilityGroup.iconSection")}
                  </TabsTrigger>
                  <TabsTrigger value="locales" disabled={mode === "create" && (groupCreated || !(isGeneralValid() && isIconValid()))} className="cursor-pointer disabled:cursor-not-allowed">
                    {t("locale.translations")}
                  </TabsTrigger>
                  <TabsTrigger value="facilities" disabled={mode === "create" && !groupCreated} className="cursor-pointer disabled:cursor-not-allowed">
                    {t("resortFacilityGroup.stepFacilities")}
                  </TabsTrigger>
                </TabsList>
                {mode !== "create" && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={handleRefresh}
                    disabled={refreshing || generalEditing || iconEditing || translationsEditing}
                    title={t("common.refresh")}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  </Button>
                )}
              </div>

              <TabsContent value="general" className="min-h-0 overflow-y-auto px-6 py-5">
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
                  selectedPlatGroup={selectedPlatGroup}
                  onSelectedPlatGroupChange={setSelectedPlatGroup}
                />
              </TabsContent>

              <TabsContent value="icon" className="min-h-0 overflow-y-auto px-6 py-5">
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
                    showAutoFillHint={mode === "create" && !!form.facility_group_id}
                    disabled={inputsDisabled}
                    editingHint={createIconEditing}
                    onEditingHintChange={setCreateIconEditing}
                  />
                </div>
              </TabsContent>

              <TabsContent value="locales" className="min-h-0 overflow-y-auto px-6 py-5">
                <ResortFacilityGroupLocaleTranslations
                  resortId={resortId}
                  mode={mode}
                  form={form}
                  onFormChange={onFormChange}
                  groupId={groupId}
                  availableLocales={availableLocales}
                  totalLocaleCount={totalLocaleCount}
                  onSaved={onSaved}
                  editing={translationsEditing}
                  onEditingChange={setTranslationsEditing}
                  open={open}
                  disabled={inputsDisabled}
                  search={localeSearch}
                  onSearchChange={setLocaleSearch}
                  refreshSignal={localesRefreshSignal}
                />
              </TabsContent>

              <TabsContent value="facilities" className="min-h-0 overflow-y-auto px-6 py-5 flex-1 flex flex-col">
                {mode === "create" ? (
                  groupCreated && (
                    <ResortFacilityGroupAddFacilitiesStep
                      resortId={resortId}
                      newGroupId={newGroupId}
                      platformGroupId={form.facility_group_id}
                      step={addFacStep}
                      onStepChange={setAddFacStep}
                      onOpenChange={onOpenChange}
                      onSaved={onSaved}
                    />
                  )
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-primary" />
                        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                          {t("resortFacilityGroup.facilitiesSectionTitle")}
                        </h3>
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={openCreateFacility} className="h-7 text-xs px-2.5 gap-1.5">
                        <Plus className="h-3.5 w-3.5" /> {t("resortFacility.new")}
                      </Button>
                    </div>
                    {facilitiesLoading ? (
                      <div className="py-10 text-center text-sm text-muted-foreground">{t("resortFacility.loading")}</div>
                    ) : groupFacilities.length === 0 ? (
                      <div className="py-10 text-center text-sm text-muted-foreground border rounded-xl border-dashed">
                        {t("resortFacility.empty")}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groupFacilities.map((f) => (
                          <ResortFacilityCard key={f.id} facility={f} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {mode === "create" && activeTab === "general" && (
              <div className={`shrink-0 px-6 py-4 border-t bg-muted/40 flex items-center gap-2 ${draftIndicator ? "justify-between" : "justify-end"}`}>
                {draftIndicator}
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={requestClose} className="gap-1.5">
                    <X className="h-3.5 w-3.5" /> {t("common.cancel")}
                  </Button>
                  <Button type="button" size="sm" onClick={handleNextFromGeneral} disabled={!isGeneralValid()} className="gap-1.5">
                    {t("common.next")} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {mode === "create" && activeTab === "icon" && (
              <div className={`shrink-0 px-6 py-4 border-t bg-muted/40 flex items-center gap-2 ${draftIndicator ? "justify-between" : "justify-end"}`}>
                {draftIndicator}
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={requestClose} className="gap-1.5">
                    <X className="h-3.5 w-3.5" /> {t("common.cancel")}
                  </Button>
                  <Button type="button" size="sm" onClick={handleNextFromIcon} disabled={!isIconValid()} className="gap-1.5">
                    {t("common.next")} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {mode === "create" && activeTab === "locales" && (
              <DialogCreateFooter submitting={submitting} onCancel={requestClose} disabled={!isLocaleValid()} indicator={draftIndicator} />
            )}

          </form>
        </SheetContent>
      </Sheet>

      {mode !== "create" && groupId != null && (
        <ResortFacilityDialog
          resortId={resortId}
          open={facilityCreateOpen}
          onOpenChange={setFacilityCreateOpen}
          mode="create"
          form={facilityCreateForm}
          onFormChange={setFacilityCreateForm}
          availableLocales={availableLocales}
          totalLocaleCount={totalLocaleCount}
          onSaved={fetchGroupFacilities}
          lockedGroupName={groupName || `Group #${groupId}`}
          platformFacilityGroupId={typeof form.facility_group_id === "number" ? form.facility_group_id : undefined}
        />
      )}

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

      <AlertDialog open={!!draftPrompt} onOpenChange={(v) => { if (!v) discardDraft() }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialog.restoreDraft.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("dialog.restoreDraft.descResortFacilityGroup")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={discardDraft}>{t("dialog.restoreDraft.discard")}</AlertDialogCancel>
            <AlertDialogAction onClick={restoreDraft}>{t("dialog.restoreDraft.restore")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { emptyForm as emptyResortFacilityGroupForm }
