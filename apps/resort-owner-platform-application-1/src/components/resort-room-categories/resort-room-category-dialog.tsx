"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { BedDouble } from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Button, Dialog, DialogContent, DialogTitle,
} from "@resort/shadcn-ui"
import { resortRoomCategoriesService, type ResortRoomCategoryMeta, type ResortRoomCategoryBed } from "@/services/resort-room-categories"
import type { Locale } from "@/services/locales"
import { toast } from "sonner"
import type { ResortRoomCategoryDialogMode, ResortRoomCategoryFormState } from "./types"
import { emptyForm } from "./types"
import { ResortRoomCategoryGeneralInfo } from "./resort-room-category-general-info"
import { ResortRoomCategoryLocaleTranslations } from "./resort-room-category-locale-translations"
import { ResortRoomCategoryPricesSection } from "@/components/resort-room-category-prices/resort-room-category-prices-section"
import { ResortRoomCategoryBedsSection } from "./resort-room-category-beds-section"
import { ResortRoomCategoryMetaSection } from "./resort-room-category-meta-section"

export interface ResortRoomCategoryDialogProps {
  resortId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: ResortRoomCategoryDialogMode
  resortRoomCategoryId?: number
  form: ResortRoomCategoryFormState
  onFormChange: (form: ResortRoomCategoryFormState) => void
  availableLocales: Locale[]
  totalLocaleCount: number | null
  onSaved?: () => void | Promise<void>
  meta?: ResortRoomCategoryMeta
  beds?: ResortRoomCategoryBed[]
}

export function ResortRoomCategoryDialog({
  resortId,
  open,
  onOpenChange,
  mode,
  resortRoomCategoryId,
  form,
  onFormChange,
  availableLocales,
  totalLocaleCount,
  onSaved,
  meta,
  beds,
}: ResortRoomCategoryDialogProps) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [generalEditing, setGeneralEditing] = useState(false)
  const [translationsEditing, setTranslationsEditing] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)

  useEffect(() => {
    if (!open) {
      setGeneralEditing(false)
      setTranslationsEditing(false)
      setConfirmClose(false)
    }
  }, [open])

  const isDirty = mode === "create"
    ? form.room_category_id !== "" || form.code.trim() !== "" || form.sort_order !== 0
      || form.locales.length > 1 || form.locales.some((l) => l.locale_id !== "" || l.name.trim() !== "")
      || form.max_adults !== 2 || form.max_children !== 0 || form.max_infants !== 0 || form.max_occupancy !== 2
    : generalEditing || translationsEditing

  function requestClose() {
    if (isDirty) setConfirmClose(true)
    else onOpenChange(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode !== "create") return
    if (!form.room_category_id) {
      toast.error(t("resortRoomCategory.errRoomCategoryRequired"))
      return
    }
    if (!form.code.trim()) {
      toast.error(t("resortRoomCategory.errCode"))
      return
    }
    if (form.max_occupancy < form.max_adults + form.max_children + form.max_infants) {
      toast.error(t("resortRoomCategory.errMaxOccupancy"))
      return
    }
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) { toast.error(t("locale.errLang", { n: i + 1 })); return }
      if (!row.name.trim()) { toast.error(t("locale.errName", { n: i + 1 })); return }
    }
    setSubmitting(true)
    try {
      await resortRoomCategoriesService.create(resortId, {
        room_category_id: Number(form.room_category_id),
        code: form.code.trim(),
        sort_order: Number(form.sort_order) || 0,
        locales: form.locales.map((row) => ({
          locale_id: Number(row.locale_id),
          name: row.name.trim(),
          description: row.description.trim() || undefined,
          sort_order: Number(row.sort_order) || 0,
        })),
        meta: {
          max_adults: Number(form.max_adults),
          max_children: Number(form.max_children),
          max_infants: Number(form.max_infants),
          max_occupancy: Number(form.max_occupancy),
          room_size: form.room_size.trim() ? Number(form.room_size) : undefined,
          room_size_unit_id: form.room_size_unit_id ? Number(form.room_size_unit_id) : undefined,
          bedroom_count: form.bedroom_count.trim() ? Number(form.bedroom_count) : 0,
          bathroom_count: form.bathroom_count.trim() ? Number(form.bathroom_count) : 0,
          default_check_in_time: form.default_check_in_time || undefined,
          default_check_out_time: form.default_check_out_time || undefined,
          is_extra_bed_allowed: form.is_extra_bed_allowed,
          max_extra_beds: Number(form.max_extra_beds),
          is_smoking_allowed: form.is_smoking_allowed,
          is_pets_allowed: form.is_pets_allowed,
          minimum_stay_nights: form.minimum_stay_nights.trim() ? Number(form.minimum_stay_nights) : undefined,
          maximum_stay_nights: form.maximum_stay_nights.trim() ? Number(form.maximum_stay_nights) : undefined,
        },
      })
      toast.success(t("resortRoomCategory.created"))
      onOpenChange(false)
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const isEditing = generalEditing || translationsEditing
  const headerTitle = mode === "create"
    ? t("resortRoomCategory.dialogCreate")
    : (isEditing ? t("resortRoomCategory.dialogEdit") : t("resortRoomCategory.dialogView"))
  const headerDesc = mode === "create"
    ? t("resortRoomCategory.dialogDescCreate")
    : (isEditing ? t("resortRoomCategory.dialogDescEdit") : t("resortRoomCategory.dialogDescView"))

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose() }}>
        <DialogContent
          className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose() }}
        >
          <DialogTitle className="sr-only">
            {mode === "create" ? t("resortRoomCategory.dialogCreate") : t("resortRoomCategory.dialogView")}
          </DialogTitle>
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">

            {/* Dialog header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BedDouble className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{headerTitle}</p>
                <p className="text-xs text-muted-foreground">{headerDesc}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <ResortRoomCategoryGeneralInfo
                resortId={resortId}
                mode={mode}
                form={form}
                onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                resortRoomCategoryId={resortRoomCategoryId}
                onSaved={onSaved}
                editing={generalEditing}
                onEditingChange={setGeneralEditing}
                open={open}
              />

              <ResortRoomCategoryLocaleTranslations
                resortId={resortId}
                mode={mode}
                form={form}
                onFormChange={onFormChange}
                resortRoomCategoryId={resortRoomCategoryId}
                availableLocales={availableLocales}
                totalLocaleCount={totalLocaleCount}
                onSaved={onSaved}
                editing={translationsEditing}
                onEditingChange={setTranslationsEditing}
                open={open}
              />

              {mode !== "create" && resortRoomCategoryId != null && (
                <>
                  <ResortRoomCategoryMetaSection
                    resortId={resortId}
                    resortRoomCategoryId={resortRoomCategoryId}
                    open={open}
                    initialMeta={meta}
                  />

                  <ResortRoomCategoryBedsSection
                    resortId={resortId}
                    resortRoomCategoryId={resortRoomCategoryId}
                    open={open}
                    initialBeds={beds}
                  />

                  <ResortRoomCategoryPricesSection
                    resortId={resortId}
                    resortRoomCategoryId={resortRoomCategoryId}
                    open={open}
                  />
                </>
              )}
            </div>

            {mode === "create" && (
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t shrink-0">
                <Button type="button" variant="outline" onClick={requestClose} disabled={submitting}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? t("common.saving") : t("resortRoomCategory.create")}
                </Button>
              </div>
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

export { emptyForm as emptyResortRoomCategoryForm }
