import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Languages, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@resort/shadcn-ui";
import { Card } from "@resort/shadcn-ui";
import { Input } from "@resort/shadcn-ui";
import { Label } from "@resort/shadcn-ui";
import { Textarea } from "@resort/shadcn-ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@resort/shadcn-ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@resort/shadcn-ui";
import { citiesService } from "@/services/cities";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import type { CityDialogMode, CityFormState, CityLocaleRow } from "./types";

type NewLocaleRow = CityLocaleRow & { _rkey: string };

export interface CityLocaleTranslationsProps {
  mode: CityDialogMode;
  form: CityFormState;
  onFormChange: (form: CityFormState) => void;
  cityId?: number;
  availableLocales: Locale[];
  onSaved?: () => void | Promise<void>;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  open: boolean;
}

export function CityLocaleTranslations({
  mode,
  form,
  onFormChange,
  cityId,
  availableLocales,
  onSaved,
  editing,
  onEditingChange,
  open,
}: CityLocaleTranslationsProps) {
  const { t } = useTranslation();
  const [newLocaleRows, setNewLocaleRows] = useState<NewLocaleRow[]>([]);
  const [rowEditData, setRowEditData] = useState<Record<string, CityLocaleRow>>({});
  const [busyRowKeys, setBusyRowKeys] = useState<Set<string>>(new Set());
  const [pendingDeleteRow, setPendingDeleteRow] = useState<CityLocaleRow | null>(null);
  const rKeyCounter = useRef(0);

  useEffect(() => {
    if (!open) {
      setNewLocaleRows([]);
      setRowEditData({});
      setBusyRowKeys(new Set());
    }
  }, [open]);

  function rowKey(row: CityLocaleRow): string {
    return row.id != null ? `e_${row.id}` : (row as NewLocaleRow)._rkey ?? "";
  }

  function isRowEditing(key: string) { return key in rowEditData; }
  function isRowBusy(key: string) { return busyRowKeys.has(key); }

  function startEditRow(key: string, row: CityLocaleRow) {
    setRowEditData((prev) => ({ ...prev, [key]: { ...row } }));
  }

  function cancelEditRow(key: string, isNew: boolean) {
    setRowEditData((prev) => { const n = { ...prev }; delete n[key]; return n; });
    if (isNew) setNewLocaleRows((prev) => prev.filter((r) => r._rkey !== key));
  }

  function patchRowEdit(key: string, patch: Partial<CityLocaleRow>) {
    setRowEditData((prev) => prev[key] ? { ...prev, [key]: { ...prev[key], ...patch } } : prev);
  }

  function setBusy(key: string, busy: boolean) {
    setBusyRowKeys((prev) => {
      const n = new Set(prev);
      busy ? n.add(key) : n.delete(key);
      return n;
    });
  }

  async function saveRow(key: string, row: CityLocaleRow, isNew: boolean) {
    if (cityId == null) return;
    const data = rowEditData[key];
    if (!data) return;
    if (!data.locale_id) { toast.error(t("toast.localeSelectLang", { n: 1 })); return; }
    if (!data.name.trim()) { toast.error(t("toast.localeNameRequired", { n: 1 })); return; }
    setBusy(key, true);
    try {
      if (isNew) {
        await citiesService.addLocale(cityId, {
          locale_id: Number(data.locale_id),
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          sort_order: Number(data.sort_order) || 0,
        });
        setNewLocaleRows((prev) => prev.filter((r) => r._rkey !== key));
      } else {
        await citiesService.updateLocale(cityId, row.id!, {
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          sort_order: Number(data.sort_order) || 0,
        });
      }
      setRowEditData((prev) => { const n = { ...prev }; delete n[key]; return n; });
      toast.success(t("common.saved"));
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(key, false);
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteRow || cityId == null || !pendingDeleteRow.id) return;
    const row = pendingDeleteRow;
    const key = rowKey(row);
    setPendingDeleteRow(null);
    setBusy(key, true);
    try {
      await citiesService.removeLocale(cityId, row.id);
      toast.success(t("locale.removedToast"));
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(key, false);
    }
  }

  function cancelEditing() {
    setNewLocaleRows([]);
    setRowEditData({});
    onEditingChange(false);
  }

  function addNewLocaleRow() {
    const usedIds = new Set([
      ...form.locales.map((r) => r.locale_id),
      ...newLocaleRows.map((r) => r.locale_id),
    ].filter((v): v is number => typeof v === "number"));
    const nextLocale = availableLocales.find((l) => !usedIds.has(l.id));
    const _rkey = `n_${rKeyCounter.current++}`;
    const newRow: NewLocaleRow = {
      _rkey,
      locale_id: nextLocale?.id ?? "",
      name: "",
      description: "",
      sort_order: form.locales.length + newLocaleRows.length + 1,
      _new: true,
    };
    setNewLocaleRows((prev) => [...prev, newRow]);
    setRowEditData((prev) => ({ ...prev, [_rkey]: { ...newRow } }));
  }

  function addLocaleRow() {
    const usedIds = new Set(
      form.locales.map((r) => r.locale_id).filter((v): v is number => typeof v === "number"),
    );
    const nextLocale = availableLocales.find((l) => !usedIds.has(l.id));
    onFormChange({
      ...form,
      locales: [
        ...form.locales,
        { locale_id: nextLocale ? nextLocale.id : "", name: "", description: "", sort_order: form.locales.length + 1, _new: true },
      ],
    });
  }

  function updateLocaleRow(idx: number, patch: Partial<CityLocaleRow>) {
    onFormChange({ ...form, locales: form.locales.map((row, i) => (i === idx ? { ...row, ...patch } : row)) });
  }

  function removeLocaleRow(idx: number) {
    onFormChange({ ...form, locales: form.locales.filter((_, i) => i !== idx) });
  }

  const allLocaleRows: Array<CityLocaleRow & { _rkey: string }> = [
    ...form.locales.map((l) => ({ ...l, _rkey: `e_${l.id}` })),
    ...newLocaleRows,
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("locale.translations")}
          </h3>
        </div>
        {mode !== "create" && !editing && (
          <Button type="button" size="sm" variant="outline" onClick={() => onEditingChange(true)} className="h-7 text-xs px-2.5 gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
          </Button>
        )}
        {editing && (
          <div className="flex items-center gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={cancelEditing} className="h-7 text-xs px-2.5 gap-1.5">
              <X className="h-3.5 w-3.5" /> {t("common.cancel")}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={addNewLocaleRow}
              disabled={(form.locales.length + newLocaleRows.length) >= availableLocales.length}
              className="h-7 text-xs px-2.5"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> {t("locale.add")}
            </Button>
          </div>
        )}
        {mode === "create" && (
          <Button type="button" size="sm" variant="outline" onClick={addLocaleRow}
            disabled={form.locales.length >= availableLocales.length}
            className="h-7 text-xs px-2.5"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> {t("locale.add")}
          </Button>
        )}
      </div>

      <Card className="gap-0 py-0 overflow-hidden">
        {/* VIEW mode */}
        {!editing && mode !== "create" && (
          form.locales.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Languages className="h-4 w-4 mr-2 opacity-40" />
              {t("locale.empty.city")}
            </div>
          ) : (
            <div className="divide-y">
              {form.locales.map((row, idx) => {
                const localeMeta = availableLocales.find((l) => l.id === row.locale_id);
                return (
                  <div key={`e_${row.id}`} className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                      {localeMeta ? `${localeMeta.name} (${localeMeta.code})` : t("locale.row.label", { n: idx + 1 })}
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("field.language")}</Label>
                        <Select value={row.locale_id ? String(row.locale_id) : ""} disabled>
                          <SelectTrigger className="h-9 text-sm w-full">
                            <SelectValue placeholder={t("placeholder.selectLanguage")} />
                          </SelectTrigger>
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
                      <Input value={row.name} disabled placeholder={t("placeholder.cityName")} className="h-9 text-sm" onChange={() => {}} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
                      <Textarea value={row.description} disabled placeholder={t("placeholder.cityDescription")} rows={2} className="text-sm resize-none" onChange={() => {}} />
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* CREATE mode */}
        {mode === "create" && (
          form.locales.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Languages className="h-4 w-4 mr-2 opacity-40" />
              {t("locale.empty.create")}
            </div>
          ) : (
            <div className="divide-y">
              {form.locales.map((row, idx) => {
                const usedIds = form.locales.map((r, i) => i !== idx ? r.locale_id : null).filter((v): v is number => typeof v === "number");
                return (
                  <div key={idx} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                        {t("locale.row.label", { n: idx + 1 })}
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">{t("locale.row.new")}</span>
                      </div>
                      <Button type="button" size="icon" variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeLocaleRow(idx)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("field.language")} *</Label>
                        <Select
                          value={row.locale_id ? String(row.locale_id) : ""}
                          onValueChange={(v) => updateLocaleRow(idx, { locale_id: Number(v) })}
                        >
                          <SelectTrigger className="h-9 text-sm w-full">
                            <SelectValue placeholder={t("placeholder.selectLanguage")} />
                          </SelectTrigger>
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
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{t("common.name")} *</Label>
                      <Input value={row.name}
                        onChange={(e) => updateLocaleRow(idx, { name: e.target.value })}
                        placeholder={t("placeholder.cityName")}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
                      <Textarea value={row.description}
                        onChange={(e) => updateLocaleRow(idx, { description: e.target.value })}
                        placeholder={t("placeholder.cityDescription")}
                        rows={2}
                        className="text-sm resize-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* EDIT mode */}
        {editing && (
          allLocaleRows.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Languages className="h-4 w-4 mr-2 opacity-40" />
              {t("locale.empty.city")}
            </div>
          ) : (
            <div className="divide-y">
              {allLocaleRows.map((row) => {
                const key = row._rkey;
                const isNew = !!row._new;
                const rowEditing = isRowEditing(key);
                const busy = isRowBusy(key);
                const editData = rowEditData[key] ?? row;
                const localeMeta = availableLocales.find((l) => l.id === row.locale_id);
                const usedIds = allLocaleRows
                  .filter((r) => r._rkey !== key)
                  .map((r) => r.locale_id)
                  .filter((v): v is number => typeof v === "number");

                return (
                  <div key={key} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                        {!rowEditing && localeMeta
                          ? `${localeMeta.name} (${localeMeta.code})`
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
                            <Button type="button" size="icon" variant="ghost"
                              className="h-7 w-7"
                              onClick={() => startEditRow(key, row)}
                              disabled={busy}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {!isNew && (
                              <Button type="button" size="icon" variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => setPendingDeleteRow(row)}
                                disabled={busy}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </>
                        )}
                        {rowEditing && (
                          <>
                            <Button type="button" size="icon" variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => cancelEditRow(key, isNew)}
                              disabled={busy}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                            <Button type="button" size="icon" variant="ghost"
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

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("field.language")} *</Label>
                        <Select
                          value={editData.locale_id ? String(editData.locale_id) : ""}
                          onValueChange={(v) => patchRowEdit(key, { locale_id: Number(v) })}
                          disabled={!rowEditing || !isNew}
                        >
                          <SelectTrigger className="h-9 text-sm w-full">
                            <SelectValue placeholder={t("placeholder.selectLanguage")} />
                          </SelectTrigger>
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
                        <Input type="number"
                          value={editData.sort_order}
                          onChange={(e) => patchRowEdit(key, { sort_order: Number(e.target.value) })}
                          disabled={!rowEditing}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{t("common.name")} *</Label>
                      <Input
                        value={editData.name}
                        onChange={(e) => patchRowEdit(key, { name: e.target.value })}
                        placeholder={t("placeholder.cityName")}
                        disabled={!rowEditing}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
                      <Textarea
                        value={editData.description}
                        onChange={(e) => patchRowEdit(key, { description: e.target.value })}
                        placeholder={t("placeholder.cityDescription")}
                        disabled={!rowEditing}
                        rows={2}
                        className="text-sm resize-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </Card>

      <AlertDialog open={!!pendingDeleteRow} onOpenChange={(o) => !o && setPendingDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("locale.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("locale.delete.desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
