import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Layers, Loader2, Plus, RefreshCw, Save, Tag, X } from "lucide-react";
import { Badge, Button, Sheet, SheetContent } from "@resort/shadcn-ui";
import { Card, CardContent } from "@resort/shadcn-ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@resort/shadcn-ui";
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
import { DialogEntityHeader } from "@/components/shared/dialog-entity-header";
import { DialogCreateFooter } from "@/components/shared/dialog-create-footer";
import { priceTypesService } from "@/services/price-types";
import type { Locale } from "@/services/locales";
import { priceScopesService, type PriceScope } from "@/services/price-scopes";
import { useLocales } from "@/providers/locales-provider";
import { toast } from "sonner";
import type { PriceTypeDialogMode, PriceTypeFormState } from "./types";
import { PriceTypeGeneralInfo } from "./price-type-general-info";
import { PriceTypeLocaleTranslations } from "./price-type-locale-translations";
import { PriceScopePickerDialog } from "./price-scope-picker-dialog";

export const emptyPriceTypeForm: PriceTypeFormState = {
  code: "",
  sort_order: 0,
  locale: { name: "", description: "", sort_order: 0, purpose: "", usage_example: "" },
  locales: [],
  scopes: [],
  price_scopes: [],
};

// Create only ever submits the "en" translation — keep it English/ASCII.
const ENGLISH_TEXT_PATTERN = /^[\x00-\x7F]*$/;
const CODE_MAX_LENGTH = 50;

// Local autosave for the create form — never sent to the backend, just a browser-local checkpoint.
const DRAFT_STORAGE_KEY = "price-type-dialog-draft";
const DRAFT_SAVE_DEBOUNCE_MS = 500;

function hasDraftContent(f: PriceTypeFormState): boolean {
  return f.code.trim() !== "" || f.locale.name.trim() !== "" || f.locale.description.trim() !== "" || f.scopes.length > 0;
}

function readDraft(): PriceTypeFormState | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PriceTypeFormState;
    return hasDraftContent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

export interface PriceTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: PriceTypeDialogMode;
  priceTypeId?: number;
  form: PriceTypeFormState;
  onFormChange: (form: PriceTypeFormState) => void;
  onSaved?: () => void | Promise<void>;
}

