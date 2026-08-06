import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronDown, Pencil, X } from "lucide-react"
import { Button } from "@resort/shadcn-ui"
import { Card, CardContent } from "@resort/shadcn-ui"
import { Input } from "@resort/shadcn-ui"
import { Label } from "@resort/shadcn-ui"
import { updateFacility } from "@/services/facilities"
import type { FacilityGroupSummary } from "@/services/facility-groups"
import { toast } from "sonner"
import type { FacilityDialogMode, FacilityFormState } from "./types"
import { fromIconValue } from "./types"
import { FacilityGroupPickerDialog } from "./facility-group-picker-dialog"

export interface FacilityGeneralInfoProps {
  mode: FacilityDialogMode
  form: FacilityFormState
  onFormChange: (patch: Partial<FacilityFormState>) => void
  facilityId?: number
  /** When set (e.g. "+ New Facility" from within a group's detail page), the facility group is
   * pre-fixed to this group — the picker is hidden and the group is shown read-only instead. */
  fixedFacilityGroup?: FacilityGroupSummary
  onSaved?: () => void | Promise<void>
  editing: boolean
  onEditingChange: (v: boolean) => void
  open: boolean
}

export function FacilityGeneralInfo({
  mode,
  form,
  onFormChange,
  facilityId,
  fixedFacilityGroup,
  onSaved,
  editing,
  onEditingChange,
  open,
}: FacilityGeneralInfoProps) {
  const { t } = useTranslation()
  const [local, setLocal] = useState<{ sort_order: number }>({ sort_order: 0 })
  const [submitting, setSubmitting] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      setSubmitting(false)
      setPickerOpen(false)
    }
  }, [open])

  // Create mode always needs a group — pre-fill from the fixed one as soon as the dialog opens, so
  // the picker never has to be touched when creating from within a group's own detail page.
  useEffect(() => {
    if (open && mode === "create" && fixedFacilityGroup && !form.facility_group) {
      onFormChange({ facility_group: fixedFacilityGroup })
    }
  }, [open, mode, fixedFacilityGroup]) // eslint-disable-line react-hooks/exhaustive-deps

  const showGroupPicker = mode === "create" && !fixedFacilityGroup

  function startEdit() {
    setLocal({ sort_order: form.sort_order })
    onEditingChange(true)
  }

  async function save() {
    if (facilityId == null) return
    setSubmitting(true)
    try {
      await updateFacility(facilityId, {
        sort_order: Number(local.sort_order) || 0,
        ...fromIconValue(form.icon),
      })
      toast.success(t("facility.updated"))
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

  function handleSortChange(n: number) {
    if (mode === "create") onFormChange({ sort_order: n })
    else setLocal((p) => ({ ...p, sort_order: n }))
  }

  const groupLabel = form.facility_group
    ? `${form.facility_group.locale?.name ?? form.facility_group.code} (${form.facility_group.code})`
    : t("placeholder.selectFacilityGroup")

  return (
    <div className="space-y-4">
      {/* Section header */}
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

          {/* Facility group — picker dialog in create mode, read-only always after (immutable, per API) */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">{t("field.facilityGroup")} *</Label>
            {showGroupPicker ? (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between font-normal"
                onClick={() => setPickerOpen(true)}
              >
                <span className={form.facility_group ? "" : "text-muted-foreground"}>
                  {groupLabel}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
              </Button>
            ) : (
              <Input value={groupLabel} disabled className="font-medium" onChange={() => {}} />
            )}
          </div>

          {/* Code — immutable after creation */}
          <div className="space-y-2">
            <Label htmlFor="f-code" className="text-xs font-medium">{t("common.code")} *</Label>
            <Input
              id="f-code"
              value={form.code}
              onChange={(e) => onFormChange({ code: e.target.value })}
              placeholder="POOL_OUTDOOR"
              required
              disabled={mode !== "create"}
              className="font-mono"
            />
          </div>

          {/* Sort order */}
          <div className="space-y-2">
            <Label htmlFor="f-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
            <Input
              id="f-sort"
              type="number"
              value={sortValue}
              onChange={(e) => handleSortChange(Number(e.target.value))}
              required={mode === "create"}
              disabled={isReadOnly}
            />
          </div>
        </CardContent>
      </Card>

      <FacilityGroupPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectedId={form.facility_group?.id}
        onSelect={(group) => onFormChange({ facility_group: group })}
      />
    </div>
  )
}
