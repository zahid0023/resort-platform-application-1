import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, MapPin, RefreshCw, Save, X } from "lucide-react";
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
import { citiesService } from "@/services/cities";
import { toast } from "sonner";
import type { CityDialogMode, CityFormState } from "./types";
import { CityGeneralInfo } from "./city-general-info";
import { CityLocaleTranslations } from "./city-locale-translations";

export const emptyCityForm: CityFormState = {
  country_id: "",
  code: "",
  sort_order: 0,
  locale: { name: "", description: "", sort_order: 0 },
  locales: [],
};

const CODE_PATTERN = /^[A-Z]{3}$/;
// Create only ever submits the "en" translation — keep it English/ASCII.
const ENGLISH_TEXT_PATTERN = /^[\x00-\x7F]*$/;

// Local autosave for the create form — never sent to the backend, just a browser-local checkpoint.
const DRAFT_STORAGE_KEY = "city-dialog-draft";
const DRAFT_SAVE_DEBOUNCE_MS = 500;

function hasDraftContent(f: CityFormState): boolean {
  return f.country_id !== "" || f.code.trim() !== ""
    || f.locale.name.trim() !== "" || f.locale.description.trim() !== "";
}

function readDraft(): CityFormState | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CityFormState;
    return hasDraftContent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

export interface CityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: CityDialogMode;
  cityId?: number;
  /** Pre-set country (opened from a country's own detail page) — hides the country picker in create mode */
  fixedCountryId?: number;
  /** Display label for the resolved country, used in view/edit and alongside fixedCountryId */
  countryLabel?: string;
  form: CityFormState;
  onFormChange: (form: CityFormState) => void;
  onSaved?: () => void | Promise<void>;
}

export function CityDialog({
  open,
  onOpenChange,
  mode,
  cityId,
  fixedCountryId,
  countryLabel,
  form,
  onFormChange,
  onSaved,
}: CityDialogProps) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [generalEditing, setGeneralEditing] = useState(false);
  const [translationsEditing, setTranslationsEditing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "locales">("general");
  const [draftPrompt, setDraftPrompt] = useState<CityFormState | null>(null);
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
    const hasCountry = fixedCountryId != null || form.country_id !== "";
    return CODE_PATTERN.test(code) && hasCountry;
  }

  // Same checks, but reports which field is missing/invalid — used by both the Next button and submit.
  function validateGeneralInfo(): boolean {
    const code = form.code.trim().toUpperCase();
    if (fixedCountryId == null && form.country_id === "") { toast.error(t("toast.countryRequired")); return false; }
    if (!CODE_PATTERN.test(code)) { toast.error(t("toast.cityCodeInvalid")); return false; }
    return true;
  }

  function handleNext() {
    if (!validateGeneralInfo()) return;
    setActiveTab("locales");
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
    const resolvedCountryId = fixedCountryId ?? Number(form.country_id);
    if (!form.locale.name.trim()) { toast.error(t("toast.localeNameRequired", { n: 1 })); return; }
    if (!ENGLISH_TEXT_PATTERN.test(form.locale.name)) { toast.error(t("toast.localeNameEnglishOnly")); return; }
    if (!form.locale.description.trim()) { toast.error(t("toast.localeDescriptionRequired", { n: 1 })); return; }
    if (!ENGLISH_TEXT_PATTERN.test(form.locale.description)) { toast.error(t("toast.localeDescriptionEnglishOnly")); return; }
    setSubmitting(true);
    try {
      const code = form.code.trim().toUpperCase();
      await citiesService.create({
        code,
        country_id: resolvedCountryId,
        sort_order: Number(form.sort_order) || 0,
        locale: {
          name: form.locale.name.trim(),
          description: form.locale.description.trim(),
          sort_order: Number(form.locale.sort_order) || 0,
        },
      });
      clearDraft();
      toast.success(t("cities.createdToast"));
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const isEditing = generalEditing || translationsEditing;
  const headerTitle = mode === "create" ? t("dialog.city.new") : (isEditing ? t("dialog.city.edit") : t("dialog.city.view"));
  const headerDesc = mode === "create" ? t("dialog.city.desc.create") : (isEditing ? t("dialog.city.desc.edit") : t("dialog.city.desc.view"));

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

            <DialogEntityHeader icon={<MapPin className="h-4 w-4" />} title={headerTitle} description={headerDesc} />

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "general" | "locales")}
              className="flex-1 min-h-0 flex-col"
            >
              <TabsList className="mx-6 mt-4 w-fit shrink-0">
                <TabsTrigger value="general">{t("common.generalInfo")}</TabsTrigger>
                <TabsTrigger value="locales" disabled={mode === "create" && !isGeneralInfoValid()}>
                  {t("locale.translations")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="min-h-0 overflow-y-auto px-6 py-5">
                <CityGeneralInfo
                  mode={mode}
                  form={form}
                  onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                  cityId={cityId}
                  fixedCountryId={fixedCountryId}
                  countryLabel={countryLabel}
                  onSaved={onSaved}
                  editing={generalEditing}
                  onEditingChange={setGeneralEditing}
                  open={open}
                />
              </TabsContent>

              <TabsContent value="locales" className="min-h-0 overflow-y-auto px-6 py-5">
                <CityLocaleTranslations
                  mode={mode}
                  form={form}
                  onFormChange={onFormChange}
                  cityId={cityId}
                  onSaved={onSaved}
                  onEditingChange={setTranslationsEditing}
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
            <AlertDialogDescription>{t("dialog.restoreDraft.descCity")}</AlertDialogDescription>
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