export function PriceTypeDialog({
  open,
  onOpenChange,
  mode,
  priceTypeId,
  form,
  onFormChange,
  onSaved,
}: PriceTypeDialogProps) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [generalEditing, setGeneralEditing] = useState(false);
  const [translationsEditing, setTranslationsEditing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "locales" | "scopes">("general");
  const [scopePickerOpen, setScopePickerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [localesLoaded, setLocalesLoaded] = useState(false);
  const [scopesLoaded, setScopesLoaded] = useState(false);
  // Platform-wide total of active price scopes, from `GET /price-scopes/count` — compared against
  // `form.price_scopes.length` (edit/view mode only) to know whether every scope is already assigned,
  // in which case the "Assign Price Scope" tile is disabled since the picker would have nothing to
  // offer. `null` until the first fetch resolves.
  const [totalScopeCount, setTotalScopeCount] = useState<number | null>(null);
  // Edit/view mode only — ids of price scopes currently mid-assign or mid-unassign, so the affected
  // card can show a spinner and the rest of the tab stays interactive.
  const [busyScopeIds, setBusyScopeIds] = useState<Set<number>>(new Set());
  const [pendingUnassignScope, setPendingUnassignScope] = useState<PriceScope | null>(null);
  // Authoritative set of locale codes this price type already has a translation for, from
  // `GET /price-types/{id}/locales/count` — not derived from `form.locales`, which only ever
  // holds one page (size 10) of the paginated sub-resource and can undercount past that. Compared
  // against the platform-wide codes from `useLocales()` to know which languages are still addable.
  // `null` until the first fetch resolves.
  const [priceTypeLocaleCodes, setPriceTypeLocaleCodes] = useState<string[] | null>(null);
  // The language catalog is loaded once per session (right after login) by LocalesProvider and
  // shared across every entity dialog — no per-dialog fetch needed. `refreshLocalesCatalog` is only
  // used as an explicit re-sync (a fallback in prepareAddLocale) for locales created elsewhere during
  // the current session, since the shared copy otherwise never auto-updates. The manual Refresh
  // button only needs `refreshLocalesCount` (GET /locales/count) — the full paginated catalog
  // (GET /locales) is only ever needed by the +Add language picker.
  const { locales: availableLocales, totalCount: totalLocaleCount, refresh: refreshLocalesCatalog, refreshCount: refreshLocalesCount } = useLocales();
  // Owned here so it survives PriceTypeLocaleTranslations-style unmount on tab switch — see
  // [[feedback_tab_content_state]].
  const [localeSearch, setLocaleSearch] = useState("");
  const lastLocaleSearchKey = useRef("");
  const [draftPrompt, setDraftPrompt] = useState<PriceTypeFormState | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [draftSyncing, setDraftSyncing] = useState(false);

  useEffect(() => {
    if (!open) {
      setGeneralEditing(false);
      setTranslationsEditing(false);
      setConfirmClose(false);
      setActiveTab("general");
      setScopePickerOpen(false);
      setDraftPrompt(null);
      setDraftSavedAt(null);
      setDraftSyncing(false);
      setLocalesLoaded(false);
      setLocaleSearch("");
      lastLocaleSearchKey.current = "";
      setPriceTypeLocaleCodes(null);
      setScopesLoaded(false);
      setTotalScopeCount(null);
      setBusyScopeIds(new Set());
      setPendingUnassignScope(null);
    }
  }, [open]);

  // On opening a fresh create form, offer to resume a locally-saved draft.
  useEffect(() => {
    if (open && mode === "create") {
      setDraftPrompt(readDraft());
    }
  }, [open, mode]);

  // Debounced local autosave of the create form — skipped while the restore prompt is pending,
  // otherwise the still-empty parent form would immediately overwrite the draft we're offering.
  useEffect(() => {
    if (!open || mode !== "create" || draftPrompt) return;
    if (hasDraftContent(form)) setDraftSyncing(true);
    const timer = setTimeout(() => {
      if (hasDraftContent(form)) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
        setDraftSavedAt(new Date());
      } else {
        clearDraft();
        setDraftSavedAt(null);
      }
      setDraftSyncing(false);
    }, DRAFT_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [form, open, mode, draftPrompt]);

  function restoreDraft() {
    if (draftPrompt) {
      onFormChange(draftPrompt);
      setDraftSavedAt(new Date());
    }
    setDraftPrompt(null);
  }

  function discardDraft() {
    clearDraft();
    setDraftSavedAt(null);
    setDraftSyncing(false);
    setDraftPrompt(null);
  }

  const draftIndicator = mode === "create" && (draftSyncing || draftSavedAt) ? (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {draftSyncing ? (
        <>
          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> {t("dialog.draftSyncing")}
        </>
      ) : (
        <>
          <Save className="h-3.5 w-3.5" />
          {t("dialog.draftSaved", { time: draftSavedAt!.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" }) })}
        </>
      )}
    </span>
  ) : undefined;

  // Edit/view only — in-progress section edits still warn before discarding, since those aren't
  // autosaved. Create is covered by the local draft (see draftIndicator above).
  const isDirty = generalEditing || translationsEditing;

  // Every active price scope is already assigned to this price type — the picker would have nothing
  // left to offer, so the "Assign Price Scope" tile is disabled rather than opening onto an empty list.
  const allScopesAssigned = totalScopeCount !== null && form.price_scopes.length >= totalScopeCount;

  function requestClose() {
    if (mode === "create") { onOpenChange(false); return; }
    if (isDirty) setConfirmClose(true);
    else onOpenChange(false);
  }

  // Silent check — drives the "locales" tab's disabled state without firing toasts on every render.
  function isGeneralInfoValid(): boolean {
    const code = form.code.trim();
    return code !== "" && code.length <= CODE_MAX_LENGTH;
  }

  // Same check, but reports what's wrong — used by both the Next button and submit.
  function validateGeneralInfo(): boolean {
    const code = form.code.trim();
    if (!code) { toast.error(t("toast.codeRequired")); return false; }
    if (code.length > CODE_MAX_LENGTH) { toast.error(t("toast.priceTypeCodeMaxLength")); return false; }
    return true;
  }

  function handleNext() {
    if (!validateGeneralInfo()) return;
    setActiveTab("locales");
  }

  // Shared by the lazy first-load, the search box, and the manual refresh button.
  async function fetchLocales(localeCode?: string): Promise<void> {
    if (priceTypeId == null) return;
    const res = await priceTypesService.listLocales(priceTypeId, { size: 10, localeCode: localeCode || undefined });
    onFormChange({
      ...form,
      locales: res.data.map((l) => ({
        id: l.id,
        locale: l.locale,
        name: l.name,
        description: l.description ?? "",
        sort_order: l.sort_order,
        purpose: l.purpose ?? "",
        usage_example: l.usage_example ?? "",
      })),
    });
  }

  // Companion to fetchLocales — hits the price type's own /locales/count sub-resource for the
  // authoritative, unpaginated set of locale codes it already has a translation for. Kept separate
  // from fetchLocales since it doesn't need to re-run on every search keystroke, only on tab load,
  // manual refresh, and right before the +Add picker needs an up-to-date used/available split.
  async function fetchLocaleCodes(): Promise<void> {
    if (priceTypeId == null) return;
    const res = await priceTypesService.countLocales(priceTypeId);
    setPriceTypeLocaleCodes(res.codes);
  }

  // Translations are only fetched once the tab is actually selected — not when the price type
  // card is opened — and only the first time per dialog session; re-selecting the tab afterward
  // reuses what's already loaded. Use the Refresh button for an explicit re-fetch. The language
  // catalog needs no fetch here at all — LocalesProvider already loaded it once for the whole session.
  useEffect(() => {
    if (!open || mode === "create" || activeTab !== "locales" || localesLoaded) return;
    setLocalesLoaded(true);
    Promise.all([fetchLocales(), fetchLocaleCodes()]).catch((err) => toast.error((err as Error).message));
  }, [open, mode, activeTab, localesLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Platform-wide active-scope total, from `GET /price-scopes/count` — compared against
  // `form.price_scopes.length` to know whether the "Assign Price Scope" tile should be disabled
  // because every scope is already assigned. `form.price_scopes` itself needs no fetch here — it's
  // already as fresh as the card click that opened this dialog (GET /price-types/{id} embeds it).
  async function fetchScopeCount(): Promise<void> {
    const res = await priceScopesService.count();
    setTotalScopeCount(res.count);
  }

  // Same lazy-once-per-tab-selection pattern as the locales tab above.
  useEffect(() => {
    if (!open || mode === "create" || activeTab !== "scopes" || scopesLoaded) return;
    setScopesLoaded(true);
    fetchScopeCount().catch((err) => toast.error((err as Error).message));
  }, [open, mode, activeTab, scopesLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced server-side search, view mode only — edit mode always needs the complete,
  // unfiltered list (see PriceTypeLocaleTranslations' duplicate-locale checks).
  useEffect(() => {
    if (!open || mode === "create" || translationsEditing) return;
    if (lastLocaleSearchKey.current === localeSearch) return;
    lastLocaleSearchKey.current = localeSearch;
    const timer = setTimeout(() => {
      fetchLocales(localeSearch.trim()).catch((err) => toast.error((err as Error).message));
    }, 350);
    return () => clearTimeout(timer);
  }, [localeSearch, open, mode, translationsEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Adding a translation always needs the complete list — clear any active search and re-pull
  // everything first, so duplicate-locale checks never operate on a filtered subset. The shared
  // language catalog is normally already loaded (LocalesProvider fetched it at session start) —
  // this only re-fetches it as a fallback if the provider's own load somehow hasn't resolved yet.
  //
  // Returns the up-to-date catalog (not just fires the fetch) so the caller can reliably check
  // "are all locales already used" right after awaiting this.
  function prepareAddLocale(): Promise<Locale[]> {
    setLocaleSearch("");
    lastLocaleSearchKey.current = "";
    fetchLocales().catch((err) => toast.error((err as Error).message));
    fetchLocaleCodes().catch((err) => toast.error((err as Error).message));
    if (availableLocales.length === 0) {
      return refreshLocalesCatalog().catch((err) => {
        toast.error((err as Error).message);
        return availableLocales;
      });
    }
    return Promise.resolve(availableLocales);
  }

  // Manual refresh only — switching tabs never re-fetches on its own otherwise. On the locales tab
  // this re-syncs just the shared language count (GET /locales/count) and this price type's own
  // locale-code count — the full paginated catalog (GET /locales) is only ever needed by the +Add
  // language picker, not by a refresh. On the scopes tab (view-only, no edit UI) it re-pulls the
  // price type itself for an up-to-date `price_scopes` list.
  async function handleRefresh() {
    if (priceTypeId == null) return;
    setRefreshing(true);
    try {
      if (activeTab === "general") {
        const res = await priceTypesService.get(priceTypeId);
        const full = res.data;
        onFormChange({ ...form, sort_order: full.sort_order });
      } else if (activeTab === "scopes") {
        const [res] = await Promise.all([priceTypesService.get(priceTypeId), fetchScopeCount()]);
        const full = res.data;
        onFormChange({ ...form, price_scopes: full.price_scopes ?? [] });
        setScopesLoaded(true);
      } else {
        await Promise.all([fetchLocales(localeSearch.trim()), refreshLocalesCount(), fetchLocaleCodes()]);
        setLocalesLoaded(true);
      }
      toast.success(t("common.refreshed"));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRefreshing(false);
    }
  }

  // Silent check — drives the "scopes" tab / Next button's disabled state without firing toasts on every render.
  function isLocaleValid(): boolean {
    return form.locale.name.trim() !== "" && form.locale.description.trim() !== ""
      && form.locale.purpose.trim() !== "" && form.locale.usage_example.trim() !== ""
      && ENGLISH_TEXT_PATTERN.test(form.locale.name) && ENGLISH_TEXT_PATTERN.test(form.locale.description)
      && ENGLISH_TEXT_PATTERN.test(form.locale.purpose) && ENGLISH_TEXT_PATTERN.test(form.locale.usage_example);
  }

  // Same check, but reports what's wrong — used by both the Next button and submit.
  function validateLocale(): boolean {
    if (!form.locale.name.trim()) { toast.error(t("toast.localeNameRequired", { n: 1 })); return false; }
    if (!ENGLISH_TEXT_PATTERN.test(form.locale.name)) { toast.error(t("toast.localeNameEnglishOnly")); return false; }
    if (!form.locale.description.trim()) { toast.error(t("toast.localeDescriptionRequired", { n: 1 })); return false; }
    if (!ENGLISH_TEXT_PATTERN.test(form.locale.description)) { toast.error(t("toast.localeDescriptionEnglishOnly")); return false; }
    if (!form.locale.purpose.trim()) { toast.error(t("toast.priceTypePurposeRequired")); return false; }
    if (!ENGLISH_TEXT_PATTERN.test(form.locale.purpose)) { toast.error(t("toast.priceTypePurposeEnglishOnly")); return false; }
    if (!form.locale.usage_example.trim()) { toast.error(t("toast.priceTypeUsageExampleRequired")); return false; }
    if (!ENGLISH_TEXT_PATTERN.test(form.locale.usage_example)) { toast.error(t("toast.priceTypeUsageExampleEnglishOnly")); return false; }
    return true;
  }

  function handleNextFromLocales() {
    if (!validateLocale()) return;
    setActiveTab("scopes");
  }

  // Silent check — drives the Create button's disabled state without firing toasts on every render.
  function isScopesValid(): boolean {
    return form.scopes.length > 0;
  }

  function validateScopes(): boolean {
    if (form.scopes.length === 0) { toast.error(t("priceType.scopeRequired")); return false; }
    return true;
  }

  function addScope(scope: PriceScope) {
    if (form.scopes.some((s) => s.id === scope.id)) return;
    onFormChange({ ...form, scopes: [...form.scopes, scope] });
  }

  function setScopeBusy(scopeId: number, busy: boolean) {
    setBusyScopeIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(scopeId);
      else next.delete(scopeId);
      return next;
    });
  }

  // Edit/view mode only — `POST /price-types/{id}/scope-assignments`. Assignment is immediate (no
  // Save step for this tab), so the card updates optimistically only after the call succeeds.
  async function handleAssignScope(scope: PriceScope): Promise<void> {
    if (priceTypeId == null) return;
    if (form.price_scopes.some((s) => s.id === scope.id)) return;
    setScopeBusy(scope.id, true);
    try {
      await priceTypesService.assignScope(priceTypeId, scope.id);
      onFormChange({ ...form, price_scopes: [...form.price_scopes, scope] });
      toast.success(t("priceType.scopeAssigned"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("priceType.scopeAssignFailed"));
    } finally {
      setScopeBusy(scope.id, false);
    }
  }

  // Edit/view mode only — `DELETE /price-types/{id}/scope-assignments/{price-scope-id}`, identified
  // by the scope's own id (a price type can only ever have one active assignment to a given scope).
  async function confirmUnassignScope(): Promise<void> {
    if (!pendingUnassignScope || priceTypeId == null) return;
    const scope = pendingUnassignScope;
    setPendingUnassignScope(null);
    setScopeBusy(scope.id, true);
    try {
      await priceTypesService.unassignScope(priceTypeId, scope.id);
      onFormChange({ ...form, price_scopes: form.price_scopes.filter((s) => s.id !== scope.id) });
      toast.success(t("priceType.scopeUnassigned"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("priceType.scopeUnassignFailed"));
    } finally {
      setScopeBusy(scope.id, false);
    }
  }

  function removeScope(scopeId: number) {
    onFormChange({ ...form, scopes: form.scopes.filter((s) => s.id !== scopeId) });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode !== "create") return;
    if (!validateGeneralInfo()) { setActiveTab("general"); return; }
    if (!validateLocale()) { setActiveTab("locales"); return; }
    if (!validateScopes()) { setActiveTab("scopes"); return; }
    setSubmitting(true);
    try {
      await priceTypesService.create({
        code: form.code.trim().toUpperCase(),
        sort_order: Number(form.sort_order) || 0,
        price_scope_ids: form.scopes.map((s) => s.id),
        locale: {
          name: form.locale.name.trim(),
          description: form.locale.description.trim(),
          sort_order: Number(form.locale.sort_order) || 0,
          purpose: form.locale.purpose.trim(),
          usage_example: form.locale.usage_example.trim(),
        },
      });
      clearDraft();
      toast.success(t("priceType.createdToast"));
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const isEditing = generalEditing || translationsEditing;
  const headerTitle = mode === "create" ? t("dialog.priceType.new") : (isEditing ? t("dialog.priceType.edit") : t("dialog.priceType.view"));
  const headerDesc = mode === "create" ? t("dialog.priceType.desc.create") : (isEditing ? t("dialog.priceType.desc.edit") : t("dialog.priceType.desc.view"));

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => { if (!v) requestClose(); }}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl p-0 gap-0 overflow-hidden flex flex-col h-full"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose(); }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">

            <DialogEntityHeader icon={<Tag className="h-4 w-4" />} title={headerTitle} description={headerDesc} />

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "general" | "locales" | "scopes")}
              className="flex-1 min-h-0 flex-col"
            >
              <div className="flex items-center justify-between mx-6 mt-4 gap-2">
                <TabsList className="w-fit shrink-0">
                  <TabsTrigger value="general">{t("common.generalInfo")}</TabsTrigger>
                  <TabsTrigger value="locales" disabled={mode === "create" && !isGeneralInfoValid()}>
                    {t("locale.translations")}
                  </TabsTrigger>
                  <TabsTrigger value="scopes" disabled={mode === "create" && !(isGeneralInfoValid() && isLocaleValid())}>
                    {t("priceType.scopes")}
                  </TabsTrigger>
                </TabsList>
                {mode !== "create" && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={handleRefresh}
                    disabled={refreshing || (activeTab === "general" ? generalEditing : translationsEditing)}
                    title={t("common.refresh")}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  </Button>
                )}
              </div>

              <TabsContent value="general" className="min-h-0 overflow-y-auto px-6 py-5">
                <PriceTypeGeneralInfo
                  mode={mode}
                  form={form}
                  onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                  priceTypeId={priceTypeId}
                  onSaved={onSaved}
                  editing={generalEditing}
                  onEditingChange={setGeneralEditing}
                  open={open}
                />
              </TabsContent>

              <TabsContent value="locales" className="min-h-0 overflow-y-auto px-6 py-5">
                <PriceTypeLocaleTranslations
                  mode={mode}
                  form={form}
                  onFormChange={onFormChange}
                  priceTypeId={priceTypeId}
                  onSaved={onSaved}
                  editing={translationsEditing}
                  onEditingChange={setTranslationsEditing}
                  onPrepareAdd={prepareAddLocale}
                  search={localeSearch}
                  onSearchChange={setLocaleSearch}
                  open={open}
                  availableLocales={availableLocales}
                  totalLocaleCount={totalLocaleCount}
                  priceTypeLocaleCodes={priceTypeLocaleCodes}
                />
              </TabsContent>

              <TabsContent value="scopes" className="min-h-0 overflow-y-auto px-6 py-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                      {t("priceType.scopes")}
                    </h3>
                  </div>

                  {mode === "create" ? (
                    <>
                      {form.scopes.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {form.scopes.map((s) => (
                            <Card key={s.id}>
                              <CardContent className="flex items-center gap-3 py-3">
                                <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-primary/20 text-primary">
                                  <Layers className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-sm truncate">{s.locale?.name ?? s.code}</p>
                                  <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-4 mt-1">
                                    {s.code}
                                  </Badge>
                                </div>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 shrink-0"
                                  onClick={() => removeScope(s.id)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 text-sm text-muted-foreground border rounded-xl border-dashed">
                          {t("priceType.scopeEmpty")}
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setScopePickerOpen(true)}
                      >
                        <Plus className="h-3.5 w-3.5" /> {t("priceType.addScope")}
                      </Button>
                    </>
                  ) : (
                    <>
                      {form.price_scopes.length === 0 && (
                        <p className="text-sm text-muted-foreground">{t("priceType.scopeEmpty")}</p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {form.price_scopes.map((s) => {
                          const busy = busyScopeIds.has(s.id);
                          return (
                            <Card key={s.id}>
                              <CardContent className="flex items-center gap-3 py-3">
                                <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-primary/20 text-primary">
                                  <Layers className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-sm truncate">{s.locale?.name ?? s.code}</p>
                                  <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-4 mt-1">
                                    {s.code}
                                  </Badge>
                                </div>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 shrink-0"
                                  disabled={busy}
                                  onClick={() => setPendingUnassignScope(s)}
                                >
                                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })}
                        <Card
                          role="button"
                          aria-disabled={allScopesAssigned}
                          tabIndex={allScopesAssigned ? -1 : 0}
                          onClick={() => { if (!allScopesAssigned) setScopePickerOpen(true); }}
                          onKeyDown={(e) => {
                            if (allScopesAssigned) return;
                            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setScopePickerOpen(true); }
                          }}
                          className={
                            allScopesAssigned
                              ? "cursor-not-allowed border-2 border-dashed border-muted-foreground/20 bg-muted/20 shadow-none ring-0 opacity-60"
                              : "group/assign cursor-pointer border-2 border-dashed border-primary/25 bg-primary/3 shadow-none ring-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          }
                        >
                          <CardContent className="flex items-center gap-3 py-3">
                            <div
                              className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 ${
                                allScopesAssigned ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary group-hover/assign:scale-110 group-hover/assign:rotate-90"
                              }`}
                            >
                              <Plus className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`font-semibold text-sm truncate ${allScopesAssigned ? "text-muted-foreground" : "text-primary"}`}>
                                {t("priceType.assignScope")}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {allScopesAssigned ? t("priceType.assignScopeAllAssigned") : t("priceType.assignScopeHint")}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {mode === "create" && activeTab === "general" && (
              <div className={`shrink-0 px-6 py-4 border-t bg-muted/40 flex items-center gap-2 ${draftIndicator ? "justify-between" : "justify-end"}`}>
                {draftIndicator}
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={requestClose} className="gap-1.5">
                    <X className="h-3.5 w-3.5" /> {t("common.cancel")}
                  </Button>
                  <Button type="button" size="sm" onClick={handleNext} disabled={!isGeneralInfoValid()} className="gap-1.5">
                    {t("common.next")} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {mode === "create" && activeTab === "locales" && (
              <div className={`shrink-0 px-6 py-4 border-t bg-muted/40 flex items-center gap-2 ${draftIndicator ? "justify-between" : "justify-end"}`}>
                {draftIndicator}
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={requestClose} className="gap-1.5">
                    <X className="h-3.5 w-3.5" /> {t("common.cancel")}
                  </Button>
                  <Button type="button" size="sm" onClick={handleNextFromLocales} disabled={!isLocaleValid()} className="gap-1.5">
                    {t("common.next")} <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {mode === "create" && activeTab === "scopes" && (
              <DialogCreateFooter submitting={submitting} onCancel={requestClose} disabled={!isScopesValid()} indicator={draftIndicator} />
            )}

          </form>
        </SheetContent>
      </Sheet>

      <PriceScopePickerDialog
        open={scopePickerOpen}
        onOpenChange={setScopePickerOpen}
        excludeIds={(mode === "create" ? form.scopes : form.price_scopes).map((s) => s.id)}
        onSelect={mode === "create" ? addScope : handleAssignScope}
      />

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialog.discardChanges.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("dialog.discardChanges.desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onOpenChange(false)}>
              {t("dialog.discardChanges.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pendingUnassignScope} onOpenChange={(v) => { if (!v) setPendingUnassignScope(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("priceType.scopeUnassignTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("priceType.scopeUnassignDesc", { code: pendingUnassignScope?.code })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnassignScope}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!draftPrompt} onOpenChange={(v) => { if (!v) discardDraft(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialog.restoreDraft.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("dialog.restoreDraft.descPriceType")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={discardDraft}>{t("dialog.restoreDraft.discard")}</AlertDialogCancel>
            <AlertDialogAction onClick={restoreDraft}>{t("dialog.restoreDraft.restore")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
