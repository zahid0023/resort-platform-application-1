import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Languages, Pencil, Plus, Search, Trash2, X } from "lucide-react";
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
import { bedTypesService } from "@/services/bed-types";
import type { Locale } from "@/services/locales";
import { canAddLocaleTranslation } from "@/lib/locale";
import { toast } from "sonner";
import type { BedTypeDialogMode, BedTypeFormState, LocaleRow } from "./types";

type NewLocaleRow = LocaleRow & { _rkey: string };

// Create only ever submits the "en" translation — keep what's typed limited to English/ASCII text.
const NON_ASCII = /[^\x00-\x7F]/g;

export interface BedTypeLocaleTranslationsProps {
  mode: BedTypeDialogMode;
  form: BedTypeFormState;
  onFormChange: (form: BedTypeFormState) => void;
  bedTypeId?: number;
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
  /** Owned by the parent dialog — fetched once per dialog session there, not here. */
  availableLocales: Locale[];
  /** True total of active locales system-wide (from `GET /locales/count`), used instead of
   * `availableLocales.length` to decide the Add button's disabled state — the list endpoint caps
   * `size` at 50 per page, so `availableLocales` may undercount if more locales exist than that. */
  totalLocaleCount: number | null;
  /** Authoritative set of locale codes this bed type already has a translation for, from
   * `GET /bed-types/{id}/locales/count` — not `form.locales`, which only ever holds one page
   * (size 10) of the paginated sub-resource and can miss codes past that page. `null` until the
   * first fetch resolves, in which case `usedLocaleIds` falls back to `form.locales`. */
  bedTypeLocaleCodes: string[] | null;
}

export function BedTypeLocaleTranslations({
  mode,
  form,
  onFormChange,
  bedTypeId,
  onSaved,
  editing,
  onEditingChange,
  onPrepareAdd,
  search,
  onSearchChange,
  open,
  availableLocales,
  totalLocaleCount,
  bedTypeLocaleCodes,
}: BedTypeLocaleTranslationsProps) {
  const { t } = useTranslation();
  const [newLocaleRows, setNewLocaleRows] = useState<NewLocaleRow[]>([]);
  const [rowEditData, setRowEditData] = useState<Record<string, LocaleRow>>({});
  const [busyRowKeys, setBusyRowKeys] = useState<Set<string>>(new Set());
  const [pendingDeleteRow, setPendingDeleteRow] = useState<LocaleRow | null>(null);
  const rKeyCounter = useRef(0);

  // GET /bed-types/{id} and the list endpoint only ever carry the single Accept-Language-matched
  // translation — the full set is only available via this dedicated sub-resource.
  function refreshLocales(localeCode?: string) {
    if (bedTypeId == null) return;
    bedTypesService.listLocales(bedTypeId, { size: 10, localeCode: localeCode || undefined })
      .then((res) => {
        onFormChange({
          ...form,
          locales: res.data.map((l) => ({
            id: l.id,
            locale: l.locale,
            name: l.name,
            description: l.description ?? "",
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
  // there's no section-wide edit toggle, so this is what drives isDirty upstream.
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
    if (bedTypeId == null) return;
    const data = rowEditData[key];
    if (!data) return;
    if (isNew && !data.locale_id) { toast.error(t("toast.localeSelectLang", { n: 1 })); return; }
    if (!data.name.trim()) { toast.error(t("toast.localeNameRequired", { n: 1 })); return; }
    setBusy(key, true);
    try {
      if (isNew) {
        await bedTypesService.addLocale(bedTypeId, {
          locale_id: Number(data.locale_id),
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          sort_order: Number(data.sort_order) || 0,
        });
        setNewLocaleRows((prev) => prev.filter((r) => r._rkey !== key));
      } else {
        await bedTypesService.updateLocale(bedTypeId, row.id!, {
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
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
    if (!pendingDeleteRow || bedTypeId == null || !pendingDeleteRow.id) return;
    const row = pendingDeleteRow;
    const key = rowKey(row);
    setPendingDeleteRow(null);
    setBusy(key, true);
    try {
      await bedTypesService.removeLocale(bedTypeId, row.id!);
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
    const added = newLocaleRows
      .filter((r) => r._rkey !== excludeKey)
      .map((r) => r.locale_id);

    // Prefer the authoritative, unpaginated code list from the bed type's own /locales/count
    // sub-resource — form.locales only ever holds one page (size 10) and can miss codes past that,
    // which would otherwise let a user pick an already-used language in the +Add dropdown.
    if (bedTypeLocaleCodes) {
      const idByCode = new Map(availableLocales.map((l) => [l.code, l.id]));
      const existing = bedTypeLocaleCodes.map((c) => idByCode.get(c));
      return new Set([...existing, ...added].filter((v): v is number => typeof v === "number"));
    }

    const existing = form.locales
      .filter((r) => rowKey(r) !== excludeKey)
      .map((r) => r.locale?.id);
    return new Set([...existing, ...added].filter((v): v is number => typeof v === "number"));
  }

  // Count-only version of usedLocaleIds, for the "is there room left" checks below. Deliberately
  // doesn't route through the code->id lookup: that map is built from `availableLocales`, which is
  // empty until something has triggered the shared catalog fetch (e.g. a prior +Add click anywhere
  // in the session) — before that, every code in `bedTypeLocaleCodes` would resolve to `undefined`
  // and get silently dropped, undercounting used locales and leaving +Add wrongly enabled even when
  // every locale already has a translation.
  function usedLocaleCount(excludeKey?: string): number {
    const addedCount = newLocaleRows.filter((r) => r._rkey !== excludeKey).length;
    if (bedTypeLocaleCodes) return bedTypeLocaleCodes.length + addedCount;
    return form.locales.filter((r) => rowKey(r) !== excludeKey).length + addedCount;
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
      description: "",
      sort_order: form.locales.length + newLocaleRows.length + 1,
      _new: true,
    };
    setNewLocaleRows((prev) => [...prev, newRow]);
    setRowEditData((prev) => ({ ...prev, [_rkey]: { ...newRow } }));
  }

  // Adding a translation always needs the complete list — clear any active search and re-pull
  // everything first, so duplicate-locale checks never operate on a filtered subset. Whether
  // there's room for another translation at all is a separate concern, delegated to
  // canAddLocaleTranslation rather than computed here.
  async function handleAddLocale() {
    const catalog = await onPrepareAdd();
    if (!canAddLocaleTranslation(usedLocaleCount(), totalLocaleCount)) {
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
            disabled={newLocaleRows.length > 0 || !canAddLocaleTranslation(usedLocaleCount(), totalLocaleCount)}
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
                placeholder={t("placeholder.bedTypeName")}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("common.description")} *</Label>
              <Textarea value={form.locale.description}
                onChange={(e) => onFormChange({ ...form, locale: { ...form.locale, description: e.target.value.replace(NON_ASCII, "") } })}
                placeholder={t("placeholder.bedTypeDescription")}
                rows={2}
                className="text-sm resize-none"
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
                  {t("locale.empty.bedType")}
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
                        placeholder={t("placeholder.bedTypeName")}
                        disabled={!rowEditing}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{t("common.description")}</Label>
                      <Textarea
                        value={editData.description}
                        onChange={(e) => patchRowEdit(key, { description: e.target.value })}
                        placeholder={t("placeholder.bedTypeDescription")}
                        disabled={!rowEditing}
                        rows={2}
                        className="text-sm resize-none"
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
