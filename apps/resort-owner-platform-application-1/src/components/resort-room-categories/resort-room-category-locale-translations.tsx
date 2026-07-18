"use client"

import { useState, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Check, Languages, Loader2, Pencil, Plus, Trash2, X } from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Button, Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea,
} from "@resort/shadcn-ui"
import { resortRoomCategoriesService } from "@/services/resort-room-categories"
import type { Locale } from "@/services/locales"
import { toast } from "sonner"
import type { ResortRoomCategoryDialogMode, ResortRoomCategoryFormState, LocaleRow } from "./types"

type NewLocaleRow = LocaleRow & { _rkey: string }

export interface ResortRoomCategoryLocaleTranslationsProps {
  resortId: number
  mode: ResortRoomCategoryDialogMode
  form: ResortRoomCategoryFormState
  onFormChange: (form: ResortRoomCategoryFormState) => void
  resortRoomCategoryId?: number
  availableLocales: Locale[]
  onSaved?: () => void | Promise<void>
  editing: boolean
  onEditingChange: (v: boolean) => void
  open: boolean
}

export function ResortRoomCategoryLocaleTranslations({
  resortId, mode, form, onFormChange, resortRoomCategoryId, availableLocales,
  onSaved, editing, onEditingChange, open,
}: ResortRoomCategoryLocaleTranslationsProps) {
  const { t } = useTranslation()
  const [newLocaleRows, setNewLocaleRows] = useState<NewLocaleRow[]>([])
  const [rowEditData, setRowEditData] = useState<Record<string, LocaleRow>>({})
  const [busyRowKeys, setBusyRowKeys] = useState<Set<string>>(new Set())
  const [createEditingIdxs, setCreateEditingIdxs] = useState<Set<number>>(new Set())
  const [editingExistingId, setEditingExistingId] = useState<number | null>(null)
  const [existingEditData, setExistingEditData] = useState<{ name: string; description: string; sort_order: number } | null>(null)
  const [savingExisting, setSavingExisting] = useState(false)
  const [deleteLocaleTarget, setDeleteLocaleTarget] = useState<number | null>(null)
  const rKeyCounter = useRef(0)
  const prevRoomCategoryIdRef = useRef<number | "">(form.room_category_id)

  useEffect(() => {
    if (!open) {
      setNewLocaleRows([])
      setRowEditData({})
      setBusyRowKeys(new Set())
      setCreateEditingIdxs(new Set())
      setEditingExistingId(null)
      setExistingEditData(null)
      setSavingExisting(false)
      setDeleteLocaleTarget(null)
      prevRoomCategoryIdRef.current = ""
    }
  }, [open])

  // Reset per-row editing when the platform category changes
  useEffect(() => {
    if (form.room_category_id !== prevRoomCategoryIdRef.current) {
      prevRoomCategoryIdRef.current = form.room_category_id
      setCreateEditingIdxs(new Set())
    }
  }, [form.room_category_id])

  const noPlatformSelected = mode === "create" && !form.room_category_id

  function isRowBusy(key: string) { return busyRowKeys.has(key) }

  function cancelEditRow(key: string) {
    setRowEditData((prev) => { const n = { ...prev }; delete n[key]; return n })
    setNewLocaleRows((prev) => {
      const next = prev.filter((r) => r._rkey !== key)
      if (next.length === 0) onEditingChange(false)
      return next
    })
  }
  function patchRowEdit(key: string, patch: Partial<LocaleRow>) {
    setRowEditData((prev) => prev[key] ? { ...prev, [key]: { ...prev[key], ...patch } } : prev)
  }
  function setBusy(key: string, busy: boolean) {
    setBusyRowKeys((prev) => { const n = new Set(prev); busy ? n.add(key) : n.delete(key); return n })
  }

  function startEditExisting(row: LocaleRow) {
    setEditingExistingId(row.id!)
    setExistingEditData({ name: row.name, description: row.description ?? "", sort_order: row.sort_order })
    onEditingChange(true)
  }

  function cancelEditExisting() {
    setEditingExistingId(null)
    setExistingEditData(null)
    if (newLocaleRows.length === 0) onEditingChange(false)
  }

  async function saveEditExisting(rowId: number) {
    if (!existingEditData || resortRoomCategoryId == null) return
    if (!existingEditData.name.trim()) { toast.error(t("locale.errName", { n: 1 })); return }
    setSavingExisting(true)
    try {
      await resortRoomCategoriesService.updateLocale(resortId, resortRoomCategoryId, rowId, {
        name: existingEditData.name.trim(),
        description: existingEditData.description.trim() || undefined,
        sort_order: existingEditData.sort_order,
      })
      toast.success(t("common.saved"))
      setEditingExistingId(null)
      setExistingEditData(null)
      if (newLocaleRows.length === 0) onEditingChange(false)
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSavingExisting(false)
    }
  }

  async function confirmDeleteLocale() {
    if (deleteLocaleTarget == null || resortRoomCategoryId == null) return
    try {
      await resortRoomCategoriesService.removeLocale(resortId, resortRoomCategoryId, deleteLocaleTarget)
      toast.success(t("locale.removedToast"))
      setDeleteLocaleTarget(null)
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function saveRow(key: string, row: LocaleRow) {
    if (resortRoomCategoryId == null) return
    const data = rowEditData[key]
    if (!data) return
    if (!data.locale_id) { toast.error(t("locale.errLang", { n: 1 })); return }
    if (!data.name.trim()) { toast.error(t("locale.errName", { n: 1 })); return }
    setBusy(key, true)
    try {
      await resortRoomCategoriesService.addLocale(resortId, resortRoomCategoryId, {
        locale_id: Number(data.locale_id),
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        sort_order: Number(data.sort_order) || 0,
      })
      setNewLocaleRows((prev) => {
        const next = prev.filter((r) => r._rkey !== key)
        if (next.length === 0) onEditingChange(false)
        return next
      })
      setRowEditData((prev) => { const n = { ...prev }; delete n[key]; return n })
      toast.success(t("common.saved"))
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(key, false)
    }
  }

  function addNewLocaleRow() {
    const usedIds = new Set([
      ...form.locales.map((r) => r.locale_id),
      ...newLocaleRows.map((r) => r.locale_id),
    ].filter((v): v is number => typeof v === "number"))
    const nextLocale = availableLocales.find((l) => !usedIds.has(l.id))
    const _rkey = `n_${rKeyCounter.current++}`
    const newRow: NewLocaleRow = {
      _rkey, locale_id: nextLocale?.id ?? "", name: "", description: "",
      sort_order: form.locales.length + newLocaleRows.length + 1, _new: true,
    }
    setNewLocaleRows((prev) => [...prev, newRow])
    setRowEditData((prev) => ({ ...prev, [_rkey]: { ...newRow } }))
    onEditingChange(true)
  }

  function addLocaleRow() {
    const usedIds = new Set(
      form.locales.map((r) => r.locale_id).filter((v): v is number => typeof v === "number"),
    )
    const nextLocale = availableLocales.find((l) => !usedIds.has(l.id))
    onFormChange({
      ...form,
      locales: [
        ...form.locales,
        { locale_id: nextLocale ? nextLocale.id : "", name: "", description: "", sort_order: form.locales.length + 1, _new: true },
      ],
    })
  }

  function updateLocaleRow(idx: number, patch: Partial<LocaleRow>) {
    onFormChange({ ...form, locales: form.locales.map((r, i) => (i === idx ? { ...r, ...patch } : r)) })
  }

  function removeLocaleRow(idx: number) {
    onFormChange({ ...form, locales: form.locales.filter((_, i) => i !== idx) })
  }

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
          <Button type="button" size="sm" variant="outline" onClick={addNewLocaleRow}
            disabled={(form.locales.length + newLocaleRows.length) >= availableLocales.length}
            className="h-7 text-xs px-2.5"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> {t("locale.add")}
          </Button>
        )}
        {mode === "create" && (
          <Button type="button" size="sm" variant="outline" onClick={addLocaleRow}
            disabled={noPlatformSelected || form.locales.length >= availableLocales.length}
            className="h-7 text-xs px-2.5"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> {t("locale.add")}
          </Button>
        )}
      </div>

      <Card className="gap-0 py-0 overflow-hidden">
        {/* VIEW mode — existing rows always read-only; new rows inline below */}
        {mode !== "create" && (
          form.locales.length === 0 && newLocaleRows.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Languages className="h-4 w-4 mr-2 opacity-40" />
              {t("locale.empty.basicInfo")}
            </div>
          ) : (
            <div className="divide-y">
              {/* Existing rows — read-only with edit / delete */}
              {form.locales.map((row, idx) => {
                const localeMeta = availableLocales.find((l) => l.id === row.locale_id)
                const isEditingThis = editingExistingId === row.id

                if (isEditingThis && existingEditData) {
                  return (
                    <div key={`e_${row.id}`} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                          {localeMeta ? `${localeMeta.name} (${localeMeta.code})` : t("locale.row.label", { n: idx + 1 })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button type="button" size="icon" variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={cancelEditExisting} disabled={savingExisting}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                          <Button type="button" size="icon" variant="ghost"
                            className="h-7 w-7 text-primary"
                            onClick={() => saveEditExisting(row.id!)} disabled={savingExisting}>
                            {savingExisting
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Check className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">{t("field.language")}</Label>
                          <Select value={row.locale_id ? String(row.locale_id) : ""} disabled>
                            <SelectTrigger className="h-9 text-sm w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {availableLocales.map((l) => (
                                <SelectItem key={l.id} value={String(l.id)}>{l.name} ({l.code})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">{t("field.sort")} *</Label>
                          <Input type="number" value={existingEditData.sort_order}
                            onChange={(e) => setExistingEditData((prev) => prev ? { ...prev, sort_order: Number(e.target.value) } : prev)}
                            className="h-9 text-sm" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("common.name")} *</Label>
                        <Input value={existingEditData.name}
                          onChange={(e) => setExistingEditData((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                          placeholder={t("resortRoomCategory.namePlaceholder")}
                          className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
                        <Textarea value={existingEditData.description}
                          onChange={(e) => setExistingEditData((prev) => prev ? { ...prev, description: e.target.value } : prev)}
                          rows={2} className="text-sm resize-none" />
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={`e_${row.id}`} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                        {localeMeta ? `${localeMeta.name} (${localeMeta.code})` : t("locale.row.label", { n: idx + 1 })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button type="button" size="icon" variant="ghost" className="h-7 w-7"
                          onClick={() => startEditExisting(row)} disabled={editingExistingId !== null}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteLocaleTarget(row.id!)} disabled={editingExistingId !== null}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("field.language")}</Label>
                        <Select value={row.locale_id ? String(row.locale_id) : ""} disabled>
                          <SelectTrigger className="h-9 text-sm w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {availableLocales.map((l) => (
                              <SelectItem key={l.id} value={String(l.id)}>{l.name} ({l.code})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("field.sort")}</Label>
                        <Input type="number" value={row.sort_order} disabled className="h-9 text-sm" onChange={() => {}} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{t("common.name")}</Label>
                      <Input value={row.name} disabled className="h-9 text-sm" onChange={() => {}} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
                      <Textarea value={row.description ?? ""} disabled rows={2} className="text-sm resize-none" onChange={() => {}} />
                    </div>
                  </div>
                )
              })}
              {/* New locale rows — editable inline */}
              {newLocaleRows.map((row) => {
                const key = row._rkey
                const busy = isRowBusy(key)
                const editData = rowEditData[key] ?? row
                const usedIds = [
                  ...form.locales.map((r) => r.locale_id),
                  ...newLocaleRows.filter((r) => r._rkey !== key).map((r) => r.locale_id),
                ].filter((v): v is number => typeof v === "number")
                return (
                  <div key={key} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                        {t("locale.row.label", { n: form.locales.length + newLocaleRows.indexOf(row) + 1 })}
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                          {t("locale.row.new")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button type="button" size="icon" variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => cancelEditRow(key)} disabled={busy}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost"
                          className="h-7 w-7 text-primary"
                          onClick={() => saveRow(key, row)} disabled={busy}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("field.language")} *</Label>
                        <Select value={editData.locale_id ? String(editData.locale_id) : ""}
                          onValueChange={(v) => patchRowEdit(key, { locale_id: Number(v) })}>
                          <SelectTrigger className="h-9 text-sm w-full"><SelectValue placeholder={t("field.language")} /></SelectTrigger>
                          <SelectContent>
                            {availableLocales.map((l) => (
                              <SelectItem key={l.id} value={String(l.id)} disabled={usedIds.includes(l.id)}>
                                {l.name} ({l.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("field.sort")} *</Label>
                        <Input type="number" value={editData.sort_order}
                          onChange={(e) => patchRowEdit(key, { sort_order: Number(e.target.value) })}
                          className="h-9 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{t("common.name")} *</Label>
                      <Input value={editData.name}
                        onChange={(e) => patchRowEdit(key, { name: e.target.value })}
                        placeholder={t("resortRoomCategory.namePlaceholder")}
                        className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
                      <Textarea value={editData.description}
                        onChange={(e) => patchRowEdit(key, { description: e.target.value })}
                        rows={2} className="text-sm resize-none" />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* CREATE mode */}
        {mode === "create" && (
          form.locales.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Languages className="h-4 w-4 mr-2 opacity-40" />
              {t("locale.empty.basicInfo")}
            </div>
          ) : (
            <div className="divide-y">
              {form.locales.map((row, idx) => {
                const usedIds = form.locales.map((r, i) => i !== idx ? r.locale_id : null).filter((v): v is number => typeof v === "number")
                const localeMeta = availableLocales.find((l) => l.id === row.locale_id)
                // Rows with a name are shown as view cards; blank rows (manually added) open in edit mode
                const isEditingRow = !row.name.trim() || createEditingIdxs.has(idx)

                if (!isEditingRow) {
                  return (
                    <div key={idx} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                          {localeMeta ? `${localeMeta.name} (${localeMeta.code})` : t("locale.row.label", { n: idx + 1 })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button type="button" size="icon" variant="ghost" className="h-7 w-7"
                            onClick={() => setCreateEditingIdxs((prev) => new Set([...prev, idx]))}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button type="button" size="icon" variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => removeLocaleRow(idx)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("common.name")}</Label>
                        <Input value={row.name} disabled className="h-9 text-sm" onChange={() => {}} />
                      </div>
                      {row.description && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
                          <Textarea value={row.description} disabled rows={2} className="text-sm resize-none" onChange={() => {}} />
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <div key={idx} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                        {localeMeta ? `${localeMeta.name} (${localeMeta.code})` : t("locale.row.label", { n: idx + 1 })}
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">{t("locale.row.new")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {row.name.trim() && (
                          <Button type="button" size="icon" variant="ghost" className="h-7 w-7"
                            onClick={() => setCreateEditingIdxs((prev) => { const n = new Set(prev); n.delete(idx); return n })}>
                            <Check className="h-3.5 w-3.5 text-primary" />
                          </Button>
                        )}
                        <Button type="button" size="icon" variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeLocaleRow(idx)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("field.language")} *</Label>
                        <Select value={row.locale_id ? String(row.locale_id) : ""} disabled>
                          <SelectTrigger className="h-9 text-sm w-full"><SelectValue placeholder={t("field.language")} /></SelectTrigger>
                          <SelectContent>
                            {availableLocales.map((l) => (
                              <SelectItem key={l.id} value={String(l.id)} disabled={usedIds.includes(l.id)}>
                                {l.name} ({l.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("field.sort")} *</Label>
                        <Input type="number" value={row.sort_order}
                          onChange={(e) => updateLocaleRow(idx, { sort_order: Number(e.target.value) })}
                          disabled={noPlatformSelected}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{t("common.name")} *</Label>
                      <Input value={row.name} onChange={(e) => updateLocaleRow(idx, { name: e.target.value })}
                        placeholder={t("resortRoomCategory.namePlaceholder")} disabled={noPlatformSelected} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
                      <Textarea value={row.description} onChange={(e) => updateLocaleRow(idx, { description: e.target.value })}
                        disabled={noPlatformSelected} rows={2} className="text-sm resize-none" />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

      </Card>

      <AlertDialog open={deleteLocaleTarget !== null} onOpenChange={(o) => !o && setDeleteLocaleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resortRoomCategory.deleteLocaleTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("resortRoomCategory.deleteLocaleDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteLocale}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
