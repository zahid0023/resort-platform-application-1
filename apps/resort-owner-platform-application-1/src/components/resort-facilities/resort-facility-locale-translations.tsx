"use client"

import { useState, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Ban, Check, Languages, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Button, Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea,
} from "@resort/shadcn-ui"
import { resortFacilitiesService } from "@/services/resort-facilities"
import type { Locale } from "@/services/locales"
import { canAddLocaleTranslation } from "@/lib/locale"
import { toast } from "sonner"
import type { ResortFacilityDialogMode, ResortFacilityFormState, LocaleRow } from "./types"

type NewLocaleRow = LocaleRow & { _rkey: string }

export interface ResortFacilityLocaleTranslationsProps {
  resortId: number
  mode: ResortFacilityDialogMode
  form: ResortFacilityFormState
  onFormChange: (form: ResortFacilityFormState) => void
  facilityId?: number
  availableLocales: Locale[]
  totalLocaleCount: number | null
  onSaved?: () => void | Promise<void>
  editing: boolean
  onEditingChange: (v: boolean) => void
  open: boolean
  disabled?: boolean
  /** Owned by the parent dialog — survives this component unmounting on tab switch. */
  search: string
  onSearchChange: (v: string) => void
  /** Bumped by the parent dialog's manual Refresh button — any change re-fetches the full set. */
  refreshSignal?: number
}

