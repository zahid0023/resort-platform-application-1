"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Check, Clock, Copy, Pencil, Plus, Trash2, X } from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Button, Card, Checkbox, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@resort/shadcn-ui"
import { TimePickerField } from "@/components/shared/time-picker-field"
import { resortFacilitiesService, type SetOperatingHoursScheduleDayRequest } from "@/services/resort-facilities"
import type { DayOfWeek } from "@/services/days-of-week"
import { toast } from "sonner"
import type {
  ResortFacilityDialogMode, ResortFacilityFormState, OperatingHoursRow,
  OperatingHoursDraft, OperatingHoursWindowDraft,
} from "./types"
import { emptyOperatingHoursDraft, toApiTime, toTimeInputValue } from "./types"

type DayState = "CLOSED" | "OPEN_24" | "CUSTOM"

function deriveState(row: Pick<OperatingHoursDraft, "is_closed" | "is_twenty_four_hours">): DayState {
  if (row.is_closed) return "CLOSED"
  if (row.is_twenty_four_hours) return "OPEN_24"
  return "CUSTOM"
}

function isDraftValid(draft: OperatingHoursDraft): boolean {
  if (draft.is_closed || draft.is_twenty_four_hours) return true
  return draft.windows.length > 0 && draft.windows.every((w) => !!w.opens_at && !!w.closes_at)
}

// A day's rows (one per window, or a single whole-day row) collapsed back into the same draft
// shape the editors use — shared by the view-mode fallback-when-not-editing display and by
// `buildScheduleDays` below, which needs every *other* day's current values to resubmit them
// unchanged alongside whichever one day actually changed.
function draftFromRows(rows: OperatingHoursRow[]): OperatingHoursDraft {
  const first = rows[0]
  if (!first) return emptyOperatingHoursDraft
  if (first.is_closed || first.is_twenty_four_hours) {
    return { is_closed: first.is_closed, is_twenty_four_hours: first.is_twenty_four_hours, windows: [] }
  }
  return {
    is_closed: false,
    is_twenty_four_hours: false,
    windows: rows.map((r) => ({ id: r.id, opens_at: toTimeInputValue(r.opens_at), closes_at: toTimeInputValue(r.closes_at) })),
  }
}

