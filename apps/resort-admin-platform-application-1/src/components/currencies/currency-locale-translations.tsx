import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Languages, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@resort/shadcn-ui";
import { Card } from "@resort/shadcn-ui";
import { Input } from "@resort/shadcn-ui";
import { Label } from "@resort/shadcn-ui";
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
import { currenciesService } from "@/services/currencies";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import type { CurrencyDialogMode, CurrencyFormState, LocaleRow } from "./types";

type NewLocaleRow = LocaleRow & { _rkey: string };

// Create only ever submits the "en" translation — keep what's typed limited to English/ASCII text
// so it can't silently end up holding another script's name/short name.
const NON_ASCII = /[^\x00-\x7F]/g;

export interface CurrencyLocaleTranslationsProps {
  mode: CurrencyDialogMode;
  form: CurrencyFormState;
  onFormChange: (form: CurrencyFormState) => void;
  currencyId?: number;
  onSaved?: () => void | Promise<void>;
  /** True while any single translation row has an in-progress edit (existing or newly added). */
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  /** Clears search and re-pulls the complete unfiltered list before adding a new translation row.
   * Returns the up-to-date language catalog so the caller can check "any locales left to add" right
   * after awaiting it, instead of racing the `availableLocales` prop's next render. */
  onPrepareAdd: () => Promise<Locale[]>;
  /** Owned by the parent dialog — survives this component unmounting on tab switch. */
  search: string;
  onSearchChange: (v: string) => void;
  open: boolean;
  /** Owned by the parent dialog (see [[feedback_tab_content_state]]) — fetched once per dialog
   * session there, not here, so it isn't lost every time this component unmounts on tab switch. */
  availableLocales: Locale[];
}

