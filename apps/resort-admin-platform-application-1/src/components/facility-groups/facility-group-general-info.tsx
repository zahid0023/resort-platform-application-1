import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Check, Pencil, X } from "lucide-react"
import { Button } from "@resort/shadcn-ui"
import { Card, CardContent } from "@resort/shadcn-ui"
import { Input } from "@resort/shadcn-ui"
import { Label } from "@resort/shadcn-ui"
import { updateFacilityGroup } from "@/services/facility-groups"
import { toast } from "sonner"
import type { FacilityGroupDialogMode, FacilityGroupFormState } from "./types"
import { fromIconValue } from "./types"

export interface FacilityGroupGeneralInfoProps {
  mode: FacilityGroupDialogMode
  form: FacilityGroupFormState
  onFormChange: (patch: Partial<FacilityGroupFormState>) => void
  facilityGroupId?: number
  onSaved?: () => void | Promise<void>
  editing: boolean
  onEditingChange: (v: boolean) => void
  open: boolean
}

export function FacilityGroupGeneralInfo({
  mode,
  form,
  onFormChange,
  facilityGroupId,
  onSaved,
  editing,
  onEditingChange,
  open,
}: FacilityGroupGeneralInfoProps) {
  const { t } = useTranslation()
  const [local, setLocal] = useState<{ sort_order: number }>({ sort_order: 0 })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) setSubmitting(false)
  }, [open])

  function startEdit() {
    setLocal({ sort_order: form.sort_order })
    onEditingChange(true)
  }

  async function save() {
    if (facilityGroupId == null) return
    setSubmitting(true)
    try {
      await updateFacilityGroup(facilityGroupId, {
        sort_order: Number(local.sort_order) || 0,
        ...fromIconValue(form.icon),
      })
      toast.success(t("facilityGroup.updated"))
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
          {/* Code — immutable after creation */}
          <div className="space-y-2">
            <Label htmlFor="fg-code" className="text-xs font-medium">{t("common.code")} *</Label>
            <Input
              id="fg-code"
              value={form.code}
              onChange={(e) => onFormChange({ code: e.target.value.toUpperCase() })}
              placeholder="DINING"
              required
              disabled={mode !== "create"}
              className="font-mono"
            />
          </div>

          {/* Sort order */}
          <div className="space-y-2">
            <Label htmlFor="fg-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
            <Input
              id="fg-sort"
              type="number"
              value={sortValue}
              onChange={(e) => handleSortChange(Number(e.target.value))}
              required={mode === "create"}
              disabled={isReadOnly}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
