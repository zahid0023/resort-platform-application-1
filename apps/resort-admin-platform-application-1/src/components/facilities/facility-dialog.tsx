import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { ArrowRight, Check, Layers, Loader2, Pencil, Plus, RefreshCw, Save, Sparkles, X } from "lucide-react"
import { Sheet, SheetContent } from "@resort/shadcn-ui"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@resort/shadcn-ui"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@resort/shadcn-ui"
import { Badge } from "@resort/shadcn-ui"
import { Button } from "@resort/shadcn-ui"
import { Card, CardContent } from "@resort/shadcn-ui"
import { DialogEntityHeader } from "@/components/shared/dialog-entity-header"
import { DialogCreateFooter } from "@/components/shared/dialog-create-footer"
import {
  createFacility,
  updateFacility,
  getFacility,
  listFacilityLocales,
  countFacilityLocales,
  assignFacilityScope,
  unassignFacilityScope,
  assignFacilityGroup,
  unassignFacilityGroup,
} from "@/services/facilities"
import { listFacilityGroups, type FacilityGroupSummary } from "@/services/facility-groups"
import { toIconValue as groupToIconValue } from "@/components/facility-groups/types"
import { facilityScopesService, type FacilityScope } from "@/services/facility-scopes"
import { FacilityScopePickerDialog } from "@/components/facility-scopes/facility-scope-picker-dialog"
import { FacilityGroupPickerDialog } from "./facility-group-picker-dialog"
import type { Locale } from "@/services/locales"
import { useLocales } from "@/providers/locales-provider"
import { toast } from "sonner"
import type { FacilityDialogMode, FacilityFormState } from "./types"
import { fromIconValue, toIconValue } from "./types"
import { IconPicker, IconRenderer, EMPTY_ICON_VALUE } from "@/components/shared/icon-picker"
import type { IconValue } from "@/components/shared/icon-picker"
import { FacilityGeneralInfo } from "./facility-general-info"
import { FacilityLocaleTranslations } from "./facility-locale-translations"

export const emptyFacilityForm: FacilityFormState = {
  facility_groups: [],
  facility_scopes: [],
  code: "",
  sort_order: 0,
  icon: EMPTY_ICON_VALUE,
  locale: { name: "", description: "", sort_order: 0 },
  locales: [],
}

// Create only ever submits the "en" translation — keep it English/ASCII.
const ENGLISH_TEXT_PATTERN = /^[\x00-\x7F]*$/

// Local autosave for the create form — never sent to the backend, just a browser-local checkpoint.
const DRAFT_STORAGE_KEY = "facility-dialog-draft"
const DRAFT_SAVE_DEBOUNCE_MS = 500

function hasDraftContent(f: FacilityFormState): boolean {
  return f.code.trim() !== "" || f.facility_groups.length > 0 || f.facility_scopes.length > 0
    || f.icon.type !== "" || f.locale.name.trim() !== "" || f.locale.description.trim() !== ""
}

function readDraft(): FacilityFormState | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FacilityFormState
    return hasDraftContent(parsed) ? parsed : null
  } catch {
    return null
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_STORAGE_KEY)
}

export interface FacilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: FacilityDialogMode
  facilityId?: number
  form: FacilityFormState
  onFormChange: (form: FacilityFormState) => void
  availableLocales: Locale[]
  /** When set (e.g. "+ New Facility" from within a group's detail page), the facility group is
   * pre-fixed to this group and the picker is hidden. */
  fixedFacilityGroup?: FacilityGroupSummary
  onSaved?: () => void | Promise<void>
}

