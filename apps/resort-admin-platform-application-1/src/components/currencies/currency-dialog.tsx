import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Coins, RefreshCw, Save, X } from "lucide-react";
import { Button, Sheet, SheetContent } from "@resort/shadcn-ui";
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
import { currenciesService } from "@/services/currencies";
import type { Locale } from "@/services/locales";
import { useLocales } from "@/providers/locales-provider";
import { toast } from "sonner";
import type { CurrencyDialogMode, CurrencyFormState } from "./types";
import { CurrencyGeneralInfo } from "./currency-general-info";
import { CurrencyLocaleTranslations } from "./currency-locale-translations";

export const emptyCurrencyForm: CurrencyFormState = {
  country_id: "",
  code: "",
  numeric_code: "",
  symbol: "",
  decimal_places: 2,
  is_default: false,
  sort_order: 0,
  locale: { name: "", short_name: "", sort_order: 0 },
  locales: [],
};

const CODE_PATTERN = /^[A-Z]{3}$/;
const NUMERIC_CODE_PATTERN = /^[0-9]{3}$/;
// Create only ever submits the "en" translation — keep it English/ASCII.
const ENGLISH_TEXT_PATTERN = /^[\x00-\x7F]*$/;

// Local autosave for the create form — never sent to the backend, just a browser-local checkpoint.
const DRAFT_STORAGE_KEY = "currency-dialog-draft";
const DRAFT_SAVE_DEBOUNCE_MS = 500;

function hasDraftContent(f: CurrencyFormState): boolean {
  return f.country_id !== "" || f.code.trim() !== "" || f.numeric_code.trim() !== "" || f.symbol.trim() !== ""
    || f.locale.name.trim() !== "" || f.locale.short_name.trim() !== "";
}

function readDraft(): CurrencyFormState | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CurrencyFormState;
    return hasDraftContent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

export interface CurrencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: CurrencyDialogMode;
  currencyId?: number;
  /** Pre-set country (opened from a country's own detail page) — hides the country picker in create mode */
  fixedCountryId?: number;
  /** Display label for the resolved country, used in view/edit and alongside fixedCountryId */
  countryLabel?: string;
  form: CurrencyFormState;
  onFormChange: (form: CurrencyFormState) => void;
  onSaved?: () => void | Promise<void>;
}