function draftToScheduleDay(dayId: number, draft: OperatingHoursDraft): SetOperatingHoursScheduleDayRequest {
  const isCustom = !draft.is_closed && !draft.is_twenty_four_hours
  return {
    day_of_week_id: dayId,
    is_closed: draft.is_closed,
    is_twenty_four_hours: draft.is_twenty_four_hours,
    windows: isCustom
      ? draft.windows
        .filter((w) => w.opens_at && w.closes_at)
        .map((w) => ({ opens_at: toApiTime(w.opens_at)!, closes_at: toApiTime(w.closes_at)! }))
      : [],
  }
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
  // day it belongs to rather than by a synthetic row key. Holds every window for that day at once
  // (a day may have several, e.g. a pool open 6AM-1PM and again 4PM-11PM).
  const [rowEditData, setRowEditData] = useState<Record<number, OperatingHoursDraft>>({})
  const [busyDayIds, setBusyDayIds] = useState<Set<number>>(new Set())
  const [pendingApplyAllDayId, setPendingApplyAllDayId] = useState<number | null>(null)
  // Create-mode only — most facilities keep the same hours every day, so this starts checked and
  // drives a single shared editor instead of making the owner repeat themselves for all 7 days.
  const [sameForAllDays, setSameForAllDays] = useState(true)

  useEffect(() => {
    if (!open) {
      setRowsLoaded(false)
      setRowEditData({})
      setBusyDayIds(new Set())
      setSameForAllDays(true)
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

  function mapRows(data: { id: number; day_of_week: DayOfWeek; opens_at: string | null; closes_at: string | null; is_closed: boolean; is_twenty_four_hours: boolean }[]): OperatingHoursRow[] {
    return data.map((r) => ({
      id: r.id,
      day_of_week: r.day_of_week,
      opens_at: r.opens_at ?? "",
      closes_at: r.closes_at ?? "",
      is_closed: r.is_closed,
      is_twenty_four_hours: r.is_twenty_four_hours,
    }))
  }

  async function fetchRows(): Promise<OperatingHoursRow[]> {
    if (facilityId == null) return []
    setRowsLoading(true)
    try {
      const res = await resortFacilitiesService.listOperatingHours(resortId, facilityId, { size: 50 })
      const rows = mapRows(res.data)
      onFormChange({ ...form, operating_hours: rows })
      return rows
    } catch (err) {
      toast.error((err as Error).message)
      return form.operating_hours
    } finally {
      setRowsLoading(false)
    }
  }

  // A day may back onto several rows (one per window) — every lookup below returns the full set,
  // never just the first match.
  function rowsForDay(dayId: number): OperatingHoursRow[] {
    return form.operating_hours.filter((r) => r.day_of_week.id === dayId)
  }

  function isDayEditing(dayId: number) { return dayId in rowEditData }
  function isDayBusy(dayId: number) { return busyDayIds.has(dayId) }

  function startEdit(dayId: number) {
    setRowEditData((prev) => ({ ...prev, [dayId]: draftFromRows(rowsForDay(dayId)) }))
  }
  function cancelEdit(dayId: number) {
    setRowEditData((prev) => { const n = { ...prev }; delete n[dayId]; return n })
  }
  function patchEdit(dayId: number, patch: Partial<OperatingHoursDraft> | ((prev: OperatingHoursDraft) => Partial<OperatingHoursDraft>)) {
    setRowEditData((prev) => {
      const current = prev[dayId]
      if (!current) return prev
      const p = typeof patch === "function" ? patch(current) : patch
      return { ...prev, [dayId]: { ...current, ...p } }
    })
  }
  function setDayState(dayId: number, state: DayState) {
    if (state === "CLOSED") patchEdit(dayId, { is_closed: true, is_twenty_four_hours: false, windows: [] })
    else if (state === "OPEN_24") patchEdit(dayId, { is_closed: false, is_twenty_four_hours: true, windows: [] })
    else patchEdit(dayId, (prev) => ({ is_closed: false, is_twenty_four_hours: false, windows: prev.windows.length ? prev.windows : [{ opens_at: "", closes_at: "" }] }))
  }
  function addWindow(dayId: number) {
    patchEdit(dayId, (prev) => ({ windows: [...prev.windows, { opens_at: "", closes_at: "" }] }))
  }
  function removeWindow(dayId: number, index: number) {
    patchEdit(dayId, (prev) => ({ windows: prev.windows.filter((_, i) => i !== index) }))
  }
  function patchWindow(dayId: number, index: number, patch: Partial<OperatingHoursWindowDraft>) {
    patchEdit(dayId, (prev) => ({ windows: prev.windows.map((w, i) => (i === index ? { ...w, ...patch } : w)) }))
  }
  function setBusy(dayId: number, busy: boolean) {
    setBusyDayIds((prev) => { const n = new Set(prev); busy ? n.add(dayId) : n.delete(dayId); return n })
  }

  // There's no per-day write endpoint — the schedule is always replaced as a complete week. This
  // builds that full `days[]` payload: the day(s) actually being changed use the given override
  // draft(s), every other day is resubmitted unchanged from whatever `form.operating_hours`
  // already holds. Callers never see this — from the owner's side, editing one day just saves
  // that one day; the full-week resend is an implementation detail of the API, not the UI.
  function buildScheduleDays(overrides: Record<number, OperatingHoursDraft>): SetOperatingHoursScheduleDayRequest[] {
    return availableDaysOfWeek.map((day) => {
      const draft = overrides[day.id] ?? draftFromRows(rowsForDay(day.id))
      return draftToScheduleDay(day.id, draft)
    })
  }

  async function saveDay(dayId: number) {
    if (facilityId == null) return
    const draft = rowEditData[dayId]
    if (!draft) return
    if (!isDraftValid(draft)) {
      toast.error(t("resortFacility.errOperatingHoursTimes"))
      return
    }
    setBusy(dayId, true)
    try {
      const res = await resortFacilitiesService.setOperatingHoursSchedule(resortId, facilityId, {
        days: buildScheduleDays({ [dayId]: draft }),
      })
      onFormChange({ ...form, operating_hours: mapRows(res.data) })
      cancelEdit(dayId)
      toast.success(t("common.saved"))
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(dayId, false)
    }
  }

  function requestApplyToAllDays(dayId: number) {
    const draft = rowEditData[dayId]
    if (!draft || !isDraftValid(draft)) {
      toast.error(t("resortFacility.errOperatingHoursTimes"))
      return
    }
    setPendingApplyAllDayId(dayId)
  }

  // Copies the day currently being edited to every other day, in the same single schedule write.
  async function applyToAllDays() {
    if (facilityId == null || pendingApplyAllDayId == null) return
    const dayId = pendingApplyAllDayId
    const draft = rowEditData[dayId]
    setPendingApplyAllDayId(null)
    if (!draft) return
    const overrides: Record<number, OperatingHoursDraft> = {}
    for (const day of availableDaysOfWeek) overrides[day.id] = draft
    setBusyDayIds(new Set(availableDaysOfWeek.map((d) => d.id)))
    try {
      const res = await resortFacilitiesService.setOperatingHoursSchedule(resortId, facilityId, {
        days: buildScheduleDays(overrides),
      })
      onFormChange({ ...form, operating_hours: mapRows(res.data) })
      cancelEdit(dayId)
      toast.success(t("resortFacility.operatingHoursAppliedToAll"))
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusyDayIds(new Set())
    }
  }

  // Create-mode drafts — the API requires the whole weekly schedule up front, so every day is
  // always editable directly against form.operating_hours_draft, with no fetch and no per-day
  // save-to-API round trip (the parent dialog submits the whole week as part of the create POST).
  function patchCreateDraft(dayId: number, patch: Partial<OperatingHoursDraft> | ((prev: OperatingHoursDraft) => Partial<OperatingHoursDraft>)) {
    const current = form.operating_hours_draft[dayId] ?? emptyOperatingHoursDraft
    const p = typeof patch === "function" ? patch(current) : patch
    onFormChange({ ...form, operating_hours_draft: { ...form.operating_hours_draft, [dayId]: { ...current, ...p } } })
  }
  function setCreateDayState(dayId: number, state: DayState) {
    if (state === "CLOSED") patchCreateDraft(dayId, { is_closed: true, is_twenty_four_hours: false, windows: [] })
    else if (state === "OPEN_24") patchCreateDraft(dayId, { is_closed: false, is_twenty_four_hours: true, windows: [] })
    else patchCreateDraft(dayId, (prev) => ({ is_closed: false, is_twenty_four_hours: false, windows: prev.windows.length ? prev.windows : [{ opens_at: "", closes_at: "" }] }))
  }
  function addCreateWindow(dayId: number) {
    patchCreateDraft(dayId, (prev) => ({ windows: [...prev.windows, { opens_at: "", closes_at: "" }] }))
  }
  function removeCreateWindow(dayId: number, index: number) {
    patchCreateDraft(dayId, (prev) => ({ windows: prev.windows.filter((_, i) => i !== index) }))
  }
  function patchCreateWindow(dayId: number, index: number, patch: Partial<OperatingHoursWindowDraft>) {
    patchCreateDraft(dayId, (prev) => ({ windows: prev.windows.map((w, i) => (i === index ? { ...w, ...patch } : w)) }))
  }

  // Same-for-all-days drafting — the week's first day acts as the shared source of truth (every
  // day is kept identical while the checkbox is on, so any one of them would do); every change
  // writes the same draft into every day's slot at once, so flipping the checkbox back off leaves
  // every day already pre-filled with it.
  const sharedDayId = availableDaysOfWeek[0]?.id
  const sharedDraft = sharedDayId != null ? (form.operating_hours_draft[sharedDayId] ?? emptyOperatingHoursDraft) : emptyOperatingHoursDraft
  function applyDraftToAllDays(draft: OperatingHoursDraft) {
    const next: Record<number, OperatingHoursDraft> = { ...form.operating_hours_draft }
    for (const day of availableDaysOfWeek) next[day.id] = draft
    onFormChange({ ...form, operating_hours_draft: next })
  }
  function handleSameForAllDaysToggle(checked: boolean) {
    setSameForAllDays(checked)
    if (checked) applyDraftToAllDays(sharedDraft)
  }
  function setSharedState(state: DayState) {
    if (state === "CLOSED") applyDraftToAllDays({ is_closed: true, is_twenty_four_hours: false, windows: [] })
    else if (state === "OPEN_24") applyDraftToAllDays({ is_closed: false, is_twenty_four_hours: true, windows: [] })
    else applyDraftToAllDays({ is_closed: false, is_twenty_four_hours: false, windows: sharedDraft.windows.length ? sharedDraft.windows : [{ opens_at: "", closes_at: "" }] })
  }
  function addSharedWindow() {
    applyDraftToAllDays({ ...sharedDraft, windows: [...sharedDraft.windows, { opens_at: "", closes_at: "" }] })
  }
  function removeSharedWindow(index: number) {
    applyDraftToAllDays({ ...sharedDraft, windows: sharedDraft.windows.filter((_, i) => i !== index) })
  }
  function patchSharedWindow(index: number, patch: Partial<OperatingHoursWindowDraft>) {
    applyDraftToAllDays({ ...sharedDraft, windows: sharedDraft.windows.map((w, i) => (i === index ? { ...w, ...patch } : w)) })
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

      {mode === "create" && sortedDays.length > 0 && (
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <Checkbox checked={sameForAllDays} onCheckedChange={(v) => handleSameForAllDaysToggle(v === true)} />
          <span className="text-sm text-foreground">{t("resortFacility.sameHoursEveryDay")}</span>
        </label>
      )}

      <Card className="gap-0 py-0 overflow-hidden">
        {sortedDays.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : mode === "create" ? (
          <div className="divide-y">
            {sortedDays.map((day) => {
              // Same-for-all-days: every day reads/writes the one shared draft, so they always
              // show identical values and editing any single day updates every other one too.
              const draft = sameForAllDays ? sharedDraft : (form.operating_hours_draft[day.id] ?? emptyOperatingHoursDraft)
              const state = deriveState(draft)
              const onStateChange = sameForAllDays ? setSharedState : (v: DayState) => setCreateDayState(day.id, v)
              const onAddWindow = sameForAllDays ? addSharedWindow : () => addCreateWindow(day.id)
              const onRemoveWindow = sameForAllDays ? removeSharedWindow : (i: number) => removeCreateWindow(day.id, i)
              const onPatchWindow = sameForAllDays
                ? patchSharedWindow
                : (i: number, patch: Partial<OperatingHoursWindowDraft>) => patchCreateWindow(day.id, i, patch)

              return (
                <div key={day.id} className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {dayLabel(day)}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{t("resortFacility.operatingHoursState")} *</Label>
                    <Select value={state} onValueChange={(v) => onStateChange(v as DayState)}>
                      <SelectTrigger className="h-9 text-sm w-full cursor-pointer">
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
                    <div className="space-y-3">
                      {draft.windows.map((w, i) => {
                        const overnight = !!w.opens_at && !!w.closes_at && w.closes_at < w.opens_at
                        return (
                          <div key={i} className="flex flex-col gap-1.5 rounded-md border border-border/60 p-2.5">
                            <div className="flex items-start gap-2">
                              <div className="grid grid-cols-2 gap-3 flex-1">
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-muted-foreground">{t("field.opensAt")} *</Label>
                                  <TimePickerField value={w.opens_at}
                                    onChange={(v) => onPatchWindow(i, { opens_at: v })} />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-muted-foreground">{t("field.closesAt")} *</Label>
                                  <TimePickerField value={w.closes_at}
                                    onChange={(v) => onPatchWindow(i, { closes_at: v })} />
                                </div>
                              </div>
                              {draft.windows.length > 1 && (
                                <Button type="button" size="icon" variant="ghost"
                                  className="h-9 w-9 mt-6 shrink-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => onRemoveWindow(i)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                            {overnight && (
                              <p className="text-xs text-muted-foreground">{t("resortFacility.operatingHoursOvernightHint")}</p>
                            )}
                          </div>
                        )
                      })}
                      <Button type="button" size="sm" variant="outline" className="h-7 text-xs px-2.5"
                        onClick={onAddWindow}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> {t("resortFacility.addWindow")}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : rowsLoading && form.operating_hours.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : (
          <div className="divide-y">
            {sortedDays.map((day) => {
              const rows = rowsForDay(day.id)
              const rowEditing = isDayEditing(day.id)
              const busy = isDayBusy(day.id)
              const configured = rows.length > 0
              const draft = rowEditData[day.id] ?? draftFromRows(rows)
              const state = deriveState(draft)
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
                        <Button type="button" size="icon" variant="ghost" className="h-7 w-7"
                          onClick={() => startEdit(day.id)} disabled={busy}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {rowEditing && (
                        <>
                          <Button type="button" size="sm" variant="outline"
                            className="h-7 text-xs px-2.5 gap-1.5"
                            onClick={() => requestApplyToAllDays(day.id)} disabled={busy}>
                            <Copy className="h-3.5 w-3.5" /> {t("resortFacility.applyToAllDays")}
                          </Button>
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
                          <SelectTrigger className="h-9 text-sm w-full cursor-pointer disabled:cursor-not-allowed">
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
                        <div className="space-y-3">
                          {draft.windows.map((w, i) => {
                            const overnight = !!w.opens_at && !!w.closes_at && w.closes_at < w.opens_at
                            return (
                              <div key={w.id ?? `new_${i}`} className="flex flex-col gap-1.5 rounded-md border border-border/60 p-2.5">
                                <div className="flex items-start gap-2">
                                  <div className="grid grid-cols-2 gap-3 flex-1">
                                    <div className="space-y-1.5">
                                      <Label className="text-xs text-muted-foreground">{t("field.opensAt")} *</Label>
                                      <TimePickerField value={w.opens_at}
                                        onChange={(v) => patchWindow(day.id, i, { opens_at: v })}
                                        disabled={!rowEditing} />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label className="text-xs text-muted-foreground">{t("field.closesAt")} *</Label>
                                      <TimePickerField value={w.closes_at}
                                        onChange={(v) => patchWindow(day.id, i, { closes_at: v })}
                                        disabled={!rowEditing} />
                                    </div>
                                  </div>
                                  {rowEditing && draft.windows.length > 1 && (
                                    <Button type="button" size="icon" variant="ghost"
                                      className="h-9 w-9 mt-6 shrink-0 text-muted-foreground hover:text-destructive"
                                      onClick={() => removeWindow(day.id, i)}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                                {overnight && (
                                  <p className="text-xs text-muted-foreground">{t("resortFacility.operatingHoursOvernightHint")}</p>
                                )}
                              </div>
                            )
                          })}
                          {rowEditing && (
                            <Button type="button" size="sm" variant="outline" className="h-7 text-xs px-2.5"
                              onClick={() => addWindow(day.id)}>
                              <Plus className="h-3.5 w-3.5 mr-1" /> {t("resortFacility.addWindow")}
                            </Button>
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

      <AlertDialog open={pendingApplyAllDayId != null} onOpenChange={(o) => !o && setPendingApplyAllDayId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resortFacility.applyToAllDaysTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("resortFacility.applyToAllDaysDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={applyToAllDays}>{t("resortFacility.applyToAllDays")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