export function ResortFacilityLocaleTranslations({
  resortId, mode, form, onFormChange, facilityId, availableLocales, totalLocaleCount,
  onSaved, editing, onEditingChange, open, disabled, search, onSearchChange, refreshSignal,
}: ResortFacilityLocaleTranslationsProps) {
  const { t } = useTranslation()
  const [localesLoaded, setLocalesLoaded] = useState(false)
  const [localesLoading, setLocalesLoading] = useState(false)
  const [newLocaleRows, setNewLocaleRows] = useState<NewLocaleRow[]>([])
  const [rowEditData, setRowEditData] = useState<Record<string, LocaleRow>>({})
  const [busyRowKeys, setBusyRowKeys] = useState<Set<string>>(new Set())
  const [pendingDeleteRow, setPendingDeleteRow] = useState<LocaleRow | null>(null)
  const rKeyCounter = useRef(0)
  const lastLocaleSearchKey = useRef("")

  useEffect(() => {
    if (!open) {
      setLocalesLoaded(false)
      setNewLocaleRows([])
      setRowEditData({})
      setBusyRowKeys(new Set())
      lastLocaleSearchKey.current = ""
    }
  }, [open])

  // A translation is "being edited" whenever any row (existing or newly added) has an open draft —
  // there's no section-wide edit toggle, so this is what drives isDirty upstream.
  useEffect(() => {
    onEditingChange(Object.keys(rowEditData).length > 0)
  }, [rowEditData]) // eslint-disable-line react-hooks/exhaustive-deps

  // Lazy-load the full translation set once, the first time it's needed — GET /{id} only
  // returns the single Accept-Language-resolved `locale`, never the full set.
  useEffect(() => {
    if (!open || mode === "create" || facilityId == null || localesLoaded) return
    setLocalesLoaded(true)
    fetchLocales()
  }, [open, mode, facilityId, localesLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // Manual refresh, triggered by the parent dialog's Refresh button — skips the initial mount
  // (refreshSignal starts at 0) and only re-fetches once the section has already loaded once.
  useEffect(() => {
    if (!refreshSignal || !localesLoaded) return
    fetchLocales(search.trim())
  }, [refreshSignal]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced server-side search, view mode only — edit mode always needs the complete,
  // unfiltered list (see the duplicate-locale checks below).
  useEffect(() => {
    if (!open || mode === "create" || editing) return
    if (lastLocaleSearchKey.current === search) return
    lastLocaleSearchKey.current = search
    const timer = setTimeout(() => {
      fetchLocales(search.trim())
    }, 350)
    return () => clearTimeout(timer)
  }, [search, open, mode, editing]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchLocales(localeCode?: string): Promise<LocaleRow[]> {
    if (facilityId == null) return []
    setLocalesLoading(true)
    try {
      const res = await resortFacilitiesService.listLocales(resortId, facilityId, { size: 50, localeCode: localeCode || undefined })
      const rows = res.data.map((l) => ({
        id: l.id,
        locale: l.locale,
        name: l.name,
        description: l.description ?? "",
        notes: l.notes ?? "",
        sort_order: l.sort_order,
      }))
      onFormChange({ ...form, locales: rows })
      return rows
    } catch (err) {
      toast.error((err as Error).message)
      return form.locales
    } finally {
      setLocalesLoading(false)
    }
  }

  function rowKey(row: LocaleRow): string {
    return row.id != null ? `e_${row.id}` : (row as NewLocaleRow)._rkey ?? ""
  }
  function isRowEditing(key: string) { return key in rowEditData }
  function isRowBusy(key: string) { return busyRowKeys.has(key) }

  function startEditRow(key: string, row: LocaleRow) {
    setRowEditData((prev) => ({ ...prev, [key]: { ...row } }))
  }
  function cancelEditRow(key: string, isNew: boolean) {
    setRowEditData((prev) => { const n = { ...prev }; delete n[key]; return n })
    if (isNew) setNewLocaleRows((prev) => prev.filter((r) => r._rkey !== key))
  }
  function patchRowEdit(key: string, patch: Partial<LocaleRow>) {
    setRowEditData((prev) => prev[key] ? { ...prev, [key]: { ...prev[key], ...patch } } : prev)
  }
  function setBusy(key: string, busy: boolean) {
    setBusyRowKeys((prev) => { const n = new Set(prev); busy ? n.add(key) : n.delete(key); return n })
  }

  async function saveRow(key: string, row: LocaleRow, isNew: boolean) {
    if (facilityId == null) return
    const data = rowEditData[key]
    if (!data) return
    if (isNew && !data.locale_id) { toast.error(t("locale.errLang", { n: 1 })); return }
    if (!data.name.trim()) { toast.error(t("locale.errName", { n: 1 })); return }
    setBusy(key, true)
    try {
      if (isNew) {
        await resortFacilitiesService.addLocale(resortId, facilityId, {
          locale_id: Number(data.locale_id),
          name: data.name.trim(),
          description: data.description?.trim() ?? "",
          notes: data.notes?.trim() ?? "",
          sort_order: Number(data.sort_order) || 0,
        })
        setNewLocaleRows((prev) => prev.filter((r) => r._rkey !== key))
      } else {
        await resortFacilitiesService.updateLocale(resortId, facilityId, row.id!, {
          name: data.name.trim(),
          description: data.description?.trim() ?? "",
          notes: data.notes?.trim() ?? "",
          sort_order: Number(data.sort_order) || 0,
        })
      }
      setRowEditData((prev) => { const n = { ...prev }; delete n[key]; return n })
      toast.success(t("common.saved"))
      await fetchLocales()
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(key, false)
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteRow || facilityId == null || !pendingDeleteRow.id) return
    const row = pendingDeleteRow
    const key = rowKey(row)
    setPendingDeleteRow(null)
    setBusy(key, true)
    try {
      await resortFacilitiesService.removeLocale(resortId, facilityId, row.id!)
      toast.success(t("locale.removedToast"))
      await fetchLocales()
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(key, false)
    }
  }

  // `existingRows` is passed explicitly (rather than read off `form.locales`) because the caller
  // may have just awaited a fresh unfiltered fetch — the prop won't reflect that until the next render.
  function addNewLocaleRow(existingRows: LocaleRow[]) {
    const usedIds = new Set([
      ...existingRows.map((r) => r.locale?.id),
      ...newLocaleRows.map((r) => r.locale_id),
    ].filter((v): v is number => typeof v === "number"))
    const nextLocale = availableLocales.find((l) => !usedIds.has(l.id))
    const _rkey = `n_${rKeyCounter.current++}`
    const newRow: NewLocaleRow = {
      _rkey, locale_id: nextLocale?.id ?? "", name: "", description: "", notes: "",
      sort_order: existingRows.length + newLocaleRows.length + 1, _new: true,
    }
    setNewLocaleRows((prev) => [...prev, newRow])
    setRowEditData((prev) => ({ ...prev, [_rkey]: { ...newRow } }))
  }

  // Adding a translation always needs the complete list — clear any active search and re-pull
  // everything first, so the duplicate-locale check above never operates on a filtered subset.
  async function handleAddLocale() {
    let rows = form.locales
    if (search.trim() !== "") {
      onSearchChange("")
      lastLocaleSearchKey.current = ""
      rows = await fetchLocales()
    }
    if (!canAddLocaleTranslation(rows.length + newLocaleRows.length, totalLocaleCount)) {
      toast.error(t("locale.allLanguagesAdded"))
      return
    }
    addNewLocaleRow(rows)
  }

  // New rows go first so the owner lands on the row they just added instead of scrolling past
  // every existing translation to reach it.
  const allLocaleRows: Array<LocaleRow & { _rkey: string }> = [
    ...newLocaleRows,
    ...form.locales.map((l) => ({ ...l, _rkey: `e_${l.id}` })),
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("locale.translations")}
          </h3>
        </div>
        {mode !== "create" && (
          <Button type="button" size="sm" variant="outline" onClick={handleAddLocale}
            disabled={newLocaleRows.length > 0 || !canAddLocaleTranslation(form.locales.length + newLocaleRows.length, totalLocaleCount)}
            className="h-7 text-xs px-2.5"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> {t("locale.add")}
          </Button>
        )}
      </div>

      {/* Search is view mode only — edit mode always needs the complete, unfiltered list. */}
      {mode !== "create" && !editing && (form.locales.length > 0 || search.trim() !== "") && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("locale.searchByCode")}
            className="pl-8 h-8 text-sm"
          />
        </div>
      )}

      <Card className="gap-0 py-0 overflow-hidden">
        {/* DISABLED placeholder — group/facility type not chosen yet in create mode */}
        {disabled && (
          <div className="flex items-center gap-3 py-6 px-4 text-muted-foreground">
            <Ban className="h-4 w-4 shrink-0 opacity-40" />
            <p className="text-sm">{t("resortFacility.selectFacilityFirst")}</p>
          </div>
        )}

        {/* CREATE mode — single "en" translation, no add/remove (server always resolves to en) */}
        {mode === "create" && !disabled && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Languages className="h-3.5 w-3.5 text-muted-foreground" />
              {t("locale.row.label", { n: 1 })} (en)
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("field.sort")} *</Label>
              <Input type="number" value={form.locale.sort_order}
                onChange={(e) => onFormChange({ ...form, locale: { ...form.locale, sort_order: Number(e.target.value) } })}
                className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("common.name")} *</Label>
              <Input value={form.locale.name}
                onChange={(e) => onFormChange({ ...form, locale: { ...form.locale, name: e.target.value } })}
                placeholder={t("resortFacility.namePlaceholder")}
                className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
              <Textarea value={form.locale.description}
                onChange={(e) => onFormChange({ ...form, locale: { ...form.locale, description: e.target.value } })}
                rows={2} className="text-sm resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("common.notes")}</Label>
              <Textarea value={form.locale.notes}
                onChange={(e) => onFormChange({ ...form, locale: { ...form.locale, notes: e.target.value } })}
                rows={2} className="text-sm resize-none" />
            </div>
          </div>
        )}

        {/* VIEW/EDIT — unified per-row Pencil/Trash → Check/X, no section-wide gate */}
        {mode !== "create" && (
          localesLoading && allLocaleRows.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : allLocaleRows.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Languages className="h-4 w-4 mr-2 opacity-40" />
              {t("locale.empty.basicInfo")}
            </div>
          ) : (
            <div className="divide-y">
              {allLocaleRows.map((row) => {
                const key = row._rkey
                const isNew = !!row._new
                const rowEditing = isRowEditing(key)
                const busy = isRowBusy(key)
                const editData = rowEditData[key] ?? row
                const usedIds = allLocaleRows
                  .filter((r) => r._rkey !== key)
                  .map((r) => r.locale?.id)
                  .filter((v): v is number => typeof v === "number")

                return (
                  <div key={key} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                        {!rowEditing && row.locale
                          ? `${row.locale.name} (${row.locale.code})`
                          : t("locale.row.label", { n: allLocaleRows.indexOf(row) + 1 })}
                        {isNew && (
                          <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                            {t("locale.row.new")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!rowEditing && (
                          <>
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7"
                              onClick={() => startEditRow(key, row)} disabled={busy}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {!isNew && (
                              <Button type="button" size="icon" variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => setPendingDeleteRow(row)} disabled={busy}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </>
                        )}
                        {rowEditing && (
                          <>
                            <Button type="button" size="icon" variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => cancelEditRow(key, isNew)} disabled={busy}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                            <Button type="button" size="icon" variant="ghost"
                              className="h-7 w-7 text-primary"
                              onClick={() => saveRow(key, row, isNew)} disabled={busy}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("field.language")} *</Label>
                        {isNew ? (
                          <Select value={editData.locale_id ? String(editData.locale_id) : ""}
                            onValueChange={(v) => patchRowEdit(key, { locale_id: Number(v) })}
                            disabled={!rowEditing}>
                            <SelectTrigger className="h-9 text-sm w-full">
                              <SelectValue placeholder={t("field.language")} />
                            </SelectTrigger>
                            <SelectContent>
                              {availableLocales.map((l) => (
                                <SelectItem key={l.id} value={String(l.id)} disabled={usedIds.includes(l.id)}>
                                  {l.name} ({l.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input value={row.locale ? `${row.locale.name} (${row.locale.code})` : ""} disabled className="h-9 text-sm" onChange={() => {}} />
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("field.sort")} *</Label>
                        <Input type="number" value={editData.sort_order}
                          onChange={(e) => patchRowEdit(key, { sort_order: Number(e.target.value) })}
                          disabled={!rowEditing} className="h-9 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{t("common.name")} *</Label>
                      <Input value={editData.name}
                        onChange={(e) => patchRowEdit(key, { name: e.target.value })}
                        placeholder={t("resortFacility.namePlaceholder")}
                        disabled={!rowEditing} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
                      <Textarea value={editData.description}
                        onChange={(e) => patchRowEdit(key, { description: e.target.value })}
                        disabled={!rowEditing} rows={2} className="text-sm resize-none" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{t("common.notes")}</Label>
                      <Textarea value={editData.notes}
                        onChange={(e) => patchRowEdit(key, { notes: e.target.value })}
                        disabled={!rowEditing} rows={2} className="text-sm resize-none" />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </Card>

      <AlertDialog open={!!pendingDeleteRow} onOpenChange={(o) => !o && setPendingDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resortFacility.deleteLocaleTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("resortFacility.deleteLocaleDesc")}</AlertDialogDescription>
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
