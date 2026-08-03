import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Globe, RefreshCw, Save, X } from "lucide-react";
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
import { countriesService } from "@/services/countries";
import { toast } from "sonner";
import type { CountryDialogMode, CountryFormState } from "./types";
import { CountryGeneralInfo } from "./country-general-info";
import { CountryLocaleTranslations } from "./country-locale-translations";

export const emptyCountryForm: CountryFormState = {
  code: "",
  iso3_code: "",
  phone_code: "",
  sort_order: 0,
  locale: { name: "", description: "", sort_order: 0 },
  locales: [],
};

const CODE_PATTERN = /^[A-Z]{2}$/;
const ISO3_PATTERN = /^[A-Z]{3}$/;
const PHONE_PATTERN = /^[0-9]{1,3}$/;
// Create only ever submits the "en" translation — keep it English/ASCII.
const ENGLISH_TEXT_PATTERN = /^[\x00-\x7F]*$/;

// Local autosave for the create form — never sent to the backend, just a browser-local checkpoint.
const DRAFT_STORAGE_KEY = "country-dialog-draft";
const DRAFT_SAVE_DEBOUNCE_MS = 500;

function hasDraftContent(f: CountryFormState): boolean {
  return f.code.trim() !== "" || f.iso3_code.trim() !== "" || f.phone_code.trim() !== ""
    || f.locale.name.trim() !== "" || f.locale.description.trim() !== "";
}

function readDraft(): CountryFormState | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CountryFormState;
    return hasDraftContent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

export interface CountryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: CountryDialogMode;
  countryId?: number;
  form: CountryFormState;
  onFormChange: (form: CountryFormState) => void;
  onSaved?: () => void | Promise<void>;
}