export function FacilityDialog({
  open,
  onOpenChange,
  mode,
  facilityId,
  form,
  onFormChange,
  availableLocales,
  fixedFacilityGroup,
  onSaved,
}: FacilityDialogProps) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [generalEditing, setGeneralEditing] = useState(false)
  const [iconEditing, setIconEditing] = useState(false)
  const [iconSubmitting, setIconSubmitting] = useState(false)
  const [localIcon, setLocalIcon] = useState<IconValue>(EMPTY_ICON_VALUE)
  const [translationsEditing, setTranslationsEditing] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [activeTab, setActiveTab] = useState<"general" | "icon" | "locales" | "scopes" | "groups">("general")
  const [scopePickerOpen, setScopePickerOpen] = useState(false)
  const [groupPickerOpen, setGroupPickerOpen] = useState(false)
  const [scopesLoaded, setScopesLoaded] = useState(false)
  // Platform-wide total of active facility scopes, from `GET /facility-scopes/count` — compared
  // against `form.facility_scopes.length` (edit/view mode only) to know whether every scope is
  // already assigned, in which case the "Assign to Facility Scope" tile is disabled since the picker
  // would have nothing to offer. `null` until the first fetch resolves.
  const [totalScopeCount, setTotalScopeCount] = useState<number | null>(null)
  // Edit/view mode only — ids of facility scopes currently mid-assign or mid-unassign, so the
  // affected card can show a spinner and the rest of the tab stays interactive.
  const [busyScopeIds, setBusyScopeIds] = useState<Set<number>>(new Set())
  const [pendingUnassignScope, setPendingUnassignScope] = useState<FacilityScope | null>(null)
  const [groupsLoaded, setGroupsLoaded] = useState(false)
  // Platform-wide total of active facility groups, from a size-1 `GET /facility-groups` list call (no
  // dedicated count endpoint exists for facility groups) — compared against `form.facility_groups.length`
  // (edit/view mode only) to know whether every group is already assigned, in which case the "Assign to
  // Facility Group" tile is disabled since the picker would have nothing to offer. `null` until the
  // first fetch resolves.
  const [totalGroupCount, setTotalGroupCount] = useState<number | null>(null)
  // Edit/view mode only — ids of facility groups currently mid-assign or mid-unassign, so the
  // affected card can show a spinner and the rest of the tab stays interactive.
  const [busyGroupIds, setBusyGroupIds] = useState<Set<number>>(new Set())
  const [pendingUnassignGroup, setPendingUnassignGroup] = useState<FacilityGroupSummary | null>(null)
  const [localesLoaded, setLocalesLoaded] = useState(false)
  const [localeSearch, setLocaleSearch] = useState("")
  const lastLocaleSearchKey = useRef("")
  // Authoritative set of locale codes this facility already has a translation for, from
  // `GET /facilities/{id}/locales/count` — not derived from `form.locales`, which only ever holds
  // one page (size 10) of the paginated sub-resource and can undercount past that.
  const [facilityLocaleCodes, setFacilityLocaleCodes] = useState<string[] | null>(null)
  // `availableLocales` isn't eagerly fetched anywhere (see the parent page) — `refreshLocalesCatalog`
  // is the fallback in prepareAddLocale below, fired the first time the +Add picker actually needs
  // the full catalog and finds it still empty.
  const { totalCount: totalLocaleCount, refresh: refreshLocalesCatalog } = useLocales()
  const [draftPrompt, setDraftPrompt] = useState<FacilityFormState | null>(null)
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null)
  const [draftSyncing, setDraftSyncing] = useState(false)

  useEffect(() => {
    if (!open) {
      setGeneralEditing(false)
      setIconEditing(false)
      setIconSubmitting(false)
      setTranslationsEditing(false)
      setConfirmClose(false)
      setActiveTab("general")
      setScopePickerOpen(false)
      setGroupPickerOpen(false)
      setScopesLoaded(false)
      setTotalScopeCount(null)
      setBusyScopeIds(new Set())
      setPendingUnassignScope(null)
      setGroupsLoaded(false)
      setTotalGroupCount(null)
      setBusyGroupIds(new Set())
      setPendingUnassignGroup(null)
      setLocalesLoaded(false)
      setLocaleSearch("")
      lastLocaleSearchKey.current = ""
      setFacilityLocaleCodes(null)
      setDraftPrompt(null)
      setDraftSavedAt(null)
      setDraftSyncing(false)
    }
  }, [open])

  // On opening a fresh create form, offer to resume a locally-saved draft.
  useEffect(() => {
    if (open && mode === "create") {
      setDraftPrompt(readDraft())
    }
  }, [open, mode])

  // Create mode always needs at least one group — pre-fill from the fixed one as soon as the dialog
  // opens, so the picker never has to be touched when creating from within a group's own detail page.
  useEffect(() => {
    if (open && mode === "create" && fixedFacilityGroup && form.facility_groups.length === 0) {
      onFormChange({ ...form, facility_groups: [fixedFacilityGroup] })
    }
  }, [open, mode, fixedFacilityGroup]) // eslint-disable-line react-hooks/exhaustive-deps

  // View/edit mode can always manage groups (no lock concept there); create mode only when not
  // pre-fixed to a single group.
  const canManageGroups = mode !== "create" || !fixedFacilityGroup

  function addGroup(group: FacilityGroupSummary) {
    if (form.facility_groups.some((g) => g.id === group.id)) return
    onFormChange({ ...form, facility_groups: [...form.facility_groups, group] })
  }

  function removeGroup(groupId: number) {
    onFormChange({ ...form, facility_groups: form.facility_groups.filter((g) => g.id !== groupId) })
  }

  // Platform-wide active-group total, from a size-1 `GET /facility-groups` list call (no dedicated
  // count endpoint exists for facility groups) — compared against `form.facility_groups.length` to
  // know whether the "Assign to Facility Group" tile should be disabled because every group is already
  // assigned. `form.facility_groups` itself needs no fetch here — it's already as fresh as the card
  // click that opened this dialog (GET /facilities/{id} embeds it).
  async function fetchGroupCount(): Promise<void> {
    const res = await listFacilityGroups({ page: 0, size: 1 })
    setTotalGroupCount(res.total_elements)
  }

  // Same lazy-once-per-tab-selection pattern as the scopes tab.
  useEffect(() => {
    if (!open || mode === "create" || activeTab !== "groups" || groupsLoaded) return
    setGroupsLoaded(true)
    fetchGroupCount().catch((err) => toast.error((err as Error).message))
  }, [open, mode, activeTab, groupsLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  function setGroupBusy(groupId: number, busy: boolean) {
    setBusyGroupIds((prev) => {
      const next = new Set(prev)
      if (busy) next.add(groupId)
      else next.delete(groupId)
      return next
    })
  }

  // Edit/view mode only — `POST /facilities/{id}/group-assignments`. Assignment is immediate (no Save
  // step for this tab), so the card updates optimistically only after the call succeeds. The server
  // also enforces that the group is scoped to every facility scope this facility currently has
  // (409 CONFLICT otherwise) — surfaced via the caught error message.
  async function handleAssignGroup(group: FacilityGroupSummary): Promise<void> {
    if (facilityId == null) return
    if (form.facility_groups.some((g) => g.id === group.id)) return
    setGroupBusy(group.id, true)
    try {
      await assignFacilityGroup(facilityId, group.id)
      onFormChange({ ...form, facility_groups: [...form.facility_groups, group] })
      toast.success(t("facility.groupAssigned"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("facility.groupAssignFailed"))
    } finally {
      setGroupBusy(group.id, false)
    }
  }

  // Edit/view mode only — `DELETE /facilities/{id}/group-assignments/{facility-group-id}`, identified
  // by the group's own id (a facility can only ever have one active assignment to a given group).
  async function confirmUnassignGroup(): Promise<void> {
    if (!pendingUnassignGroup || facilityId == null) return
    const group = pendingUnassignGroup
    setPendingUnassignGroup(null)
    setGroupBusy(group.id, true)
    try {
      await unassignFacilityGroup(facilityId, group.id)
      onFormChange({ ...form, facility_groups: form.facility_groups.filter((g) => g.id !== group.id) })
      toast.success(t("facility.groupUnassigned"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("facility.groupUnassignFailed"))
    } finally {
      setGroupBusy(group.id, false)
    }
  }

  // Debounced local autosave of the create form — skipped while the restore prompt is pending,
  // otherwise the still-empty parent form would immediately overwrite the draft we're offering.
  useEffect(() => {
    if (!open || mode !== "create" || draftPrompt) return
    if (hasDraftContent(form)) setDraftSyncing(true)
    const timer = setTimeout(() => {
      if (hasDraftContent(form)) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form))
        setDraftSavedAt(new Date())
      } else {
        clearDraft()
        setDraftSavedAt(null)
      }
      setDraftSyncing(false)
    }, DRAFT_SAVE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [form, open, mode, draftPrompt])

  function restoreDraft() {
    if (draftPrompt) {
      onFormChange(draftPrompt)
      setDraftSavedAt(new Date())
    }
    setDraftPrompt(null)
  }

  function discardDraft() {
    clearDraft()
    setDraftSavedAt(null)
    setDraftSyncing(false)
    setDraftPrompt(null)
  }

  const draftIndicator = mode === "create" && (draftSyncing || draftSavedAt) ? (
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

  // Edit/view only — in-progress section edits still warn before discarding, since those aren't
  // autosaved. Create is covered by the local draft (see draftIndicator above).
  const isDirty = generalEditing || iconEditing || translationsEditing

  // Every active facility scope is already assigned to this facility — the picker would have nothing
  // left to offer, so the "Assign to Facility Scope" tile is disabled rather than opening onto an
  // empty list. Create mode only ever adds from the shared picker's own catalog, so this doesn't apply.
  const allScopesAssigned = totalScopeCount !== null && form.facility_scopes.length >= totalScopeCount

  // Same idea for facility groups — disables the "Assign to Facility Group" tile once every group is
  // already assigned to this facility.
  const allGroupsAssigned = totalGroupCount !== null && form.facility_groups.length >= totalGroupCount

  function requestClose() {
    if (mode === "create") { onOpenChange(false); return }
    if (isDirty) setConfirmClose(true)
    else onOpenChange(false)
  }

  // Silent checks — drive the "icon"/"locales"/"scopes"/"groups" tabs' disabled state without firing
  // toasts on every render.
  function isGeneralValid(): boolean {
    return form.code.trim() !== ""
  }
  function isIconValid(): boolean {
    return form.icon.type !== "" && !!form.icon.value
  }

  // Same check, but reports what's wrong — used by both the Next button and submit.
  function validateGeneral(): boolean {
    if (!form.code.trim()) { toast.error(t("toast.codeRequired")); return false }
    return true
  }
  function validateIcon(): boolean {
    if (!form.icon.type) { toast.error(t("facilityDialog.errIconType")); return false }
    if (!form.icon.value) { toast.error(t("facilityDialog.errIconValue")); return false }
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

  // Silent check — drives the "scopes" tab's disabled state without firing toasts on every render.
  function isLocaleValid(): boolean {
    return form.locale.name.trim() !== "" && form.locale.description.trim() !== ""
      && ENGLISH_TEXT_PATTERN.test(form.locale.name) && ENGLISH_TEXT_PATTERN.test(form.locale.description)
  }

  // Same check, but reports what's wrong — used by both the Next button and submit.
  function validateLocale(): boolean {
    if (!form.locale.name.trim()) { toast.error(t("toast.localeNameRequired", { n: 1 })); return false }
    if (!ENGLISH_TEXT_PATTERN.test(form.locale.name)) { toast.error(t("toast.localeNameEnglishOnly")); return false }
    if (!form.locale.description.trim()) { toast.error(t("toast.localeDescriptionRequired", { n: 1 })); return false }
    if (!ENGLISH_TEXT_PATTERN.test(form.locale.description)) { toast.error(t("toast.localeDescriptionEnglishOnly")); return false }
    return true
  }

  function handleNextFromLocales() {
    if (!validateLocale()) return
    setActiveTab("scopes")
  }

  // Silent check — drives the "groups" tab's disabled state without firing toasts on every render.
  function isScopesValid(): boolean {
    return form.facility_scopes.length > 0
  }

  function validateScopes(): boolean {
    if (form.facility_scopes.length === 0) { toast.error(t("facility.scopeRequired")); return false }
    return true
  }

  function handleNextFromScopes() {
    if (!validateScopes()) return
    setActiveTab("groups")
  }

  // Silent check — drives the Create button's disabled state without firing toasts on every render.
  function isGroupsValid(): boolean {
    return form.facility_groups.length > 0
  }

  function validateGroups(): boolean {
    if (form.facility_groups.length === 0) { toast.error(t("facility.groupRequired")); return false }
    return true
  }

  function addScope(scope: FacilityScope) {
    if (form.facility_scopes.some((s) => s.id === scope.id)) return
    onFormChange({ ...form, facility_scopes: [...form.facility_scopes, scope] })
  }

  function removeScope(scopeId: number) {
    onFormChange({ ...form, facility_scopes: form.facility_scopes.filter((s) => s.id !== scopeId) })
  }

  // Platform-wide active-scope total, from `GET /facility-scopes/count` — compared against
  // `form.facility_scopes.length` to know whether the "Assign to Facility Scope" tile should be
  // disabled because every scope is already assigned. `form.facility_scopes` itself needs no fetch
  // here — it's already as fresh as the card click that opened this dialog (GET /facilities/{id}
  // embeds it).
  async function fetchScopeCount(): Promise<void> {
    const res = await facilityScopesService.count()
    setTotalScopeCount(res.count)
  }

  // Same lazy-once-per-tab-selection pattern as the locales tab.
  useEffect(() => {
    if (!open || mode === "create" || activeTab !== "scopes" || scopesLoaded) return
    setScopesLoaded(true)
    fetchScopeCount().catch((err) => toast.error((err as Error).message))
  }, [open, mode, activeTab, scopesLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  function setScopeBusy(scopeId: number, busy: boolean) {
    setBusyScopeIds((prev) => {
      const next = new Set(prev)
      if (busy) next.add(scopeId)
      else next.delete(scopeId)
      return next
    })
  }

  // Edit/view mode only — `POST /facilities/{id}/scope-assignments`. Assignment is immediate (no Save
  // step for this tab), so the card updates optimistically only after the call succeeds.
  async function handleAssignScope(scope: FacilityScope): Promise<void> {
    if (facilityId == null) return
    if (form.facility_scopes.some((s) => s.id === scope.id)) return
    setScopeBusy(scope.id, true)
    try {
      await assignFacilityScope(facilityId, scope.id)
      onFormChange({ ...form, facility_scopes: [...form.facility_scopes, scope] })
      toast.success(t("facility.scopeAssigned"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("facility.scopeAssignFailed"))
    } finally {
      setScopeBusy(scope.id, false)
    }
  }

  // Edit/view mode only — `DELETE /facilities/{id}/scope-assignments/{facility-scope-id}`, identified
  // by the scope's own id (a facility can only ever have one active assignment to a given scope).
  async function confirmUnassignScope(): Promise<void> {
    if (!pendingUnassignScope || facilityId == null) return
    const scope = pendingUnassignScope
    setPendingUnassignScope(null)
    setScopeBusy(scope.id, true)
    try {
      await unassignFacilityScope(facilityId, scope.id)
      onFormChange({ ...form, facility_scopes: form.facility_scopes.filter((s) => s.id !== scope.id) })
      toast.success(t("facility.scopeUnassigned"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("facility.scopeUnassignFailed"))
    } finally {
      setScopeBusy(scope.id, false)
    }
  }

  function startIconEdit() {
    setLocalIcon(form.icon)
    setIconEditing(true)
  }

  async function saveIcon() {
    if (facilityId == null) return
    if (!localIcon.type) { toast.error(t("iconFields.errNoType")); return }
    if (!localIcon.value) { toast.error(t("iconFields.errNoValue")); return }
    setIconSubmitting(true)
    try {
      await updateFacility(facilityId, {
        sort_order: form.sort_order,
        ...fromIconValue(localIcon),
      })
      toast.success(t("facility.updated"))
      setIconEditing(false)
      onFormChange({ ...form, icon: localIcon })
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIconSubmitting(false)
    }
  }

  // Shared by the lazy first-load and the search box. The sub-resource is paginated and this
  // dialog only ever holds one page of it, so search re-hits the server with localeCode rather
  // than filtering whatever page happens to already be loaded.
  async function fetchLocales(localeCode?: string): Promise<void> {
    if (facilityId == null) return
    const res = await listFacilityLocales(facilityId, { size: 10, localeCode: localeCode || undefined })
    onFormChange({
      ...form,
      locales: res.data.map((l) => ({
        id: l.id,
        locale: l.locale,
        name: l.name,
        description: l.description ?? "",
        sort_order: l.sort_order,
      })),
    })
  }

  // Companion to fetchLocales — hits the facility's own /locales/count sub-resource for the
  // authoritative, unpaginated set of locale codes it already has a translation for.
  async function fetchLocaleCodes(): Promise<void> {
    if (facilityId == null) return
    const res = await countFacilityLocales(facilityId)
    setFacilityLocaleCodes(res.codes)
  }

  // Translations are only fetched once the tab is actually selected — not when the dialog opens —
  // and only the first time per dialog session; re-selecting the tab afterward reuses what's
  // already loaded.
  useEffect(() => {
    if (!open || mode === "create" || activeTab !== "locales" || localesLoaded) return
    setLocalesLoaded(true)
    Promise.all([fetchLocales(), fetchLocaleCodes()]).catch((err) => toast.error((err as Error).message))
  }, [open, mode, activeTab, localesLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced server-side search, view mode only — edit mode always needs the complete,
  // unfiltered list (see FacilityLocaleTranslations' duplicate-locale checks).
  useEffect(() => {
    if (!open || mode === "create" || translationsEditing) return
    if (lastLocaleSearchKey.current === localeSearch) return
    lastLocaleSearchKey.current = localeSearch
    const timer = setTimeout(() => {
      fetchLocales(localeSearch.trim()).catch((err) => toast.error((err as Error).message))
    }, 350)
    return () => clearTimeout(timer)
  }, [localeSearch, open, mode, translationsEditing]) // eslint-disable-line react-hooks/exhaustive-deps

  // Adding a translation always needs the complete list — clear any active search and re-pull
  // everything first, so duplicate-locale checks never operate on a filtered subset.
  function prepareAddLocale(): Promise<Locale[]> {
    setLocaleSearch("")
    lastLocaleSearchKey.current = ""
    fetchLocales().catch((err) => toast.error((err as Error).message))
    fetchLocaleCodes().catch((err) => toast.error((err as Error).message))
    if (availableLocales.length === 0) {
      return refreshLocalesCatalog().catch((err) => {
        toast.error((err as Error).message)
        return availableLocales
      })
    }
    return Promise.resolve(availableLocales)
  }

  // Manual refresh only — switching tabs never re-fetches on its own otherwise (see the lazy-load
  // effects above). Pulls whichever the active tab needs.
  async function handleRefresh(): Promise<void> {
    if (facilityId == null) return
    setRefreshing(true)
    try {
      if (activeTab === "general") {
        const res = await getFacility(facilityId)
        onFormChange({ ...form, sort_order: res.data.sort_order })
      }
      if (activeTab === "icon") {
        const res = await getFacility(facilityId)
        onFormChange({ ...form, icon: toIconValue(res.data) })
      }
      if (activeTab === "locales") {
        await Promise.all([fetchLocales(localeSearch.trim()), fetchLocaleCodes()])
      }
      if (activeTab === "scopes") {
        const [res] = await Promise.all([getFacility(facilityId), fetchScopeCount()])
        onFormChange({ ...form, facility_scopes: res.data.facility_scopes ?? [] })
        setScopesLoaded(true)
      }
      if (activeTab === "groups") {
        const [res] = await Promise.all([getFacility(facilityId), fetchGroupCount()])
        onFormChange({ ...form, facility_groups: res.data.facility_groups })
        setGroupsLoaded(true)
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
    if (!validateScopes()) { setActiveTab("scopes"); return }
    if (!validateGroups()) { setActiveTab("groups"); return }
    setSubmitting(true)
    try {
      await createFacility({
        code: form.code.trim().toUpperCase(),
        facility_group_ids: form.facility_groups.map((g) => g.id),
        facility_scope_ids: form.facility_scopes.map((s) => s.id),
        sort_order: Number(form.sort_order) || 0,
        ...fromIconValue(form.icon),
        locale: {
          name: form.locale.name.trim(),
          description: form.locale.description.trim(),
          sort_order: Number(form.locale.sort_order) || 0,
        },
      })
      clearDraft()
      toast.success(t("facility.created"))
      onOpenChange(false)
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const isEditing = generalEditing || iconEditing || translationsEditing
  const headerTitle = mode === "create"
    ? t("facilityDialog.create")
    : (isEditing ? t("facilityDialog.edit") : t("facilityDialog.view"))
  const headerDesc = mode === "create"
    ? t("facilityDialog.descCreate")
    : (isEditing ? t("facilityDialog.descEdit") : t("facilityDialog.descView"))

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

            <DialogEntityHeader icon={<Sparkles className="h-4 w-4" />} title={headerTitle} description={headerDesc} />

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "general" | "icon" | "locales" | "scopes" | "groups")}
              className="flex-1 min-h-0 flex-col"
            >
              <div className="flex items-center justify-between mx-6 mt-4 gap-2">
                <TabsList className="w-fit shrink-0">
                  <TabsTrigger value="general">{t("common.generalInfo")}</TabsTrigger>
                  <TabsTrigger value="icon" disabled={mode === "create" && !isGeneralValid()}>
                    {t("common.icon")}
                  </TabsTrigger>
                  <TabsTrigger value="locales" disabled={mode === "create" && !(isGeneralValid() && isIconValid())}>
                    {t("locale.translations")}
                  </TabsTrigger>
                  <TabsTrigger value="scopes" disabled={mode === "create" && !(isGeneralValid() && isIconValid() && isLocaleValid())}>
                    {t("field.facilityScopes")}
                  </TabsTrigger>
                  <TabsTrigger value="groups" disabled={mode === "create" && !(isGeneralValid() && isIconValid() && isLocaleValid() && isScopesValid())}>
                    {t("field.facilityGroups")}
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
                <FacilityGeneralInfo
                  mode={mode}
                  form={form}
                  onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                  facilityId={facilityId}
                  onSaved={onSaved}
                  editing={generalEditing}
                  onEditingChange={setGeneralEditing}
                  open={open}
                />
              </TabsContent>

              <TabsContent value="icon" className="min-h-0 overflow-y-auto px-6 py-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                        {t("common.icon")}
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
                  <IconPicker
                    value={iconEditing ? localIcon : form.icon}
                    onChange={(icon: IconValue) => {
                      if (mode === "create") onFormChange({ ...form, icon })
                      else setLocalIcon(icon)
                    }}
                    readOnly={!iconEditing && mode !== "create"}
                  />
                </div>
              </TabsContent>

              <TabsContent value="locales" className="min-h-0 overflow-y-auto px-6 py-5">
                <FacilityLocaleTranslations
                  mode={mode}
                  form={form}
                  onFormChange={onFormChange}
                  facilityId={facilityId}
                  onSaved={onSaved}
                  editing={translationsEditing}
                  onEditingChange={setTranslationsEditing}
                  onPrepareAdd={prepareAddLocale}
                  search={localeSearch}
                  onSearchChange={setLocaleSearch}
                  open={open}
                  availableLocales={availableLocales}
                  totalLocaleCount={totalLocaleCount}
                  facilityLocaleCodes={facilityLocaleCodes}
                />
              </TabsContent>

              <TabsContent value="scopes" className="min-h-0 overflow-y-auto px-6 py-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                      {t("field.facilityScopes")}
                    </h3>
                  </div>

                  {form.facility_scopes.length === 0 && (
                    <p className="text-sm text-muted-foreground">{t("facility.scopeEmpty")}</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {form.facility_scopes.map((s) => {
                      const busy = busyScopeIds.has(s.id)
                      return (
                        <Card key={s.id}>
                          <CardContent className="flex items-center gap-3 py-3">
                            <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-primary/20 text-primary">
                              <Layers className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm truncate">{s.locale?.name ?? s.code}</p>
                              <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-4 mt-1">
                                {s.code}
                              </Badge>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 shrink-0"
                              disabled={busy}
                              onClick={() => (mode === "create" ? removeScope(s.id) : setPendingUnassignScope(s))}
                            >
                              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    })}
                    <Card
                      role="button"
                      aria-disabled={mode !== "create" && allScopesAssigned}
                      tabIndex={mode !== "create" && allScopesAssigned ? -1 : 0}
                      onClick={() => { if (mode === "create" || !allScopesAssigned) setScopePickerOpen(true) }}
                      onKeyDown={(e) => {
                        if (mode !== "create" && allScopesAssigned) return
                        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setScopePickerOpen(true) }
                      }}
                      className={
                        mode !== "create" && allScopesAssigned
                          ? "cursor-not-allowed border-2 border-dashed border-muted-foreground/20 bg-muted/20 shadow-none ring-0 opacity-60"
                          : "group/assign cursor-pointer border-2 border-dashed border-primary/25 bg-primary/3 shadow-none ring-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      }
                    >
                      <CardContent className="flex items-center gap-3 py-3">
                        <div
                          className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 ${
                            mode !== "create" && allScopesAssigned
                              ? "bg-muted text-muted-foreground"
                              : "bg-primary/10 text-primary group-hover/assign:scale-110 group-hover/assign:rotate-90"
                          }`}
                        >
                          <Plus className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`font-semibold text-sm truncate ${mode !== "create" && allScopesAssigned ? "text-muted-foreground" : "text-primary"}`}>
                            {t("facility.assignScope")}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {mode !== "create" && allScopesAssigned ? t("facility.assignScopeAllAssigned") : t("facility.assignScopeHint")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="groups" className="min-h-0 overflow-y-auto px-6 py-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                      {t("field.facilityGroups")}
                    </h3>
                  </div>

                  {form.facility_groups.length === 0 && (
                    <p className="text-sm text-muted-foreground">{t("placeholder.selectFacilityGroup")}</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {form.facility_groups.map((g) => {
                      const icon = groupToIconValue(g)
                      const accentColor = icon.meta?.color || undefined
                      const busy = busyGroupIds.has(g.id)
                      return (
                        <Card key={g.id}>
                          <CardContent className="flex items-center gap-3 py-3">
                            <div
                              className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                background: accentColor
                                  ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`
                                  : undefined,
                                boxShadow: accentColor ? `0 4px 14px -4px ${accentColor}80` : undefined,
                              }}
                            >
                              <IconRenderer
                                icon={icon}
                                className="h-4 w-4"
                                style={{ color: accentColor ? "white" : undefined }}
                                fallback={<Layers className="h-4 w-4" />}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm truncate">{g.locale?.name ?? g.code}</p>
                              <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-4 mt-1">
                                {g.code}
                              </Badge>
                            </div>
                            {canManageGroups && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 shrink-0"
                                disabled={busy}
                                onClick={() => (mode === "create" ? removeGroup(g.id) : setPendingUnassignGroup(g))}
                              >
                                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                    <Card
                      role="button"
                      aria-disabled={!canManageGroups || (mode !== "create" && allGroupsAssigned)}
                      tabIndex={!canManageGroups || (mode !== "create" && allGroupsAssigned) ? -1 : 0}
                      onClick={() => {
                        if (canManageGroups && (mode === "create" || !allGroupsAssigned)) setGroupPickerOpen(true)
                      }}
                      onKeyDown={(e) => {
                        if (!canManageGroups || (mode !== "create" && allGroupsAssigned)) return
                        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setGroupPickerOpen(true) }
                      }}
                      className={
                        !canManageGroups || (mode !== "create" && allGroupsAssigned)
                          ? "cursor-not-allowed border-2 border-dashed border-muted-foreground/20 bg-muted/20 shadow-none ring-0 opacity-60"
                          : "group/assign cursor-pointer border-2 border-dashed border-primary/25 bg-primary/3 shadow-none ring-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      }
                    >
                      <CardContent className="flex items-center gap-3 py-3">
                        <div
                          className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 ${
                            !canManageGroups || (mode !== "create" && allGroupsAssigned)
                              ? "bg-muted text-muted-foreground"
                              : "bg-primary/10 text-primary group-hover/assign:scale-110 group-hover/assign:rotate-90"
                          }`}
                        >
                          <Plus className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`font-semibold text-sm truncate ${!canManageGroups || (mode !== "create" && allGroupsAssigned) ? "text-muted-foreground" : "text-primary"}`}>
                            {t("facility.assignGroup")}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {mode !== "create" && allGroupsAssigned ? t("facility.assignGroupAllAssigned") : t("facility.assignGroupHint")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
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
              <div className={`shrink-0 px-6 py-4 border-t bg-muted/40 flex items-center gap-2 ${draftIndicator ? "justify-between" : "justify-end"}`}>
                {draftIndicator}
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={requestClose} className="gap-1.5">
                    <X className="h-3.5 w-3.5" /> {t("common.cancel")}
                  </Button>
                  <Button type="button" size="sm" onClick={handleNextFromLocales} disabled={!isLocaleValid()} className="gap-1.5">
                    {t("common.next")} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {mode === "create" && activeTab === "scopes" && (
              <div className={`shrink-0 px-6 py-4 border-t bg-muted/40 flex items-center gap-2 ${draftIndicator ? "justify-between" : "justify-end"}`}>
                {draftIndicator}
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={requestClose} className="gap-1.5">
                    <X className="h-3.5 w-3.5" /> {t("common.cancel")}
                  </Button>
                  <Button type="button" size="sm" onClick={handleNextFromScopes} disabled={!isScopesValid()} className="gap-1.5">
                    {t("common.next")} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {mode === "create" && activeTab === "groups" && (
              <DialogCreateFooter submitting={submitting} onCancel={requestClose} disabled={!isGroupsValid()} indicator={draftIndicator} />
            )}

          </form>
        </SheetContent>
      </Sheet>

      <FacilityScopePickerDialog
        open={scopePickerOpen}
        onOpenChange={setScopePickerOpen}
        excludeIds={form.facility_scopes.map((s) => s.id)}
        onSelect={mode === "create" ? addScope : handleAssignScope}
      />

      <FacilityGroupPickerDialog
        open={groupPickerOpen}
        onOpenChange={setGroupPickerOpen}
        excludeIds={form.facility_groups.map((g) => g.id)}
        onSelect={mode === "create" ? addGroup : handleAssignGroup}
      />

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
            <AlertDialogDescription>{t("dialog.restoreDraft.descFacility")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={discardDraft}>{t("dialog.restoreDraft.discard")}</AlertDialogCancel>
            <AlertDialogAction onClick={restoreDraft}>{t("dialog.restoreDraft.restore")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pendingUnassignScope} onOpenChange={(v) => { if (!v) setPendingUnassignScope(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("facility.scopeUnassignTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("facility.scopeUnassignDesc", { code: pendingUnassignScope?.code })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnassignScope}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pendingUnassignGroup} onOpenChange={(v) => { if (!v) setPendingUnassignGroup(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("facility.groupUnassignTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("facility.groupUnassignDesc", { code: pendingUnassignGroup?.code })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnassignGroup}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
