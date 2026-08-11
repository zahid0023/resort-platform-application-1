import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { ArrowRight, Check, Layers, Loader2, Pencil, Plus, RefreshCw, X } from "lucide-react"
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
  createFacilityGroup,
  updateFacilityGroup,
  getFacilityGroup,
  listFacilityGroupLocales,
  countFacilityGroupLocales,
  assignFacilityGroupScope,
  unassignFacilityGroupScope,
} from "@/services/facility-groups"
import type { Locale } from "@/services/locales"
import { facilityScopesService, type FacilityScope } from "@/services/facility-scopes"
import { FacilityScopePickerDialog } from "@/components/facility-scopes/facility-scope-picker-dialog"
import { useLocales } from "@/providers/locales-provider"
import { toast } from "sonner"
import type { FacilityGroupDialogMode, FacilityGroupFormState } from "./types"
import { fromIconValue, toIconValue } from "./types"
import { IconPicker, EMPTY_ICON_VALUE } from "@/components/shared/icon-picker"
import type { IconValue } from "@/components/shared/icon-picker"
import { FacilityGroupGeneralInfo } from "./facility-group-general-info"
import { FacilityGroupLocaleTranslations } from "./facility-group-locale-translations"

export const emptyFacilityGroupForm: FacilityGroupFormState = {
  code: "",
  sort_order: 0,
  icon: EMPTY_ICON_VALUE,
  locale: { name: "", description: "", sort_order: 0 },
  locales: [],
  scopes: [],
  facility_scopes: [],
}

// Create only ever submits the "en" translation — keep it English/ASCII.
const ENGLISH_TEXT_PATTERN = /^[\x00-\x7F]*$/

export interface FacilityGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: FacilityGroupDialogMode
  facilityGroupId?: number
  form: FacilityGroupFormState
  onFormChange: (form: FacilityGroupFormState) => void
  availableLocales: Locale[]
  onSaved?: () => void | Promise<void>
}