export function CurrencyDialog({
  open,
  onOpenChange,
  mode,
  currencyId,
  fixedCountryId,
  countryLabel,
  form,
  onFormChange,
  onSaved,
}: CurrencyDialogProps) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [generalEditing, setGeneralEditing] = useState(false);
  const [translationsEditing, setTranslationsEditing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "locales">("general");
  const [refreshing, setRefreshing] = useState(false);
  const [localesLoaded, setLocalesLoaded] = useState(false);
  // Authoritative set of locale codes this currency already has a translation for, from
  // `GET /currencies/{id}/locales/count` — not derived from `form.locales`, which only ever holds
  // one page (size 10) of the paginated sub-resource and can undercount past that. Compared against
  // the platform-wide codes from `useLocales()` to know which languages are still addable. `null`
  // until the first fetch resolves.
  const [currencyLocaleCodes, setCurrencyLocaleCodes] = useState<string[] | null>(null);
  // Owned here (not inside CurrencyLocaleTranslations) so it survives that component unmounting when
  // the user switches away from the tab and back — see [[feedback_tab_content_state]] and
  // [[feedback_dialog_lazy_tab_load]] (same fix already applied to Country and City).
  const [localeSearch, setLocaleSearch] = useState("");
  const lastLocaleSearchKey = useRef("");
  // The language catalog is loaded once per session (right after login) by LocalesProvider and
  // shared across every entity dialog — no per-dialog fetch needed. `refreshLocalesCatalog` is only
  // used as an explicit re-sync (a fallback in prepareAddLocale) for locales created elsewhere during
  // the current session, since the shared copy otherwise never auto-updates. The manual Refresh
  // button only needs `refreshLocalesCount` (GET /locales/count) — the full paginated catalog
  // (GET /locales) is only ever needed by the +Add language picker.
  const { locales: availableLocales, totalCount: totalLocaleCount, refresh: refreshLocalesCatalog, refreshCount: refreshLocalesCount } = useLocales();
  const [draftPrompt, setDraftPrompt] = useState<CurrencyFormState | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [draftSyncing, setDraftSyncing] = useState(false);

  useEffect(() => {
    if (!open) {
      setGeneralEditing(false);
      setTranslationsEditing(false);
      setConfirmClose(false);
      setActiveTab("general");
      setLocalesLoaded(false);
      setLocaleSearch("");
      lastLocaleSearchKey.current = "";
      setCurrencyLocaleCodes(null);
      setDraftPrompt(null);
      setDraftSavedAt(null);
      setDraftSyncing(false);
    }
  }, [open]);

  // On opening a fresh create form, offer to resume a locally-saved draft.
  useEffect(() => {
    if (open && mode === "create") {
      setDraftPrompt(readDraft());
    }
  }, [open, mode]);

  // Debounced local autosave of the create form.
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

  // Edit/view only — create is covered by the local draft, so closing it never needs a confirm.
  const isDirty = generalEditing || translationsEditing;

  function requestClose() {
    if (mode === "create") { onOpenChange(false); return; }
    if (isDirty) setConfirmClose(true);
    else onOpenChange(false);
  }

  // Silent check — drives the "locales" tab's disabled state without firing toasts on every render.
  function isGeneralInfoValid(): boolean {
    const code = form.code.trim().toUpperCase();
    const numericCode = form.numeric_code.trim();
    const hasCountry = fixedCountryId != null || form.country_id !== "";
    return CODE_PATTERN.test(code) && NUMERIC_CODE_PATTERN.test(numericCode) && form.symbol.trim() !== "" && hasCountry;
  }

  // Same checks, but reports which field is missing/invalid — used by both the Next button and submit.
  function validateGeneralInfo(): boolean {
    const code = form.code.trim().toUpperCase();
    const numericCode = form.numeric_code.trim();
    if (fixedCountryId == null && form.country_id === "") { toast.error(t("toast.countryRequired")); return false; }
    if (!CODE_PATTERN.test(code)) { toast.error(t("toast.currencyCodeInvalid")); return false; }
    if (!NUMERIC_CODE_PATTERN.test(numericCode)) { toast.error(t("toast.numericCodeInvalid")); return false; }
    if (!form.symbol.trim()) { toast.error(t("toast.symbolRequired")); return false; }
    return true;
  }

  function handleNext() {
    if (!validateGeneralInfo()) return;
    setActiveTab("locales");
  }

  // Shared by the lazy first-load, the search box, and the manual refresh button. The sub-resource
  // is paginated and this dialog only ever holds one page of it, so search re-hits the server with
  // localeCode rather than filtering whatever page happens to already be loaded.
  async function fetchLocales(localeCode?: string): Promise<void> {
    if (currencyId == null) return;
    const res = await currenciesService.listLocales(currencyId, { size: 10, localeCode: localeCode || undefined });
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
  }

  // Companion to fetchLocales — hits the currency's own /locales/count sub-resource for the
  // authoritative, unpaginated set of locale codes it already has a translation for. Kept separate
  // from fetchLocales since it doesn't need to re-run on every search keystroke, only on tab load,
  // manual refresh, and right before the +Add picker needs an up-to-date used/available split.
  async function fetchLocaleCodes(): Promise<void> {
    if (currencyId == null) return;
    const res = await currenciesService.countLocales(currencyId);
    setCurrencyLocaleCodes(res.codes);
  }

  // Translations are only fetched once the tab is actually selected — not when the currency card
  // is opened — and only the first time per dialog session; re-selecting the tab afterward reuses
  // what's already loaded. Use the Refresh button for an explicit re-fetch. The language catalog
  // needs no fetch here at all — LocalesProvider already loaded it once for the whole session.
  useEffect(() => {
    if (!open || mode === "create" || activeTab !== "locales" || localesLoaded) return;
    setLocalesLoaded(true);
    Promise.all([fetchLocales(), fetchLocaleCodes()]).catch((err) => toast.error((err as Error).message));
  }, [open, mode, activeTab, localesLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced server-side search, view mode only — edit mode always needs the complete,
  // unfiltered list (see CurrencyLocaleTranslations' duplicate-locale checks).
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
  // everything first, so duplicate-locale checks never operate on a filtered subset. Editing an
  // existing translation doesn't need this: CurrencyLocaleTranslations drives `translationsEditing`
  // itself based on whether any row has an open draft. The shared language catalog is normally
  // already loaded (LocalesProvider fetched it at session start) — this only re-fetches it as a
  // fallback if the provider's own load somehow hasn't resolved yet.
  //
  // Returns the up-to-date catalog (not just fires the fetch) so the caller can reliably check
  // "are all locales already used" right after awaiting this — reading the `availableLocales`
  // variable here wouldn't work if a refresh were in flight, since its value from this closure
  // wouldn't reflect a fetch that resolves later; only the returned array does.
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

  // Manual refresh only — switching tabs never re-fetches on its own otherwise. Pulls whichever the
  // active tab needs: general info re-hits GET /currencies/{id}, translations re-hits the locales
  // sub-resource (honoring whatever search filter is currently applied) plus just the shared
  // language count (GET /locales/count) and this currency's own locale-code count — the full
  // paginated catalog (GET /locales) is only ever needed by the +Add language picker, not a refresh.
  async function handleRefresh() {
    if (currencyId == null) return;
    setRefreshing(true);
    try {
      if (activeTab === "general") {
        const res = await currenciesService.get(currencyId);
        const full = res.data;
        onFormChange({
          ...form,
          symbol: full.symbol,
          decimal_places: full.decimal_places,
          is_default: full.is_default,
          sort_order: full.sort_order,
        });
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

  // Silent check — drives the Create button's disabled state without firing toasts on every render.
  function isLocaleValid(): boolean {
    return form.locale.name.trim() !== "" && ENGLISH_TEXT_PATTERN.test(form.locale.name) && ENGLISH_TEXT_PATTERN.test(form.locale.short_name);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode !== "create") return;
    if (!validateGeneralInfo()) { setActiveTab("general"); return; }
    const resolvedCountryId = fixedCountryId ?? Number(form.country_id);
    if (!form.locale.name.trim()) { toast.error(t("toast.localeNameRequired", { n: 1 })); return; }
    if (!ENGLISH_TEXT_PATTERN.test(form.locale.name)) { toast.error(t("toast.localeNameEnglishOnly")); return; }
    if (!ENGLISH_TEXT_PATTERN.test(form.locale.short_name)) { toast.error(t("toast.localeNameEnglishOnly")); return; }
    setSubmitting(true);
    try {
      const code = form.code.trim().toUpperCase();
      const numericCode = form.numeric_code.trim();
      await currenciesService.create({
        code,
        numeric_code: numericCode,
        country_id: resolvedCountryId,
        symbol: form.symbol.trim(),
        decimal_places: Number(form.decimal_places) || 0,
        is_default: form.is_default,
        sort_order: Number(form.sort_order) || 0,
        locale: {
          name: form.locale.name.trim(),
          short_name: form.locale.short_name.trim() || undefined,
          sort_order: Number(form.locale.sort_order) || 0,
        },
      });
      clearDraft();
      toast.success(t("currencies.createdToast"));
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const isEditing = generalEditing || translationsEditing;
  const headerTitle = mode === "create" ? t("dialog.currency.new") : (isEditing ? t("dialog.currency.edit") : t("dialog.currency.view"));
  const headerDesc = mode === "create" ? t("dialog.currency.desc.create") : (isEditing ? t("dialog.currency.desc.edit") : t("dialog.currency.desc.view"));

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

            <DialogEntityHeader icon={<Coins className="h-4 w-4" />} title={headerTitle} description={headerDesc} />

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "general" | "locales")}
              className="flex-1 min-h-0 flex-col"
            >
              <div className="flex items-center justify-between mx-6 mt-4 gap-2">
                <TabsList className="w-fit shrink-0">
                  <TabsTrigger value="general">{t("common.generalInfo")}</TabsTrigger>
                  <TabsTrigger value="locales" disabled={mode === "create" && !isGeneralInfoValid()}>
                    {t("locale.translations")}
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
                <CurrencyGeneralInfo
                  mode={mode}
                  form={form}
                  onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                  currencyId={currencyId}
                  fixedCountryId={fixedCountryId}
                  countryLabel={countryLabel}
                  onSaved={onSaved}
                  editing={generalEditing}
                  onEditingChange={setGeneralEditing}
                  open={open}
                />
              </TabsContent>

              <TabsContent value="locales" className="min-h-0 overflow-y-auto px-6 py-5">
                <CurrencyLocaleTranslations
                  mode={mode}
                  form={form}
                  onFormChange={onFormChange}
                  currencyId={currencyId}
                  onSaved={onSaved}
                  editing={translationsEditing}
                  onEditingChange={setTranslationsEditing}
                  onPrepareAdd={prepareAddLocale}
                  search={localeSearch}
                  onSearchChange={setLocaleSearch}
                  open={open}
                  availableLocales={availableLocales}
                  totalLocaleCount={totalLocaleCount}
                  currencyLocaleCodes={currencyLocaleCodes}
                />
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
              <DialogCreateFooter submitting={submitting} onCancel={requestClose} disabled={!isLocaleValid()} indicator={draftIndicator} />
            )}

          </form>
        </SheetContent>
      </Sheet>

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

      <AlertDialog open={!!draftPrompt} onOpenChange={(v) => { if (!v) discardDraft(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialog.restoreDraft.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("dialog.restoreDraft.descCurrency")}</AlertDialogDescription>
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