export function CountryDialog({
  open,
  onOpenChange,
  mode,
  countryId,
  form,
  onFormChange,
  onSaved,
}: CountryDialogProps) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [generalEditing, setGeneralEditing] = useState(false);
  const [translationsEditing, setTranslationsEditing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "locales">("general");
  const [refreshing, setRefreshing] = useState(false);
  const [localesLoaded, setLocalesLoaded] = useState(false);
  // Owned here (not inside CountryLocaleTranslations) so it survives that component unmounting
  // when the user switches away from the tab and back — otherwise the search text resets to
  // empty on remount while `form.locales` stays whatever the last search had filtered it to,
  // showing a filtered list next to an empty, out-of-sync search box.
  const [localeSearch, setLocaleSearch] = useState("");
  const lastLocaleSearchKey = useRef("");
  const [draftPrompt, setDraftPrompt] = useState<CountryFormState | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [draftSyncing, setDraftSyncing] = useState(false);

  useEffect(() => {
    if (!open) {
      setGeneralEditing(false);
      setTranslationsEditing(false);
      setConfirmClose(false);
      setActiveTab("general");
      setDraftPrompt(null);
      setDraftSavedAt(null);
      setDraftSyncing(false);
      setLocalesLoaded(false);
      setLocaleSearch("");
      lastLocaleSearchKey.current = "";
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
  // autosaved. Create is covered by the local draft (see draftIndicator above), so closing it
  // never needs a confirm: the in-progress data is already safely persisted to resume later.
  const isDirty = generalEditing || translationsEditing;

  function requestClose() {
    if (mode === "create") { onOpenChange(false); return; }
    if (isDirty) setConfirmClose(true);
    else onOpenChange(false);
  }

  // Silent check — drives the "locales" tab's disabled state without firing toasts on every render.
  function isGeneralInfoValid(): boolean {
    const code = form.code.trim().toUpperCase();
    const iso3 = form.iso3_code.trim().toUpperCase();
    const phone = form.phone_code.trim();
    return CODE_PATTERN.test(code) && ISO3_PATTERN.test(iso3) && PHONE_PATTERN.test(phone);
  }

  // Same checks, but reports which field is missing/invalid — used by both the Next button and submit.
  function validateGeneralInfo(): boolean {
    const code = form.code.trim().toUpperCase();
    const iso3 = form.iso3_code.trim().toUpperCase();
    const phone = form.phone_code.trim();
    if (!CODE_PATTERN.test(code)) { toast.error(t("toast.codeInvalid")); return false; }
    if (!ISO3_PATTERN.test(iso3)) { toast.error(t("toast.iso3Invalid")); return false; }
    if (!PHONE_PATTERN.test(phone)) { toast.error(t("toast.phoneInvalid")); return false; }
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
    if (countryId == null) return;
    const res = await countriesService.listLocales(countryId, { size: 50, localeCode: localeCode || undefined });
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
  }

  // Translations are only fetched once the tab is actually selected — not when the country card
  // is opened — and only the first time per dialog session; re-selecting the tab afterward reuses
  // what's already loaded. Use the Refresh button for an explicit re-fetch.
  useEffect(() => {
    if (!open || mode === "create" || activeTab !== "locales" || localesLoaded) return;
    setLocalesLoaded(true);
    fetchLocales().catch((err) => toast.error((err as Error).message));
  }, [open, mode, activeTab, localesLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced server-side search, view mode only — edit mode always needs the complete,
  // unfiltered list (see CountryLocaleTranslations' duplicate-locale checks).
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
  // existing translation doesn't need this: CountryLocaleTranslations drives `translationsEditing`
  // itself based on whether any row has an open draft.
  function prepareAddLocale() {
    setLocaleSearch("");
    lastLocaleSearchKey.current = "";
    fetchLocales().catch((err) => toast.error((err as Error).message));
  }

  // Manual refresh only — switching tabs never re-fetches on its own otherwise. Pulls whichever the
  // active tab needs: general info re-hits GET /countries/{id}, translations re-hits the locales
  // sub-resource (honoring whatever search filter is currently applied).
  async function handleRefresh() {
    if (countryId == null) return;
    setRefreshing(true);
    try {
      if (activeTab === "general") {
        const res = await countriesService.get(countryId);
        const full = res.data;
        onFormChange({
          ...form,
          iso3_code: full.iso3_code ?? "",
          phone_code: full.phone_code ?? "",
          sort_order: full.sort_order,
        });
      } else {
        await fetchLocales(localeSearch.trim());
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
    return form.locale.name.trim() !== "" && form.locale.description.trim() !== ""
      && ENGLISH_TEXT_PATTERN.test(form.locale.name) && ENGLISH_TEXT_PATTERN.test(form.locale.description);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode !== "create") return;
    if (!validateGeneralInfo()) { setActiveTab("general"); return; }
    const iso3 = form.iso3_code.trim().toUpperCase();
    const phone = form.phone_code.trim();
    if (!form.locale.name.trim()) { toast.error(t("toast.localeNameRequired", { n: 1 })); return; }
    if (!ENGLISH_TEXT_PATTERN.test(form.locale.name)) { toast.error(t("toast.localeNameEnglishOnly")); return; }
    if (!form.locale.description.trim()) { toast.error(t("toast.localeDescriptionRequired", { n: 1 })); return; }
    if (!ENGLISH_TEXT_PATTERN.test(form.locale.description)) { toast.error(t("toast.localeDescriptionEnglishOnly")); return; }
    setSubmitting(true);
    try {
      const code = form.code.trim().toUpperCase();
      await countriesService.create({
        code,
        iso3_code: iso3,
        phone_code: phone,
        sort_order: Number(form.sort_order) || 0,
        locale: {
          name: form.locale.name.trim(),
          description: form.locale.description.trim(),
          sort_order: Number(form.locale.sort_order) || 0,
        },
      });
      clearDraft();
      toast.success(t("countries.createdToast"));
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const isEditing = generalEditing || translationsEditing;
  const headerTitle = mode === "create" ? t("dialog.country.new") : (isEditing ? t("dialog.country.edit") : t("dialog.country.view"));
  const headerDesc = mode === "create" ? t("dialog.country.desc.create") : (isEditing ? t("dialog.country.desc.edit") : t("dialog.country.desc.view"));

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

            <DialogEntityHeader icon={<Globe className="h-4 w-4" />} title={headerTitle} description={headerDesc} />

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
                <CountryGeneralInfo
                  mode={mode}
                  form={form}
                  onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                  countryId={countryId}
                  onSaved={onSaved}
                  editing={generalEditing}
                  onEditingChange={setGeneralEditing}
                  open={open}
                />
              </TabsContent>

              <TabsContent value="locales" className="min-h-0 overflow-y-auto px-6 py-5">
                <CountryLocaleTranslations
                  mode={mode}
                  form={form}
                  onFormChange={onFormChange}
                  countryId={countryId}
                  onSaved={onSaved}
                  editing={translationsEditing}
                  onEditingChange={setTranslationsEditing}
                  onPrepareAdd={prepareAddLocale}
                  search={localeSearch}
                  onSearchChange={setLocaleSearch}
                  open={open}
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
            <AlertDialogDescription>{t("dialog.restoreDraft.desc")}</AlertDialogDescription>
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