export function FacilityGroupDialog({
  open,
  onOpenChange,
  mode,
  facilityGroupId,
  form,
  onFormChange,
  availableLocales,
  onSaved,
}: FacilityGroupDialogProps) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [generalEditing, setGeneralEditing] = useState(false)
  const [iconEditing, setIconEditing] = useState(false)
  const [iconSubmitting, setIconSubmitting] = useState(false)
  const [localIcon, setLocalIcon] = useState<IconValue>(EMPTY_ICON_VALUE)
  const [translationsEditing, setTranslationsEditing] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [activeTab, setActiveTab] = useState<"general" | "icon" | "locales" | "scopes">("general")
  const [scopePickerOpen, setScopePickerOpen] = useState(false)
  const [localesLoaded, setLocalesLoaded] = useState(false)
  const [localeSearch, setLocaleSearch] = useState("")
  const lastLocaleSearchKey = useRef("")
  const [scopesLoaded, setScopesLoaded] = useState(false)
  // Platform-wide total of active facility scopes (from a size-1 `GET /facility-scopes` list call) —
  // compared against `form.facility_scopes.length` (edit/view mode only) to know whether every scope
  // is already assigned, in which case the "Assign Facility Scope" tile is disabled since the picker
  // would have nothing to offer. `null` until the first fetch resolves.
  const [totalScopeCount, setTotalScopeCount] = useState<number | null>(null)
  // Edit/view mode only — ids of facility scopes currently mid-assign or mid-unassign, so the
  // affected card can show a spinner and the rest of the tab stays interactive.
  const [busyScopeIds, setBusyScopeIds] = useState<Set<number>>(new Set())
  const [pendingUnassignScope, setPendingUnassignScope] = useState<FacilityScope | null>(null)
  // Authoritative set of locale codes this facility group already has a translation for, from
  // `GET /facility-groups/{id}/locales/count` — not derived from `form.locales`, which only ever
  // holds one page (size 10) of the paginated sub-resource and can undercount past that.
  const [facilityGroupLocaleCodes, setFacilityGroupLocaleCodes] = useState<string[] | null>(null)
  // `availableLocales` isn't eagerly fetched anywhere (see the parent page) — `refreshLocalesCatalog`
  // is the fallback in prepareAddLocale below, fired the first time the +Add picker actually needs
  // the full catalog and finds it still empty.
  const { totalCount: totalLocaleCount, refresh: refreshLocalesCatalog } = useLocales()

  useEffect(() => {
    if (!open) {
      setGeneralEditing(false)
      setIconEditing(false)
      setIconSubmitting(false)
      setTranslationsEditing(false)
      setConfirmClose(false)
      setActiveTab("general")
      setScopePickerOpen(false)
      setLocalesLoaded(false)
      setLocaleSearch("")
      lastLocaleSearchKey.current = ""
      setFacilityGroupLocaleCodes(null)
      setScopesLoaded(false)
      setTotalScopeCount(null)
      setBusyScopeIds(new Set())
      setPendingUnassignScope(null)
    }
  }, [open])

  const isDirty = mode === "create"
    ? form.code.trim() !== ""
      || form.icon.type !== ""
      || form.locale.name.trim() !== ""
      || form.locale.description.trim() !== ""
      || form.scopes.length > 0
    : generalEditing || iconEditing || translationsEditing

  // Every active facility scope is already picked/assigned — the picker would have nothing left to
  // offer, so the "Assign Facility Scope" tile is disabled rather than opening onto an empty list.
  // Create mode compares against the locally-picked `form.scopes`; view/edit compares against the
  // group's actually-assigned `form.facility_scopes`.
  const allScopesAssigned = totalScopeCount !== null
    && (mode === "create" ? form.scopes.length : form.facility_scopes.length) >= totalScopeCount

  function requestClose() {
    if (isDirty) setConfirmClose(true)
    else onOpenChange(false)
  }

  // Silent checks — drive the "icon"/"locales" tabs' disabled state without firing toasts on every render.
  function isCodeValid(): boolean {
    return form.code.trim() !== ""
  }
  function isScopesValid(): boolean {
    return form.scopes.length > 0
  }
  function isIconValid(): boolean {
    return form.icon.type !== "" && !!form.icon.value
  }

  // Same checks, but report which field is missing — used by both the Next buttons and submit.
  function validateCode(): boolean {
    if (!form.code.trim()) { toast.error(t("toast.codeRequired")); return false }
    return true
  }
  function validateScopes(): boolean {
    if (form.scopes.length === 0) { toast.error(t("facilityGroup.scopeRequired")); return false }
    return true
  }
  function validateIcon(): boolean {
    if (!form.icon.type) { toast.error(t("facilityGroupDialog.errIconType")); return false }
    if (!form.icon.value) { toast.error(t("facilityGroupDialog.errIconValue")); return false }
    return true
  }

  function handleNextFromGeneral() {
    if (!validateCode()) return
    setActiveTab("icon")
  }

  function handleNextFromIcon() {
    if (!validateIcon()) return
    setActiveTab("locales")
  }

  function handleNextFromLocales() {
    if (!validateLocale()) return
    setActiveTab("scopes")
  }

  // Silent check — drives the "scopes" tab / Next button's disabled state without firing toasts on every render.
  function isLocaleValid(): boolean {
    return form.locale.name.trim() !== "" && form.locale.description.trim() !== ""
      && ENGLISH_TEXT_PATTERN.test(form.locale.name) && ENGLISH_TEXT_PATTERN.test(form.locale.description)
  }
  // Same check, but reports which field is missing — used by both the Next button and submit.
  function validateLocale(): boolean {
    if (!form.locale.name.trim()) { toast.error(t("toast.localeNameRequired", { n: 1 })); return false }
    if (!ENGLISH_TEXT_PATTERN.test(form.locale.name)) { toast.error(t("toast.localeNameEnglishOnly")); return false }
    if (!form.locale.description.trim()) { toast.error(t("toast.localeDescriptionRequired", { n: 1 })); return false }
    if (!ENGLISH_TEXT_PATTERN.test(form.locale.description)) { toast.error(t("toast.localeDescriptionEnglishOnly")); return false }
    return true
  }

  function addScope(scope: FacilityScope) {
    if (form.scopes.some((s) => s.id === scope.id)) return
    onFormChange({ ...form, scopes: [...form.scopes, scope] })
  }

  function removeScope(scopeId: number) {
    onFormChange({ ...form, scopes: form.scopes.filter((s) => s.id !== scopeId) })
  }

  function startIconEdit() {
    setLocalIcon(form.icon)
    setIconEditing(true)
  }

  async function saveIcon() {
    if (facilityGroupId == null) return
    if (!localIcon.type) { toast.error(t("iconFields.errNoType")); return }
    if (!localIcon.value) { toast.error(t("iconFields.errNoValue")); return }
    setIconSubmitting(true)
    try {
      await updateFacilityGroup(facilityGroupId, {
        sort_order: form.sort_order,
        ...fromIconValue(localIcon),
      })
      toast.success(t("facilityGroup.updated"))
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
    if (facilityGroupId == null) return
    const res = await listFacilityGroupLocales(facilityGroupId, { size: 10, localeCode: localeCode || undefined })
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

  // Companion to fetchLocales — hits the group's own /locales/count sub-resource for the
  // authoritative, unpaginated set of locale codes it already has a translation for.
  async function fetchLocaleCodes(): Promise<void> {
    if (facilityGroupId == null) return
    const res = await countFacilityGroupLocales(facilityGroupId)
    setFacilityGroupLocaleCodes(res.codes)
  }

  // Translations are only fetched once the tab is actually selected — not when the dialog opens —
  // and only the first time per dialog session; re-selecting the tab afterward reuses what's
  // already loaded.
  useEffect(() => {
    if (!open || mode === "create" || activeTab !== "locales" || localesLoaded) return
    setLocalesLoaded(true)
    Promise.all([fetchLocales(), fetchLocaleCodes()]).catch((err) => toast.error((err as Error).message))
  }, [open, mode, activeTab, localesLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // Platform-wide active-scope total, from `GET /facility-scopes/count` — compared against the picked
  // or assigned scope count to know whether the "Assign Facility Scope" tile should be disabled
  // because every scope is already picked/assigned. Needed in create mode too (not just view/edit),
  // since the tile there compares against `form.scopes` rather than a fetched `form.facility_scopes`.
  async function fetchScopeCount(): Promise<void> {
    const res = await facilityScopesService.count()
    setTotalScopeCount(res.count)
  }

  // Same lazy-once-per-tab-selection pattern as the locales tab above.
  useEffect(() => {
    if (!open || activeTab !== "scopes" || scopesLoaded) return
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

  // Edit/view mode only — `POST /facility-groups/{id}/scope-assignments`. Assignment is immediate (no
  // Save step for this tab), so the card updates optimistically only after the call succeeds.
  async function handleAssignScope(scope: FacilityScope): Promise<void> {
    if (facilityGroupId == null) return
    if (form.facility_scopes.some((s) => s.id === scope.id)) return
    setScopeBusy(scope.id, true)
    try {
      await assignFacilityGroupScope(facilityGroupId, scope.id)
      onFormChange({ ...form, facility_scopes: [...form.facility_scopes, scope] })
      toast.success(t("facilityGroup.scopeAssigned"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("facilityGroup.scopeAssignFailed"))
    } finally {
      setScopeBusy(scope.id, false)
    }
  }

  // Edit/view mode only — `DELETE /facility-groups/{id}/scope-assignments/{facility-scope-id}`,
  // identified by the scope's own id (a facility group can only ever have one active assignment to a
  // given scope).
  async function confirmUnassignScope(): Promise<void> {
    if (!pendingUnassignScope || facilityGroupId == null) return
    const scope = pendingUnassignScope
    setPendingUnassignScope(null)
    setScopeBusy(scope.id, true)
    try {
      await unassignFacilityGroupScope(facilityGroupId, scope.id)
      onFormChange({ ...form, facility_scopes: form.facility_scopes.filter((s) => s.id !== scope.id) })
      toast.success(t("facilityGroup.scopeUnassigned"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("facilityGroup.scopeUnassignFailed"))
    } finally {
      setScopeBusy(scope.id, false)
    }
  }

  // Manual refresh only — switching tabs never re-fetches on its own otherwise (see the lazy-load
  // effects above). Pulls whichever the active tab needs.
  async function handleRefresh(): Promise<void> {
    if (facilityGroupId == null) return
    setRefreshing(true)
    try {
      if (activeTab === "general" || activeTab === "icon") {
        const res = await getFacilityGroup(facilityGroupId)
        onFormChange({ ...form, sort_order: res.data.sort_order, icon: toIconValue(res.data) })
      }
      if (activeTab === "locales") {
        await Promise.all([fetchLocales(localeSearch.trim()), fetchLocaleCodes()])
      }
      if (activeTab === "scopes") {
        const [groupRes] = await Promise.all([getFacilityGroup(facilityGroupId), fetchScopeCount()])
        onFormChange({ ...form, facility_scopes: groupRes.data.facility_scopes ?? [] })
        setScopesLoaded(true)
      }
      toast.success(t("common.refreshed"))
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setRefreshing(false)
    }
  }

  // Debounced server-side search, view mode only — edit mode always needs the complete,
  // unfiltered list (see FacilityGroupLocaleTranslations' duplicate-locale checks).
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode !== "create") return
    if (!validateCode()) { setActiveTab("general"); return }
    if (!validateIcon()) { setActiveTab("icon"); return }
    if (!validateLocale()) { setActiveTab("locales"); return }
    if (!validateScopes()) { setActiveTab("scopes"); return }
    setSubmitting(true)
    try {
      await createFacilityGroup({
        code: form.code.trim().toUpperCase(),
        facility_scope_ids: form.scopes.map((s) => s.id),
        sort_order: Number(form.sort_order) || 0,
        ...fromIconValue(form.icon),
        locale: {
          name: form.locale.name.trim(),
          description: form.locale.description.trim(),
          sort_order: Number(form.locale.sort_order) || 0,
        },
      })
      toast.success(t("facilityGroup.created"))
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
    ? t("facilityGroupDialog.create")
    : (isEditing ? t("facilityGroupDialog.edit") : t("facilityGroupDialog.view"))
  const headerDesc = mode === "create"
    ? t("facilityGroupDialog.descCreate")
    : (isEditing ? t("facilityGroupDialog.descEdit") : t("facilityGroupDialog.descView"))

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

            <DialogEntityHeader icon={<Layers className="h-4 w-4" />} title={headerTitle} description={headerDesc} />

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "general" | "icon" | "locales" | "scopes")}
              className="flex-1 min-h-0 flex-col"
            >
              <div className="flex items-center justify-between mx-6 mt-4 gap-2">
                <TabsList className="w-fit shrink-0">
                  <TabsTrigger value="general">{t("common.generalInfo")}</TabsTrigger>
                  <TabsTrigger value="icon" disabled={mode === "create" && !isCodeValid()}>
                    {t("common.icon")}
                  </TabsTrigger>
                  <TabsTrigger value="locales" disabled={mode === "create" && !(isCodeValid() && isIconValid())}>
                    {t("locale.translations")}
                  </TabsTrigger>
                  <TabsTrigger value="scopes" disabled={mode === "create" && !(isCodeValid() && isIconValid() && isLocaleValid())}>
                    {t("field.facilityScopes")}
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
                <FacilityGroupGeneralInfo
                  mode={mode}
                  form={form}
                  onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                  facilityGroupId={facilityGroupId}
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
                <FacilityGroupLocaleTranslations
                  mode={mode}
                  form={form}
                  onFormChange={onFormChange}
                  facilityGroupId={facilityGroupId}
                  onSaved={onSaved}
                  editing={translationsEditing}
                  onEditingChange={setTranslationsEditing}
                  onPrepareAdd={prepareAddLocale}
                  search={localeSearch}
                  onSearchChange={setLocaleSearch}
                  open={open}
                  availableLocales={availableLocales}
                  totalLocaleCount={totalLocaleCount}
                  facilityGroupLocaleCodes={facilityGroupLocaleCodes}
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

                  {mode === "create" ? (
                    <>
                      {form.scopes.length === 0 && (
                        <p className="text-sm text-muted-foreground">{t("facilityGroup.scopeEmpty")}</p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {form.scopes.map((s) => (
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
                                onClick={() => removeScope(s.id)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                        <Card
                          role="button"
                          aria-disabled={allScopesAssigned}
                          tabIndex={allScopesAssigned ? -1 : 0}
                          onClick={() => { if (!allScopesAssigned) setScopePickerOpen(true) }}
                          onKeyDown={(e) => {
                            if (allScopesAssigned) return
                            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setScopePickerOpen(true) }
                          }}
                          className={
                            allScopesAssigned
                              ? "cursor-not-allowed border-2 border-dashed border-muted-foreground/20 bg-muted/20 shadow-none ring-0 opacity-60"
                              : "group/assign cursor-pointer border-2 border-dashed border-primary/25 bg-primary/3 shadow-none ring-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          }
                        >
                          <CardContent className="flex items-center gap-3 py-3">
                            <div
                              className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 ${
                                allScopesAssigned ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary group-hover/assign:scale-110 group-hover/assign:rotate-90"
                              }`}
                            >
                              <Plus className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`font-semibold text-sm truncate ${allScopesAssigned ? "text-muted-foreground" : "text-primary"}`}>
                                {t("facilityGroup.assignScope")}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {allScopesAssigned ? t("facilityGroup.assignScopeAllAssigned") : t("facilityGroup.assignScopeHint")}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  ) : (
                    <>
                      {form.facility_scopes.length === 0 && (
                        <p className="text-sm text-muted-foreground">{t("facilityGroup.scopeEmpty")}</p>
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
                                  onClick={() => setPendingUnassignScope(s)}
                                >
                                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                                </Button>
                              </CardContent>
                            </Card>
                          )
                        })}
                        <Card
                          role="button"
                          aria-disabled={allScopesAssigned}
                          tabIndex={allScopesAssigned ? -1 : 0}
                          onClick={() => { if (!allScopesAssigned) setScopePickerOpen(true) }}
                          onKeyDown={(e) => {
                            if (allScopesAssigned) return
                            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setScopePickerOpen(true) }
                          }}
                          className={
                            allScopesAssigned
                              ? "cursor-not-allowed border-2 border-dashed border-muted-foreground/20 bg-muted/20 shadow-none ring-0 opacity-60"
                              : "group/assign cursor-pointer border-2 border-dashed border-primary/25 bg-primary/3 shadow-none ring-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          }
                        >
                          <CardContent className="flex items-center gap-3 py-3">
                            <div
                              className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 ${
                                allScopesAssigned ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary group-hover/assign:scale-110 group-hover/assign:rotate-90"
                              }`}
                            >
                              <Plus className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`font-semibold text-sm truncate ${allScopesAssigned ? "text-muted-foreground" : "text-primary"}`}>
                                {t("facilityGroup.assignScope")}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {allScopesAssigned ? t("facilityGroup.assignScopeAllAssigned") : t("facilityGroup.assignScopeHint")}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {mode === "create" && activeTab === "general" && (
              <div className="shrink-0 px-6 py-4 border-t bg-muted/40 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={requestClose} className="gap-1.5">
                  <X className="h-3.5 w-3.5" /> {t("common.cancel")}
                </Button>
                <Button type="button" size="sm" onClick={handleNextFromGeneral} disabled={!isCodeValid()} className="gap-1.5">
                  {t("common.next")} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {mode === "create" && activeTab === "icon" && (
              <div className="shrink-0 px-6 py-4 border-t bg-muted/40 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={requestClose} className="gap-1.5">
                  <X className="h-3.5 w-3.5" /> {t("common.cancel")}
                </Button>
                <Button type="button" size="sm" onClick={handleNextFromIcon} disabled={!isIconValid()} className="gap-1.5">
                  {t("common.next")} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {mode === "create" && activeTab === "locales" && (
              <div className="shrink-0 px-6 py-4 border-t bg-muted/40 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={requestClose} className="gap-1.5">
                  <X className="h-3.5 w-3.5" /> {t("common.cancel")}
                </Button>
                <Button type="button" size="sm" onClick={handleNextFromLocales} disabled={!isLocaleValid()} className="gap-1.5">
                  {t("common.next")} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {mode === "create" && activeTab === "scopes" && (
              <DialogCreateFooter submitting={submitting} onCancel={requestClose} disabled={!isScopesValid()} />
            )}

          </form>
        </SheetContent>
      </Sheet>

      <FacilityScopePickerDialog
        open={scopePickerOpen}
        onOpenChange={setScopePickerOpen}
        excludeIds={(mode === "create" ? form.scopes : form.facility_scopes).map((s) => s.id)}
        onSelect={mode === "create" ? addScope : handleAssignScope}
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

      <AlertDialog open={!!pendingUnassignScope} onOpenChange={(v) => { if (!v) setPendingUnassignScope(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("facilityGroup.scopeUnassignTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("facilityGroup.scopeUnassignDesc", { code: pendingUnassignScope?.code })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnassignScope}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