export function CurrencyLocaleTranslations({
  mode,
  form,
  onFormChange,
  currencyId,
  onSaved,
  editing,
  onEditingChange,
  onPrepareAdd,
  search,
  onSearchChange,
  open,
  availableLocales,
}: CurrencyLocaleTranslationsProps) {
  const { t } = useTranslation();
  const [newLocaleRows, setNewLocaleRows] = useState<NewLocaleRow[]>([]);
  const [rowEditData, setRowEditData] = useState<Record<string, LocaleRow>>({});
  const [busyRowKeys, setBusyRowKeys] = useState<Set<string>>(new Set());
  const [pendingDeleteRow, setPendingDeleteRow] = useState<LocaleRow | null>(null);
  const rKeyCounter = useRef(0);

  // GET /currencies/{id} and the list endpoint only ever carry the single Accept-Language-matched
  // translation — the full set is only available via this dedicated sub-resource, so this tab
  // fetches its own data rather than relying on whatever the parent list/get call populated.
  function refreshLocales(localeCode?: string) {
    if (currencyId == null) return;
    currenciesService.listLocales(currencyId, { size: 10, localeCode: localeCode || undefined })
      .then((res) => {
        onFormChange({
          ...form,
          locales: res.data.map((l) => ({
            id: l.id,
            locale: l.locale,
            name: l.name,
            short_name: l.short_name ?? "",
            sort_order: l.sort_order,
          })),
        });
      })
      .catch((err) => toast.error((err as Error).message));
  }

  useEffect(() => {
    if (!open) {
      setNewLocaleRows([]);
      setRowEditData({});
      setBusyRowKeys(new Set());
    }
  }, [open]);

  // A translation is "being edited" whenever any row (existing or newly added) has an open draft —
  // there's no section-wide edit toggle anymore, so this is what drives isDirty upstream.
  useEffect(() => {
    onEditingChange(Object.keys(rowEditData).length > 0);
  }, [rowEditData]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (currencyId == null) return;
    const data = rowEditData[key];
    if (!data) return;
    if (isNew && !data.locale_id) { toast.error(t("toast.localeSelectLang", { n: 1 })); return; }
    if (!data.name.trim()) { toast.error(t("toast.localeNameRequired", { n: 1 })); return; }
    setBusy(key, true);
    try {
      if (isNew) {
        await currenciesService.addLocale(currencyId, {
          locale_id: Number(data.locale_id),
          name: data.name.trim(),
          short_name: data.short_name?.trim() || undefined,
          sort_order: Number(data.sort_order) || 0,
        });
        setNewLocaleRows((prev) => prev.filter((r) => r._rkey !== key));
      } else {
        await currenciesService.updateLocale(currencyId, row.id!, {
          name: data.name.trim(),
          short_name: data.short_name?.trim() || undefined,
          sort_order: Number(data.sort_order) || 0,
        });
      }
      setRowEditData((prev) => { const n = { ...prev }; delete n[key]; return n; });
      toast.success(t("common.saved"));
      refreshLocales();
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(key, false);
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteRow || currencyId == null || !pendingDeleteRow.id) return;
    const row = pendingDeleteRow;
    const key = rowKey(row);
    setPendingDeleteRow(null);
    setBusy(key, true);
    try {
      await currenciesService.removeLocale(currencyId, row.id!);
      toast.success(t("locale.removedToast"));
      refreshLocales();
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(key, false);
    }
  }

  function usedLocaleIds(excludeKey?: string): Set<number> {
    const existing = form.locales
      .filter((r) => rowKey(r) !== excludeKey)
      .map((r) => r.locale?.id);
    const added = newLocaleRows
      .filter((r) => r._rkey !== excludeKey)
      .map((r) => r.locale_id);
    return new Set([...existing, ...added].filter((v): v is number => typeof v === "number"));
  }

  // `catalog` is passed explicitly (rather than read off the `availableLocales` prop) because the
  // caller just awaited a fresh fetch of it — the prop won't reflect that until the next render.
  function addNewLocaleRow(catalog: Locale[]) {
    const usedIds = usedLocaleIds();
    const nextLocale = catalog.find((l) => !usedIds.has(l.id));
    const _rkey = `n_${rKeyCounter.current++}`;
    const newRow: NewLocaleRow = {
      _rkey,
      locale_id: nextLocale?.id ?? "",
      name: "",
      short_name: "",
      sort_order: form.locales.length + newLocaleRows.length + 1,
      _new: true,
    };
    setNewLocaleRows((prev) => [...prev, newRow]);
    setRowEditData((prev) => ({ ...prev, [_rkey]: { ...newRow } }));
  }

  // Adding a translation always needs the complete list — clear any active search and re-pull
  // everything first, so duplicate-locale checks never operate on a filtered subset. Also guards
  // against the language catalog only being known lazily (fetched on first Add click, not eagerly on
  // tab view — see [[feedback_dialog_lazy_tab_load]]): re-check against the freshly-awaited catalog
  // before actually opening a new row, rather than opening an unusable one with no language left.
  async function handleAddLocale() {
    const catalog = await onPrepareAdd();
    if (catalog.length > 0 && usedLocaleIds().size >= catalog.length) {
      toast.error(t("locale.allLanguagesAdded"));
      return;
    }
    addNewLocaleRow(catalog);
  }

  // New rows render first, so adding one never requires scrolling down to see it.
  const allLocaleRows: Array<LocaleRow & { _rkey: string }> = [
    ...newLocaleRows,
    ...form.locales.map((l) => ({ ...l, _rkey: `e_${l.id}` })),
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
        {mode !== "create" && (
          <Button type="button" size="sm" variant="outline" onClick={handleAddLocale}
            // The language catalog is only fetched lazily on first use (see prepareAddLocale in
            // CurrencyDialog), so `availableLocales` starts empty — don't let that read as "no
            // languages left" and disable Add before the catalog has ever been loaded.
            disabled={newLocaleRows.length > 0 || (availableLocales.length > 0 && (form.locales.length + newLocaleRows.length) >= availableLocales.length)}
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
        {/* CREATE mode — always a single "en" translation, resolved server-side */}
        {mode === "create" && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Languages className="h-3.5 w-3.5 text-muted-foreground" />
              {t("locale.row.english")}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("common.name")} *</Label>
              <Input value={form.locale.name}
                onChange={(e) => onFormChange({ ...form, locale: { ...form.locale, name: e.target.value.replace(NON_ASCII, "") } })}
                placeholder={t("placeholder.currencyName")}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("field.shortName")}</Label>
              <Input value={form.locale.short_name}
                onChange={(e) => onFormChange({ ...form, locale: { ...form.locale, short_name: e.target.value.replace(NON_ASCII, "") } })}
                placeholder={t("placeholder.currencyShortName")}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("field.sort")}</Label>
              <Input type="number" value={form.locale.sort_order}
                onChange={(e) => onFormChange({ ...form, locale: { ...form.locale, sort_order: Number(e.target.value) } })}
                className="h-9 text-sm"
              />
            </div>
          </div>
        )}

        {/* View/Edit — each translation is edited independently via its own pencil icon, no
            section-wide edit toggle required first */}
        {mode !== "create" && (
          allLocaleRows.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              {search.trim() !== "" ? (
                <>
                  <Search className="h-4 w-4 mr-2 opacity-40" />
                  {t("locale.noSearchMatch")}
                </>
              ) : (
                <>
                  <Languages className="h-4 w-4 mr-2 opacity-40" />
                  {t("locale.empty.currency")}
                </>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {allLocaleRows.map((row) => {
                const key = row._rkey;
                const isNew = !!row._new;
                const rowEditing = isRowEditing(key);
                const busy = isRowBusy(key);
                const editData = rowEditData[key] ?? row;
                const usedIds = usedLocaleIds(key);

                return (
                  <div key={key} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                        {!isNew && row.locale
                          ? `${row.locale.name} (${row.locale.code})`
                          : t("locale.row.new")}
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

                    {isNew && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("field.language")} *</Label>
                        <Select
                          value={editData.locale_id ? String(editData.locale_id) : ""}
                          onValueChange={(v) => patchRowEdit(key, { locale_id: Number(v) })}
                          disabled={!rowEditing}
                        >
                          <SelectTrigger className="h-9 text-sm w-full">
                            <SelectValue placeholder={t("placeholder.selectLanguage")} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableLocales.map((l) => (
                              <SelectItem key={l.id} value={String(l.id)} disabled={usedIds.has(l.id)}>
                                {l.name} ({l.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{t("common.name")} *</Label>
                      <Input
                        value={editData.name}
                        onChange={(e) => patchRowEdit(key, { name: e.target.value })}
                        placeholder={t("placeholder.currencyName")}
                        disabled={!rowEditing}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{t("field.shortName")}</Label>
                      <Input
                        value={editData.short_name}
                        onChange={(e) => patchRowEdit(key, { short_name: e.target.value })}
                        placeholder={t("placeholder.currencyShortName")}
                        disabled={!rowEditing}
                        className="h-9 text-sm"
                      />
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
