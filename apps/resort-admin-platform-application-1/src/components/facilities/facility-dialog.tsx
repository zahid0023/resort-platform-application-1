import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { ArrowRight, Check, Pencil, Sparkles, X } from "lucide-react"
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
import { Button } from "@resort/shadcn-ui"
import { DialogEntityHeader } from "@/components/shared/dialog-entity-header"
import { DialogCreateFooter } from "@/components/shared/dialog-create-footer"
import {
  createFacility,
  updateFacility,
  listFacilityLocales,
  countFacilityLocales,
} from "@/services/facilities"
import type { FacilityGroupSummary } from "@/services/facility-groups"
import type { Locale } from "@/services/locales"
import { useLocales } from "@/providers/locales-provider"
import { toast } from "sonner"
import type { FacilityDialogMode, FacilityFormState } from "./types"
import { fromIconValue } from "./types"
import { IconPicker, EMPTY_ICON_VALUE } from "@/components/shared/icon-picker"
import type { IconValue } from "@/components/shared/icon-picker"
import { FacilityGeneralInfo } from "./facility-general-info"
import { FacilityLocaleTranslations } from "./facility-locale-translations"

export const emptyFacilityForm: FacilityFormState = {
  facility_group: null,
  code: "",
  sort_order: 0,
  icon: EMPTY_ICON_VALUE,
  locale: { name: "", description: "", sort_order: 0 },
  locales: [],
}

// Create only ever submits the "en" translation — keep it English/ASCII.
const ENGLISH_TEXT_PATTERN = /^[\x00-\x7F]*$/

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
  const [generalEditing, setGeneralEditing] = useState(false)
  const [iconEditing, setIconEditing] = useState(false)
  const [iconSubmitting, setIconSubmitting] = useState(false)
  const [localIcon, setLocalIcon] = useState<IconValue>(EMPTY_ICON_VALUE)
  const [translationsEditing, setTranslationsEditing] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [activeTab, setActiveTab] = useState<"general" | "icon" | "locales">("general")
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

  useEffect(() => {
    if (!open) {
      setGeneralEditing(false)
      setIconEditing(false)
      setIconSubmitting(false)
      setTranslationsEditing(false)
      setConfirmClose(false)
      setActiveTab("general")
      setLocalesLoaded(false)
      setLocaleSearch("")
      lastLocaleSearchKey.current = ""
      setFacilityLocaleCodes(null)
    }
  }, [open])

  const isDirty = mode === "create"
    ? form.code.trim() !== ""
      || form.facility_group != null
      || form.icon.type !== ""
      || form.locale.name.trim() !== ""
      || form.locale.description.trim() !== ""
    : generalEditing || iconEditing || translationsEditing

  function requestClose() {
    if (isDirty) setConfirmClose(true)
    else onOpenChange(false)
  }

  // Silent checks — drive the "icon"/"locales" tabs' disabled state without firing toasts on every
  // render. General info covers both the group selection and the code here (unlike Facility Group,
  // which has no parent selector of its own).
  function isGeneralValid(): boolean {
    return form.code.trim() !== "" && form.facility_group != null
  }
  function isIconValid(): boolean {
    return form.icon.type !== "" && !!form.icon.value
  }

  // Same checks, but report which field is missing — used by both the Next buttons and submit.
  function validateGeneral(): boolean {
    if (!form.facility_group) { toast.error(t("toast.facilityGroupRequired")); return false }
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

  // Silent check — drives the Create button's disabled state without firing toasts on every render.
  function isLocaleValid(): boolean {
    return form.locale.name.trim() !== "" && form.locale.description.trim() !== ""
      && ENGLISH_TEXT_PATTERN.test(form.locale.name) && ENGLISH_TEXT_PATTERN.test(form.locale.description)
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode !== "create") return
    if (!validateGeneral()) { setActiveTab("general"); return }
    if (!validateIcon()) { setActiveTab("icon"); return }
    if (!form.locale.name.trim()) { toast.error(t("toast.localeNameRequired", { n: 1 })); return }
    if (!ENGLISH_TEXT_PATTERN.test(form.locale.name)) { toast.error(t("toast.localeNameEnglishOnly")); return }
    if (!form.locale.description.trim()) { toast.error(t("toast.localeDescriptionRequired", { n: 1 })); return }
    if (!ENGLISH_TEXT_PATTERN.test(form.locale.description)) { toast.error(t("toast.localeDescriptionEnglishOnly")); return }
    setSubmitting(true)
    try {
      await createFacility({
        code: form.code.trim().toUpperCase(),
        facility_group_id: Number(form.facility_group!.id),
        sort_order: Number(form.sort_order) || 0,
        ...fromIconValue(form.icon),
        locale: {
          name: form.locale.name.trim(),
          description: form.locale.description.trim(),
          sort_order: Number(form.locale.sort_order) || 0,
        },
      })
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
              onValueChange={(v) => setActiveTab(v as "general" | "icon" | "locales")}
              className="flex-1 min-h-0 flex-col"
            >
              <div className="mx-6 mt-4">
                <TabsList className="w-fit shrink-0">
                  <TabsTrigger value="general">{t("common.generalInfo")}</TabsTrigger>
                  <TabsTrigger value="icon" disabled={mode === "create" && !isGeneralValid()}>
                    {t("common.icon")}
                  </TabsTrigger>
                  <TabsTrigger value="locales" disabled={mode === "create" && !(isGeneralValid() && isIconValid())}>
                    {t("locale.translations")}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="general" className="min-h-0 overflow-y-auto px-6 py-5">
                <FacilityGeneralInfo
                  mode={mode}
                  form={form}
                  onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                  facilityId={facilityId}
                  fixedFacilityGroup={fixedFacilityGroup}
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
            </Tabs>

            {mode === "create" && activeTab === "general" && (
              <div className="shrink-0 px-6 py-4 border-t bg-muted/40 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={requestClose} className="gap-1.5">
                  <X className="h-3.5 w-3.5" /> {t("common.cancel")}
                </Button>
                <Button type="button" size="sm" onClick={handleNextFromGeneral} disabled={!isGeneralValid()} className="gap-1.5">
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
              <DialogCreateFooter submitting={submitting} onCancel={requestClose} disabled={!isLocaleValid()} />
            )}

          </form>
        </SheetContent>
      </Sheet>

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
