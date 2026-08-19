"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Check, Clock, Pencil, Trash2, X } from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Button, Card, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@resort/shadcn-ui"
import { TimePickerField } from "@/components/shared/time-picker-field"
import { resortFacilitiesService } from "@/services/resort-facilities"
import type { DayOfWeek } from "@/services/days-of-week"
import { toast } from "sonner"
import type { ResortFacilityDialogMode, ResortFacilityFormState, OperatingHoursRow } from "./types"

type DayState = "CLOSED" | "OPEN_24" | "CUSTOM"

interface DraftRow {
  opens_at: string
  closes_at: string
  is_closed: boolean
  is_twenty_four_hours: boolean
}

function deriveState(row: Pick<DraftRow, "is_closed" | "is_twenty_four_hours">): DayState {
  if (row.is_closed) return "CLOSED"
  if (row.is_twenty_four_hours) return "OPEN_24"
  return "CUSTOM"
}

// "HH:mm:ss" (API) <-> "HH:mm" (TimePickerField's value contract)
function toTimeInputValue(v: string | null | undefined): string {
  return v ? v.slice(0, 5) : ""
}
function toApiTime(v: string): string | null {
  if (!v) return null
  return v.length === 5 ? `${v}:00` : v
}

export interface ResortFacilityOperatingHoursProps {
  resortId: number
  mode: ResortFacilityDialogMode
  form: ResortFacilityFormState
  onFormChange: (form: ResortFacilityFormState) => void
  facilityId?: number
  availableDaysOfWeek: DayOfWeek[]
  onSaved?: () => void | Promise<void>
  onEditingChange: (v: boolean) => void
  open: boolean
  /** Bumped by the parent dialog's manual Refresh button — any change re-fetches the full set. */
  refreshSignal?: number
}

