import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, RefreshCw } from "lucide-react";
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
import { daysOfWeekService } from "@/services/days-of-week";
import type { Locale } from "@/services/locales";
import { useLocales } from "@/providers/locales-provider";
import { toast } from "sonner";
import type { DayOfWeekFormState } from "./types";
import { DayOfWeekGeneralInfo } from "./day-of-week-general-info";
import { DayOfWeekLocaleTranslations } from "./day-of-week-locale-translations";

export interface DayOfWeekDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayOfWeekId?: number;
  form: DayOfWeekFormState;
  onFormChange: (form: DayOfWeekFormState) => void;
  onSaved?: () => void | Promise<void>;
}

// Unlike the entity dialogs this was modeled on (Country/ContactType/...), there is no create mode
// and no "edit general info" affordance here — the seven day-of-week records are platform-seeded
// and read-only through the API, only their locale translations can be managed.
export function DayOfWeekDialog({
  open,
  onOpenChange,
  dayOfWeekId,
  form,
  onFormChange,
  onSaved,
}: DayOfWeekDialogProps) {
  const { t } = useTranslation();
  const [translationsEditing, setTranslationsEditing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "locales">("general");
  const [refreshing, setRefreshing] = useState(false);
  const [localesLoaded, setLocalesLoaded] = useState(false);
  // Authoritative set of locale codes this day already has a translation for, from
  // `GET /days-of-week/{id}/locales/count` — not derived from `form.locales`, which only ever holds
  // one page (size 10) of the paginated sub-resource and can undercount past that.
  const [dayOfWeekLocaleCodes, setDayOfWeekLocaleCodes] = useState<string[] | null>(null);
  // The language catalog is loaded once per session by LocalesProvider and shared across every
  // entity dialog — no per-dialog fetch needed except as a fallback in prepareAddLocale.
  const { locales: availableLocales, totalCount: totalLocaleCount, refresh: refreshLocalesCatalog, refreshCount: refreshLocalesCount } = useLocales();
  // Owned here so it survives DayOfWeekLocaleTranslations-style unmount on tab switch.
  const [localeSearch, setLocaleSearch] = useState("");
  const lastLocaleSearchKey = useRef("");

  useEffect(() => {
    if (!open) {
      setTranslationsEditing(false);
      setConfirmClose(false);
      setActiveTab("general");
      setLocalesLoaded(false);
      setLocaleSearch("");
      lastLocaleSearchKey.current = "";
      setDayOfWeekLocaleCodes(null);
    }
  }, [open]);

  const isDirty = translationsEditing;

  function requestClose() {
    if (isDirty) setConfirmClose(true);
    else onOpenChange(false);
  }

  // Shared by the lazy first-load, the search box, and the manual refresh button.
  async function fetchLocales(localeCode?: string): Promise<void> {
    if (dayOfWeekId == null) return;
    const res = await daysOfWeekService.listLocales(dayOfWeekId, { size: 10, localeCode: localeCode || undefined });
    onFormChange({
      ...form,
      locales: res.data.map((l) => ({
        id: l.id,
        locale: l.locale,
        name: l.name,
        short_name: l.short_name,
        description: l.description ?? "",
        sort_order: l.sort_order,
      })),
    });
  }

  async function fetchLocaleCodes(): Promise<void> {
    if (dayOfWeekId == null) return;
    const res = await daysOfWeekService.countLocales(dayOfWeekId);
    setDayOfWeekLocaleCodes(res.codes);
  }

  // Translations are only fetched once the tab is actually selected — not when the day-of-week
  // card is opened — and only the first time per dialog session; re-selecting the tab afterward
  // reuses what's already loaded. Use the Refresh button for an explicit re-fetch.
  useEffect(() => {
    if (!open || activeTab !== "locales" || localesLoaded) return;
    setLocalesLoaded(true);
    Promise.all([fetchLocales(), fetchLocaleCodes()]).catch((err) => toast.error((err as Error).message));
  }, [open, activeTab, localesLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced server-side search — skipped entirely while a row is being edited, which always needs
  // the complete, unfiltered list (see DayOfWeekLocaleTranslations' duplicate-locale checks).
  useEffect(() => {
    if (!open || translationsEditing) return;
    if (lastLocaleSearchKey.current === localeSearch) return;
    lastLocaleSearchKey.current = localeSearch;
    const timer = setTimeout(() => {
      fetchLocales(localeSearch.trim()).catch((err) => toast.error((err as Error).message));
    }, 350);
    return () => clearTimeout(timer);
  }, [localeSearch, open, translationsEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Adding a translation always needs the complete list — clear any active search and re-pull
  // everything first, so duplicate-locale checks never operate on a filtered subset. The shared
  // language catalog is normally already loaded (LocalesProvider fetched it at session start) —
  // this only re-fetches it as a fallback if the provider's own load somehow hasn't resolved yet.
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

  // Manual refresh only — switching tabs never re-fetches on its own otherwise.
  async function handleRefresh() {
    if (dayOfWeekId == null) return;
    setRefreshing(true);
    try {
      if (activeTab === "general") {
        const res = await daysOfWeekService.get(dayOfWeekId);
        onFormChange({ ...form, code: res.data.code, sort_order: res.data.sort_order });
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

  const headerTitle = translationsEditing ? t("dialog.dayOfWeek.edit") : t("dialog.dayOfWeek.view");
  const headerDesc = translationsEditing ? t("dialog.dayOfWeek.desc.edit") : t("dialog.dayOfWeek.desc.view");

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => { if (!v) requestClose(); }}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl p-0 gap-0 overflow-hidden flex flex-col h-full"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose(); }}
        >
          <div className="flex flex-col min-h-0 flex-1">

            <DialogEntityHeader icon={<CalendarDays className="h-4 w-4" />} title={headerTitle} description={headerDesc} />

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "general" | "locales")}
              className="flex-1 min-h-0 flex-col"
            >
              <div className="flex items-center justify-between mx-6 mt-4 gap-2">
                <TabsList className="w-fit shrink-0">
                  <TabsTrigger value="general">{t("common.generalInfo")}</TabsTrigger>
                  <TabsTrigger value="locales">{t("locale.translations")}</TabsTrigger>
                </TabsList>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  onClick={handleRefresh}
                  disabled={refreshing || (activeTab === "locales" && translationsEditing)}
                  title={t("common.refresh")}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>

              <TabsContent value="general" className="min-h-0 overflow-y-auto px-6 py-5">
                <DayOfWeekGeneralInfo form={form} />
              </TabsContent>

              <TabsContent value="locales" className="min-h-0 overflow-y-auto px-6 py-5">
                <DayOfWeekLocaleTranslations
                  form={form}
                  onFormChange={onFormChange}
                  dayOfWeekId={dayOfWeekId}
                  onSaved={onSaved}
                  editing={translationsEditing}
                  onEditingChange={setTranslationsEditing}
                  onPrepareAdd={prepareAddLocale}
                  search={localeSearch}
                  onSearchChange={setLocaleSearch}
                  open={open}
                  availableLocales={availableLocales}
                  totalLocaleCount={totalLocaleCount}
                  dayOfWeekLocaleCodes={dayOfWeekLocaleCodes}
                />
              </TabsContent>
            </Tabs>
          </div>
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
    </>
  );
}
