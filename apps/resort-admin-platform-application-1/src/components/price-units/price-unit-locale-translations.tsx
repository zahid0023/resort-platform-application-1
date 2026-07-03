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
import { priceUnitsService } from "@/services/price-units";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import type { PriceUnitDialogMode, PriceUnitFormState, LocaleRow } from "./types";

type NewLocaleRow = LocaleRow & { _rkey: string };

export interface PriceUnitLocaleTranslationsProps {
  mode: PriceUnitDialogMode;
  form: PriceUnitFormState;
  onFormChange: (form: PriceUnitFormState) => void;
  priceUnitId?: number;
  availableLocales: Locale[];
  onSaved?: () => void | Promise<void>;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  open: boolean;
}

export function PriceUnitLocaleTranslations({
  mode,
  form,
  onFormChange,
  priceUnitId,
  availableLocales,
  onSaved,
  editing,
  onEditingChange,
  open,
}: PriceUnitLocaleTranslationsProps) {
  const { t } = useTranslation();
  const [newLocaleRows, setNewLocaleRows] = useState<NewLocaleRow[]>([]);
  const [rowEditData, setRowEditData] = useState<Record<string, LocaleRow>>({});
  const [busyRowKeys, setBusyRowKeys] = useState<Set<string>>(new Set());
  const [pendingDeleteRow, setPendingDeleteRow] = useState<LocaleRow | null>(null);
  const rKeyCounter = useRef(0);

  useEffect(() => {
    if (!open) {
      setNewLocaleRows([]);
      setRowEditData({});
      setBusyRowKeys(new Set());
    }
  }, [open]);

  function rowKey(row: LocaleRow): string {
    return row.id != null ? `e_${row.id}` : (row as NewLocaleRow)._rkey ?? "";
  }

  function isRowEditing(key: string) { return key in rowEditData; }
  function isRowBusy(key: string) { return busyRowKeys.has(key); }

  function startEditRow(key: string, row: LocaleRow) {
    setRowEditData((prev) => ({ ...prev, [key]: { ...row } }));
  }

  function cancelEditRow(key: string, isNew: boolean) {
    setRowEditData((prev) => { const n = { ...prev }; delete n[key]; return n; });
    if (isNew) setNewLocaleRows((prev) => prev.filter((r) => r._rkey !== key));
  }

  function patchRowEdit(key: string, patch: Partial<LocaleRow>) {
    setRowEditData((prev) => prev[key] ? { ...prev, [key]: { ...prev[key], ...patch } } : prev);
  }

  function setBusy(key: string, busy: boolean) {
    setBusyRowKeys((prev) => {
      const n = new Set(prev);
      busy ? n.add(key) : n.delete(key);
      return n;
    });
  }

  async function saveRow(key: string, row: LocaleRow, isNew: boolean) {
    if (priceUnitId == null) return;
    const data = rowEditData[key];
    if (!data) return;
    if (!data.locale_id) { toast.error(t("toast.localeSelectLang", { n: 1 })); return; }
    if (!data.name.trim()) { toast.error(t("toast.localeNameRequired", { n: 1 })); return; }
    setBusy(key, true);
    try {
      if (isNew) {
        await priceUnitsService.addLocale(priceUnitId, {
          locale_id: Number(data.locale_id),
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          sort_order: Number(data.sort_order) || 0,
          calculation_method: data.calculation_method?.trim() || undefined,
          usage_example: data.usage_example?.trim() || undefined,
        });
        setNewLocaleRows((prev) => prev.filter((r) => r._rkey !== key));
      } else {
        await priceUnitsService.updateLocale(priceUnitId, row.id!, {
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          sort_order: Number(data.sort_order) || 0,
          calculation_method: data.calculation_method?.trim() || undefined,
          usage_example: data.usage_example?.trim() || undefined,
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
    if (!pendingDeleteRow || priceUnitId == null || !pendingDeleteRow.id) return;
    const row = pendingDeleteRow;
    const key = rowKey(row);
    setPendingDeleteRow(null);
    setBusy(key, true);
    try {
      await priceUnitsService.removeLocale(priceUnitId, row.id);
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

  function makeEmptyRow(sortIndex: number): Omit<NewLocaleRow, "_rkey"> {
    const usedIds = new Set([
      ...form.locales.map((r) => r.locale_id),
      ...newLocaleRows.map((r) => r.locale_id),
    ].filter((v): v is number => typeof v === "number"));
    const nextLocale = availableLocales.find((l) => !usedIds.has(l.id));
    return {
      locale_id: nextLocale?.id ?? "",
      name: "",
      description: "",
      sort_order: sortIndex,
      calculation_method: "",
      usage_example: "",
      _new: true,
    };
  }

  function addNewLocaleRow() {
    const _rkey = `n_${rKeyCounter.current++}`;
    const newRow: NewLocaleRow = {
      ...makeEmptyRow(form.locales.length + newLocaleRows.length + 1),
      _rkey,
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
        {
          locale_id: nextLocale ? nextLocale.id : "",
          name: "",
          description: "",
          sort_order: form.locales.length + 1,
          calculation_method: "",
          usage_example: "",
          _new: true,
        },
      ],
    });
  }

  function updateLocaleRow(idx: number, patch: Partial<LocaleRow>) {
    onFormChange({ ...form, locales: form.locales.map((row, i) => (i === idx ? { ...row, ...patch } : row)) });
  }

  function removeLocaleRow(idx: number) {
    onFormChange({ ...form, locales: form.locales.filter((_, i) => i !== idx) });
  }

  const allLocaleRows: Array<LocaleRow & { _rkey: string }> = [
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
              {t("locale.empty.priceUnit")}
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
                    <LocaleFields
                      row={row}
                      disabled
                      availableLocales={availableLocales}
                      onChange={() => {}}
                    />
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
                    <LocaleFields
                      row={row}
                      disabled={false}
                      availableLocales={availableLocales}
                      usedIds={usedIds}
                      localeSelectable
                      onChange={(patch) => updateLocaleRow(idx, patch)}
                    />
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
              {t("locale.empty.priceUnit")}
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

                    <LocaleFields
                      row={editData}
                      disabled={!rowEditing}
                      availableLocales={availableLocales}
                      usedIds={usedIds}
                      localeSelectable={isNew}
                      onChange={(patch) => patchRowEdit(key, patch)}
                    />
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

// ─── Shared field layout used by all three modes ───────────────────────────────

interface LocaleFieldsProps {
  row: LocaleRow;
  disabled: boolean;
  availableLocales: Locale[];
  usedIds?: (number | "")[];
  localeSelectable?: boolean;
  onChange: (patch: Partial<LocaleRow>) => void;
}

function LocaleFields({ row, disabled, availableLocales, usedIds = [], localeSelectable = false, onChange }: LocaleFieldsProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("field.language")} {!disabled && "*"}</Label>
          <Select
            value={row.locale_id ? String(row.locale_id) : ""}
            onValueChange={(v) => onChange({ locale_id: Number(v) })}
            disabled={disabled || !localeSelectable}
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
          <Label className="text-xs text-muted-foreground">{t("field.sort")} {!disabled && "*"}</Label>
          <Input
            type="number"
            value={row.sort_order}
            onChange={(e) => onChange({ sort_order: Number(e.target.value) })}
            disabled={disabled}
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t("common.name")} {!disabled && "*"}</Label>
        <Input
          value={row.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={t("priceUnitDialog.namePlaceholder")}
          disabled={disabled}
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
        <Textarea
          value={row.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder={t("placeholder.countryDescription")}
          disabled={disabled}
          rows={2}
          className="text-sm resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t("field.calculationMethod")}</Label>
        <Textarea
          value={row.calculation_method}
          onChange={(e) => onChange({ calculation_method: e.target.value })}
          placeholder={t("priceUnitDialog.calculationMethodPlaceholder")}
          disabled={disabled}
          rows={2}
          className="text-sm resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t("field.usageExample")}</Label>
        <Textarea
          value={row.usage_example}
          onChange={(e) => onChange({ usage_example: e.target.value })}
          placeholder={t("priceUnitDialog.usageExamplePlaceholder")}
          disabled={disabled}
          rows={2}
          className="text-sm resize-none"
        />
      </div>
    </div>
  );
}
