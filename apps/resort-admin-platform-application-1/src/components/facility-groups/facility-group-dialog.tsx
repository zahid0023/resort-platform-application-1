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
import { createFacilityGroup, updateFacilityGroup } from "@/services/facility-groups"
import type { FacilityScope } from "@/services/facility-scopes"
import type { Locale } from "@/services/locales"
import { toast } from "sonner"
import type { FacilityGroupDialogMode, FacilityGroupFormState } from "./types"
import { fromIconValue } from "./types"
import { IconPicker, EMPTY_ICON_VALUE } from "@/components/shared/icon-picker"
import type { IconValue } from "@/components/shared/icon-picker"
import { FacilityGroupGeneralInfo } from "./facility-group-general-info"
import { FacilityGroupLocaleTranslations } from "./facility-group-locale-translations"
import { FacilityGroupScopeAssignments } from "./facility-group-scope-assignments"

export const emptyFacilityGroupForm: FacilityGroupFormState = {
  code: "",
  sort_order: 0,
  icon: EMPTY_ICON_VALUE,
  locales: [{ locale_id: "", name: "", description: "", sort_order: 0 }],
  scope_ids: [],
  scope_assignments: [],
}

export interface FacilityGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: FacilityGroupDialogMode
  facilityGroupId?: number
  form: FacilityGroupFormState
  onFormChange: (form: FacilityGroupFormState) => void
  availableLocales: Locale[]
  availableScopes: FacilityScope[]
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
  availableScopes,
  onSaved,
}: FacilityGroupDialogProps) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [generalEditing, setGeneralEditing] = useState(false)
  const [iconEditing, setIconEditing] = useState(false)
  const [iconSubmitting, setIconSubmitting] = useState(false)
  const [localIcon, setLocalIcon] = useState<IconValue>(EMPTY_ICON_VALUE)
  const [translationsEditing, setTranslationsEditing] = useState(false)
  const [scopesEditing, setScopesEditing] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)

  useEffect(() => {
    if (!open) {
      setGeneralEditing(false)
      setIconEditing(false)
      setIconSubmitting(false)
      setTranslationsEditing(false)
      setScopesEditing(false)
      setConfirmClose(false)
    }
  }, [open])

  const isDirty = mode === "create"
    ? form.code.trim() !== ""
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode !== "create") return
    if (!form.code.trim()) { toast.error(t("toast.codeRequired")); return }
    if (!form.icon.type) { toast.error(t("facilityGroupDialog.errIconType")); return }
    if (!form.icon.value) { toast.error(t("facilityGroupDialog.errIconValue")); return }
    if (form.scope_ids.length === 0) { toast.error(t("facilityGroup.scopeRequired")); return }
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) { toast.error(t("toast.localeSelectLang", { n: i + 1 })); return }
      if (!row.name.trim()) { toast.error(t("toast.localeNameRequired", { n: i + 1 })); return }
    }
    setSubmitting(true)
    try {
      await createFacilityGroup({
        code: form.code.trim().toUpperCase(),
        sort_order: Number(form.sort_order) || 0,
        ...fromIconValue(form.icon),
        scope_ids: form.scope_ids,
        locales: form.locales.map((row) => ({
          locale_id: Number(row.locale_id),
          name: row.name.trim(),
          description: row.description.trim() || undefined,
          sort_order: Number(row.sort_order) || 0,
        })),
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
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose() }}>
        <DialogContent
          className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose() }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">

            <DialogEntityHeader icon={<Layers className="h-4 w-4" />} title={headerTitle} description={headerDesc} />

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
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

              <FacilityGroupScopeAssignments
                mode={mode}
                form={form}
                onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                facilityGroupId={facilityGroupId}
                availableScopes={availableScopes}
                onSaved={onSaved}
                editing={scopesEditing}
                onEditingChange={setScopesEditing}
                open={open}
              />

              <FacilityGroupLocaleTranslations
                mode={mode}
                form={form}
                onFormChange={onFormChange}
                facilityGroupId={facilityGroupId}
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
