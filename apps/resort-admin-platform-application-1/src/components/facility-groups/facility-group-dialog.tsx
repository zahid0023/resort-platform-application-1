import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { ArrowRight, Check, Layers, Pencil, Plus, RefreshCw, X } from "lucide-react"
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
import { DialogEntityHeader } from "@/components/shared/dialog-entity-header"
import { DialogCreateFooter } from "@/components/shared/dialog-create-footer"
import {
  createFacilityGroup,
  updateFacilityGroup,
  getFacilityGroup,
  listFacilityGroupLocales,
  countFacilityGroupLocales,
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
import { FacilityGroupScopeAssignments } from "./facility-group-scope-assignments"

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
  // Facility scope catalog + this group's assigned ids — owned here (not by
  // FacilityGroupScopeAssignments) because Radix TabsContent unmounts inactive panels, so state that
  // must survive switching away from the "scopes" tab and back has to live above that boundary.
  const [scopeCatalog, setScopeCatalog] = useState<FacilityScope[]>([])
  const [assignedScopeIds, setAssignedScopeIds] = useState<Set<number>>(new Set())
  const [scopesLoaded, setScopesLoaded] = useState(false)
  const [scopesLoading, setScopesLoading] = useState(false)
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
      setScopeCatalog([])
      setAssignedScopeIds(new Set())
      setScopesLoaded(false)
    }
  }, [open])

  const isDirty = mode === "create"
    ? form.code.trim() !== ""
      || form.icon.type !== ""
      || form.locale.name.trim() !== ""
      || form.locale.description.trim() !== ""
      || form.scopes.length > 0
    : generalEditing || iconEditing || translationsEditing

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

  // Full scope catalog is small enough to fetch in one page; which of those are assigned comes from
  // `form.facility_scopes`, already fetched by the card click that opened this dialog (GET
  // /facility-groups/{id} embeds it) — no need to re-hit that endpoint here. Same lazy-once-per-tab-
  // selection pattern as locales above.
  async function loadScopes(): Promise<void> {
    setScopesLoading(true)
    try {
      const res = await facilityScopesService.list({ page: 0, size: 20, sort_by: "sortOrder" })
      setScopeCatalog(res.data)
      setAssignedScopeIds(new Set(form.facility_scopes.map((s) => s.id)))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("facilityGroup.scopeLoadFailed"))
    } finally {
      setScopesLoading(false)
    }
  }

  useEffect(() => {
    if (!open || mode === "create" || activeTab !== "scopes" || scopesLoaded) return
    setScopesLoaded(true)
    loadScopes()
  }, [open, mode, activeTab, scopesLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // Manual refresh only (see handleRefresh) — re-fetches both the scope catalog and the facility
  // group itself, since `form.facility_scopes` (what loadScopes above compares against) is only ever
  // as fresh as the card click that opened this dialog. Assign/unassign already keep assignedScopeIds
  // in sync locally, but this is the explicit "pull the truth from the server" action, so it re-hits
  // both endpoints rather than trusting either cached value.
  async function refreshScopes(): Promise<void> {
    if (facilityGroupId == null) return
    setScopesLoading(true)
    try {
      const [scopesRes, groupRes] = await Promise.all([
        facilityScopesService.list({ page: 0, size: 20, sort_by: "sortOrder" }),
        getFacilityGroup(facilityGroupId),
      ])
      setScopeCatalog(scopesRes.data)
      setAssignedScopeIds(new Set(groupRes.data.facility_scopes.map((s) => s.id)))
      onFormChange({ ...form, facility_scopes: groupRes.data.facility_scopes })
    } finally {
      setScopesLoading(false)
    }
  }

  async function handleAssignScope(scope: FacilityScope): Promise<void> {
    if (facilityGroupId == null) return
    try {
      await facilityScopesService.assignGroup(scope.id, facilityGroupId)
      setAssignedScopeIds((prev) => new Set(prev).add(scope.id))
      toast.success(t("facilityGroup.scopeAssigned"))
      await onSaved?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("facilityGroup.scopeAssignFailed"))
    }
  }

  // Unassigning needs the assignment row's own id, which the scope catalog doesn't carry — resolved
  // on demand here, only for the scope actually being unassigned.
  async function handleUnassignScope(scope: FacilityScope): Promise<void> {
    try {
      const res = await facilityScopesService.listGroupAssignments(scope.id, { size: 20 })
      const match = res.data.find((a) => a.facility_group.id === facilityGroupId)
      if (!match) { toast.error(t("facilityGroup.scopeAssignmentNotFound")); return }
      await facilityScopesService.unassignGroup(scope.id, match.id)
      setAssignedScopeIds((prev) => {
        const next = new Set(prev)
        next.delete(scope.id)
        return next
      })
      toast.success(t("facilityGroup.scopeUnassigned"))
      await onSaved?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("facilityGroup.scopeUnassignFailed"))
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
        await refreshScopes()
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
                      {form.scopes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {form.scopes.map((s) => (
                            <Badge key={s.id} variant="secondary" className="gap-1.5 pr-1 font-mono text-xs">
                              {s.code}
                              {s.locale?.name && <span className="font-sans font-normal opacity-70">({s.locale.name})</span>}
                              <button
                                type="button"
                                onClick={() => removeScope(s.id)}
                                className="rounded-full hover:bg-background/60 p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setScopePickerOpen(true)}
                      >
                        <Plus className="h-3.5 w-3.5" /> {t("facilityGroup.addScope")}
                      </Button>
                    </>
                  ) : (
                    <FacilityGroupScopeAssignments
                      scopes={scopeCatalog}
                      assignedIds={assignedScopeIds}
                      loading={scopesLoading}
                      onAssign={handleAssignScope}
                      onUnassign={handleUnassignScope}
                    />
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
        excludeIds={form.scopes.map((s) => s.id)}
        onSelect={addScope}
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
    </>
  )
}
