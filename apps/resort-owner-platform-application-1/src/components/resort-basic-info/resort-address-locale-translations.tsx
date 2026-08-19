"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, Languages, Pencil, Plus, Trash2, X } from "lucide-react"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Textarea,
} from "@resort/shadcn-ui"
import { resortAddressService, type ResortAddressLocale } from "@/services/resort-address"
import { TypographyLabel } from "@/components/shared/typography"
import type { Locale } from "@/services/locales"
import { canAddLocaleTranslation } from "@/lib/locale"
import { toast } from "sonner"

interface RowState {
  id?: number
  locale_id: number | ""
  address: string
  sort_order: number
  _new?: boolean
}

type RowWithKey = RowState & { _rkey: string }

export interface ResortAddressLocaleTranslationsProps {
  resortId: number
  availableLocales: Locale[]
  totalLocaleCount: number | null
  reloadToken?: number
}

function toRow(l: ResortAddressLocale): RowState {
  return {
    id: l.id,
    locale_id: l.locale.id,
    address: l.address,
    sort_order: l.sort_order,
  }
}

export function ResortAddressLocaleTranslations({
  resortId,
  availableLocales,
  totalLocaleCount,
  reloadToken,
}: ResortAddressLocaleTranslationsProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<RowState[]>([])
  const [newRows, setNewRows] = useState<RowWithKey[]>([])
  const [rowEditData, setRowEditData] = useState<Record<string, RowState>>({})
  const [busyRowKeys, setBusyRowKeys] = useState<Set<string>>(new Set())
  const rKeyCounter = useRef(0)

  async function load() {
    setLoading(true)
    try {
      const res = await resortAddressService.listLocales(resortId, { size: 50 })
      setRows(res.data.map(toRow))
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resortId, reloadToken])

  function isRowEditing(key: string) { return key in rowEditData }
  function isRowBusy(key: string) { return busyRowKeys.has(key) }

  function startEditRow(key: string, row: RowState) {
    setRowEditData((prev) => ({ ...prev, [key]: { ...row } }))
  }

  function cancelEditRow(key: string, isNew: boolean) {
    setRowEditData((prev) => { const n = { ...prev }; delete n[key]; return n })
    if (isNew) setNewRows((prev) => prev.filter((r) => r._rkey !== key))
  }

  function patchRowEdit(key: string, patch: Partial<RowState>) {
    setRowEditData((prev) =>
      prev[key] ? { ...prev, [key]: { ...prev[key], ...patch } } : prev,
    )
  }

  function setBusy(key: string, busy: boolean) {
    setBusyRowKeys((prev) => {
      const n = new Set(prev)
      busy ? n.add(key) : n.delete(key)
      return n
    })
  }

  const addDisabled = !canAddLocaleTranslation(rows.length + newRows.length, totalLocaleCount)

  const allRows: RowWithKey[] = [
    ...newRows,
    ...rows.map((r) => ({ ...r, _rkey: `e_${r.id}` })),
  ]

  async function saveRow(key: string, row: RowState, isNew: boolean) {
    const data = rowEditData[key]
    if (!data) return
    const n = allRows.findIndex((r) => r._rkey === key) + 1
    if (!data.locale_id) { toast.error(t("locale.errLang", { n })); return }
    if (!data.address.trim()) { toast.error(t("locale.errAddress", { n })); return }
    setBusy(key, true)
    try {
      if (isNew) {
        await resortAddressService.addLocale(resortId, {
          locale_id: Number(data.locale_id),
          address: data.address.trim(),
          sort_order: Number(data.sort_order) || 0,
        })
        setNewRows((prev) => prev.filter((r) => r._rkey !== key))
      } else {
        await resortAddressService.updateLocale(resortId, row.id!, {
          address: data.address.trim(),
          sort_order: Number(data.sort_order) || 0,
        })
      }
      setRowEditData((prev) => { const n = { ...prev }; delete n[key]; return n })
      toast.success(t("common.saved"))
      await load()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(key, false)
    }
  }

  async function deleteRow(row: RowState) {
    if (!row.id) return
    const key = `e_${row.id}`
    setBusy(key, true)
    try {
      await resortAddressService.removeLocale(resortId, row.id)
      toast.success(t("locale.removedToast"))
      await load()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(key, false)
    }
  }

  function addNewRow() {
    const usedIds = new Set(
      [...rows.map((r) => r.locale_id), ...newRows.map((r) => r.locale_id)].filter(
        (v): v is number => typeof v === "number",
      ),
    )
    const nextLocale = availableLocales.find((l) => !usedIds.has(l.id))
    const _rkey = `n_${rKeyCounter.current++}`
    const newRow: RowWithKey = {
      _rkey,
      locale_id: nextLocale?.id ?? "",
      address: "",
      sort_order: rows.length + newRows.length + 1,
      _new: true,
    }
    setNewRows((prev) => [...prev, newRow])
    setRowEditData((prev) => ({ ...prev, [_rkey]: { ...newRow } }))
  }

  return (
    <Card className="shadow-none border-0 bg-transparent ring-0 gap-0 py-0 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b px-0 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Languages className="h-4 w-4" />
          </div>
          <CardTitle className="text-lg">{t("locale.translations")}</CardTitle>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addNewRow}
          disabled={addDisabled}
          className="h-7 text-xs px-2.5"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> {t("locale.addShort")}
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner className="size-5" />
          </div>
        ) : allRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted">
              <Languages className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <p className="text-sm text-muted-foreground max-w-56">{t("locale.empty.address")}</p>
            <Button type="button" size="sm" onClick={addNewRow} disabled={addDisabled} className="h-7 text-xs px-2.5 gap-1.5">
              <Plus className="h-3.5 w-3.5" /> {t("locale.addShort")}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 py-4">
            {allRows.map((row) => {
              const key = row._rkey
              const isNew = !!row._new
              const rowEditing = isRowEditing(key)
              const busy = isRowBusy(key)
              const editData = rowEditData[key] ?? row
              const localeMeta = availableLocales.find((l) => l.id === row.locale_id)
              const usedIds = allRows
                .filter((r) => r._rkey !== key)
                .map((r) => r.locale_id)
                .filter((v): v is number => typeof v === "number")

              return (
                <div
                  key={key}
                  className={`group relative rounded-xl border p-4 transition-colors ${
                    rowEditing
                      ? "border-primary/40 bg-primary/3"
                      : "hover:border-primary/30 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/25 to-primary/5 text-[11px] font-bold uppercase text-primary">
                        {localeMeta?.code ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <TypographyLabel className="block truncate">
                          {!rowEditing && localeMeta
                            ? localeMeta.name
                            : t("locale.row.label", { n: allRows.indexOf(row) + 1 })}
                        </TypographyLabel>
                        {isNew && (
                          <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                            {t("locale.row.new")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-0.5 shrink-0 transition-opacity ${
                        rowEditing ? "" : "opacity-70 group-hover:opacity-100"
                      }`}
                    >
                      {!rowEditing && (
                        <>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => startEditRow(key, row)}
                            disabled={busy}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {!isNew && (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteRow(row)}
                              disabled={busy}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                      {rowEditing && (
                        <>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => cancelEditRow(key, isNew)}
                            disabled={busy}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-primary"
                            onClick={() => saveRow(key, row, isNew)}
                            disabled={busy}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {!rowEditing ? (
                    <p className="mt-3 text-base font-medium leading-snug">{row.address}</p>
                  ) : (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {t("field.language")} *
                        </Label>
                        <Select
                          value={editData.locale_id ? String(editData.locale_id) : ""}
                          onValueChange={(v) => patchRowEdit(key, { locale_id: Number(v) })}
                          disabled={!isNew}
                        >
                          <SelectTrigger className="h-9 text-sm w-full">
                            <SelectValue placeholder={t("resort.cityPlaceholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableLocales.map((l) => (
                              <SelectItem
                                key={l.id}
                                value={String(l.id)}
                                disabled={usedIds.includes(l.id)}
                              >
                                {l.name} ({l.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {t("field.sort")} *
                        </Label>
                        <Input
                          type="number"
                          value={editData.sort_order}
                          onChange={(e) => patchRowEdit(key, { sort_order: Number(e.target.value) })}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {t("resort.address")} *
                        </Label>
                        <Textarea
                          value={editData.address}
                          onChange={(e) => patchRowEdit(key, { address: e.target.value })}
                          rows={2}
                          className="text-sm resize-none"
                          placeholder={t("resort.addressPlaceholder")}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
