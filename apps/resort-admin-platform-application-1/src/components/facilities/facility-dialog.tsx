import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Check, Layers, Pencil, X } from "lucide-react"
import { Dialog, DialogContent } from "@resort/shadcn-ui"
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
import { createFacility, updateFacility } from "@/services/facilities"
import type { Locale } from "@/services/locales"
import { toast } from "sonner"
import type { FacilityDialogMode, FacilityFormState } from "./types"
import { fromIconValue } from "./types"
import { IconPicker, EMPTY_ICON_VALUE } from "@/components/shared/icon-picker"
import type { IconValue } from "@/components/shared/icon-picker"
import { FacilityGeneralInfo } from "./facility-general-info"
import { FacilityLocaleTranslations } from "./facility-locale-translations"

export const emptyFacilityForm: FacilityFormState = {
  facility_group_id: "",
  code: "",
  sort_order: 0,
  icon: EMPTY_ICON_VALUE,
  locales: [{ locale_id: "", name: "", description: "", sort_order: 0 }],
}

export interface FacilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: FacilityDialogMode
  facilityId?: number
  form: FacilityFormState
  onFormChange: (form: FacilityFormState) => void
  availableLocales: Locale[]
  /** When set, facility group is pre-fixed and the selector is hidden */
  fixedFacilityGroupId?: number
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
  fixedFacilityGroupId,
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

  useEffect(() => {
    if (!open) {
      setGeneralEditing(false)
      setIconEditing(false)
      setIconSubmitting(false)
      setTranslationsEditing(false)
      setConfirmClose(false)
    }
  }, [open])

  const isDirty = mode === "create"
    ? form.code.trim() !== ""
      || form.facility_group_id !== ""
      || form.icon.type !== ""
      || form.locales.length > 1
      || form.locales.some((l) => l.locale_id !== "" || l.name.trim() !== "")
    : generalEditing || iconEditing || translationsEditing

  function requestClose() {
    if (isDirty) setConfirmClose(true)
    else onOpenChange(false)
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode !== "create") return
    if (!form.facility_group_id) { toast.error(t("toast.facilityGroupRequired")); return }
    if (!form.code.trim()) { toast.error(t("toast.codeRequired")); return }
    if (!form.icon.type) { toast.error(t("facilityDialog.errIconType")); return }
    if (!form.icon.value) { toast.error(t("facilityDialog.errIconValue")); return }
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) { toast.error(t("toast.localeSelectLang", { n: i + 1 })); return }
      if (!row.name.trim()) { toast.error(t("toast.localeNameRequired", { n: i + 1 })); return }
    }
    setSubmitting(true)
    try {
      await createFacility({
        facility_group_id: Number(form.facility_group_id),
        code: form.code.trim().toUpperCase(),
        sort_order: Number(form.sort_order) || 0,
        ...fromIconValue(form.icon),
        locales: form.locales.map((row) => ({
          locale_id: Number(row.locale_id),
          name: row.name.trim(),
          description: row.description.trim() || undefined,
          sort_order: Number(row.sort_order) || 0,
        })),
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
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose() }}>
        <DialogContent
          className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose() }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">

            <DialogEntityHeader icon={<Layers className="h-4 w-4" />} title={headerTitle} description={headerDesc} />

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <FacilityGeneralInfo
                mode={mode}
                form={form}
                onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                facilityId={facilityId}
                fixedFacilityGroupId={fixedFacilityGroupId}
                onSaved={onSaved}
                editing={generalEditing}
                onEditingChange={setGeneralEditing}
                open={open}
              />

              {/* Icon section */}
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

              <FacilityLocaleTranslations
                mode={mode}
                form={form}
                onFormChange={onFormChange}
                facilityId={facilityId}
                availableLocales={availableLocales}
                onSaved={onSaved}
                editing={translationsEditing}
                onEditingChange={setTranslationsEditing}
                open={open}
              />
            </div>

            {mode === "create" && (
              <DialogCreateFooter submitting={submitting} onCancel={requestClose} />
            )}

          </form>
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