export function ResortFacilityOperatingHours({
  resortId, mode, form, onFormChange, facilityId, availableDaysOfWeek,
  onSaved, onEditingChange, open, refreshSignal,
}: ResortFacilityOperatingHoursProps) {
  const { t } = useTranslation()
  const [rowsLoaded, setRowsLoaded] = useState(false)
  const [rowsLoading, setRowsLoading] = useState(false)
  // Keyed by day_of_week id — every day is always on screen, so a draft is identified by which
  // day it belongs to rather than by a synthetic row key.
  const [rowEditData, setRowEditData] = useState<Record<number, DraftRow>>({})
  const [busyDayIds, setBusyDayIds] = useState<Set<number>>(new Set())
  const [pendingDeleteRow, setPendingDeleteRow] = useState<OperatingHoursRow | null>(null)

  useEffect(() => {
    if (!open) {
      setRowsLoaded(false)
      setRowEditData({})
      setBusyDayIds(new Set())
    }
  }, [open])

  // A day is "being edited" whenever it has an open draft — no section-wide edit toggle, this is
  // what drives isDirty upstream.
  useEffect(() => {
    onEditingChange(Object.keys(rowEditData).length > 0)
  }, [rowEditData]) // eslint-disable-line react-hooks/exhaustive-deps

  // Lazy-load the full set once, the first time it's needed.
  useEffect(() => {
    if (!open || mode === "create" || facilityId == null || rowsLoaded) return
    setRowsLoaded(true)
    fetchRows()
  }, [open, mode, facilityId, rowsLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // Manual refresh, triggered by the parent dialog's Refresh button.
  useEffect(() => {
    if (!refreshSignal || !rowsLoaded) return
    fetchRows()
  }, [refreshSignal]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchRows(): Promise<OperatingHoursRow[]> {
    if (facilityId == null) return []
    setRowsLoading(true)
    try {
      const res = await resortFacilitiesService.listOperatingHours(resortId, facilityId, { size: 50 })
      const rows = res.data.map((r) => ({
        id: r.id,
        day_of_week: r.day_of_week,
        opens_at: r.opens_at ?? "",
        closes_at: r.closes_at ?? "",
        is_closed: r.is_closed,
        is_twenty_four_hours: r.is_twenty_four_hours,
      }))
      onFormChange({ ...form, operating_hours: rows })
      return rows
    } catch (err) {
      toast.error((err as Error).message)
      return form.operating_hours
    } finally {
      setRowsLoading(false)
    }
  }

  function findExisting(dayId: number): OperatingHoursRow | undefined {
    return form.operating_hours.find((r) => r.day_of_week.id === dayId)
  }

  function isDayEditing(dayId: number) { return dayId in rowEditData }
  function isDayBusy(dayId: number) { return busyDayIds.has(dayId) }

  function startEdit(dayId: number) {
    const existing = findExisting(dayId)
    setRowEditData((prev) => ({
      ...prev,
      [dayId]: existing
        ? { opens_at: existing.opens_at, closes_at: existing.closes_at, is_closed: existing.is_closed, is_twenty_four_hours: existing.is_twenty_four_hours }
        : { opens_at: "", closes_at: "", is_closed: false, is_twenty_four_hours: false },
    }))
  }
  function cancelEdit(dayId: number) {
    setRowEditData((prev) => { const n = { ...prev }; delete n[dayId]; return n })
  }
  function patchEdit(dayId: number, patch: Partial<DraftRow>) {
    setRowEditData((prev) => prev[dayId] ? { ...prev, [dayId]: { ...prev[dayId], ...patch } } : prev)
  }
  function setDayState(dayId: number, state: DayState) {
    if (state === "CLOSED") patchEdit(dayId, { is_closed: true, is_twenty_four_hours: false, opens_at: "", closes_at: "" })
    else if (state === "OPEN_24") patchEdit(dayId, { is_closed: false, is_twenty_four_hours: true, opens_at: "", closes_at: "" })
    else patchEdit(dayId, { is_closed: false, is_twenty_four_hours: false })
  }
  function setBusy(dayId: number, busy: boolean) {
    setBusyDayIds((prev) => { const n = new Set(prev); busy ? n.add(dayId) : n.delete(dayId); return n })
  }

  async function saveDay(dayId: number) {
    if (facilityId == null) return
    const data = rowEditData[dayId]
    if (!data) return
    const state = deriveState(data)
    if (state === "CUSTOM" && (!data.opens_at || !data.closes_at)) {
      toast.error(t("resortFacility.errOperatingHoursTimes"))
      return
    }
    setBusy(dayId, true)
    try {
      const payload = {
        day_of_week_id: dayId,
        opens_at: state === "CUSTOM" ? toApiTime(data.opens_at) : null,
        closes_at: state === "CUSTOM" ? toApiTime(data.closes_at) : null,
        is_closed: data.is_closed,
        is_twenty_four_hours: data.is_twenty_four_hours,
      }
      const existing = findExisting(dayId)
      if (existing) {
        await resortFacilitiesService.updateOperatingHours(resortId, facilityId, existing.id, payload)
      } else {
        await resortFacilitiesService.createOperatingHours(resortId, facilityId, payload)
      }
      cancelEdit(dayId)
      toast.success(t("common.saved"))
      await fetchRows()
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(dayId, false)
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteRow || facilityId == null) return
    const dayId = pendingDeleteRow.day_of_week.id
    setPendingDeleteRow(null)
    setBusy(dayId, true)
    try {
      await resortFacilitiesService.removeOperatingHours(resortId, facilityId, pendingDeleteRow.id)
      toast.success(t("resortFacility.operatingHoursRemovedToast"))
      await fetchRows()
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(dayId, false)
    }
  }

  const sortedDays = [...availableDaysOfWeek].sort((a, b) => a.sort_order - b.sort_order)
  function dayLabel(d: DayOfWeek) { return d.locale?.name ?? d.code }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-primary" />
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          {t("resortFacility.operatingHoursSection")}
        </h3>
      </div>

      <Card className="gap-0 py-0 overflow-hidden">
        {(rowsLoading && form.operating_hours.length === 0) || sortedDays.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : (
          <div className="divide-y">
            {sortedDays.map((day) => {
              const existing = findExisting(day.id)
              const rowEditing = isDayEditing(day.id)
              const busy = isDayBusy(day.id)
              const configured = !!existing
              const editData = rowEditData[day.id] ?? (existing
                ? { opens_at: existing.opens_at, closes_at: existing.closes_at, is_closed: existing.is_closed, is_twenty_four_hours: existing.is_twenty_four_hours }
                : { opens_at: "", closes_at: "", is_closed: false, is_twenty_four_hours: false })
              const state = deriveState(editData)
              const overnight = state === "CUSTOM" && !!editData.opens_at && !!editData.closes_at && editData.closes_at < editData.opens_at
              const showForm = rowEditing || configured

              return (
                <div key={day.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {dayLabel(day)}
                      {!configured && !rowEditing && (
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                          {t("resortFacility.operatingHoursNotSet")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!rowEditing && (
                        <>
                          <Button type="button" size="icon" variant="ghost" className="h-7 w-7"
                            onClick={() => startEdit(day.id)} disabled={busy}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {configured && (
                            <Button type="button" size="icon" variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => setPendingDeleteRow(existing)} disabled={busy}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                      {rowEditing && (
                        <>
                          <Button type="button" size="icon" variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => cancelEdit(day.id)} disabled={busy}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                          <Button type="button" size="icon" variant="ghost"
                            className="h-7 w-7 text-primary"
                            onClick={() => saveDay(day.id)} disabled={busy}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {!showForm ? (
                    <p className="text-xs text-muted-foreground">{t("resortFacility.operatingHoursNotConfigured")}</p>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("resortFacility.operatingHoursState")} *</Label>
                        <Select value={state} onValueChange={(v) => setDayState(day.id, v as DayState)} disabled={!rowEditing}>
                          <SelectTrigger className="h-9 text-sm w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CUSTOM">{t("resortFacility.operatingHoursCustom")}</SelectItem>
                            <SelectItem value="OPEN_24">{t("resortFacility.operatingHoursOpen24")}</SelectItem>
                            <SelectItem value="CLOSED">{t("resortFacility.operatingHoursClosed")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {state === "CUSTOM" && (
                        <div className="flex flex-col gap-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">{t("field.opensAt")} *</Label>
                              <TimePickerField value={toTimeInputValue(editData.opens_at)}
                                onChange={(v) => patchEdit(day.id, { opens_at: v })}
                                disabled={!rowEditing} align="start" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">{t("field.closesAt")} *</Label>
                              <TimePickerField value={toTimeInputValue(editData.closes_at)}
                                onChange={(v) => patchEdit(day.id, { closes_at: v })}
                                disabled={!rowEditing} align="end" />
                            </div>
                          </div>
                          {overnight && (
                            <p className="text-xs text-muted-foreground">{t("resortFacility.operatingHoursOvernightHint")}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <AlertDialog open={!!pendingDeleteRow} onOpenChange={(o) => !o && setPendingDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resortFacility.deleteOperatingHoursTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("resortFacility.deleteOperatingHoursDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
