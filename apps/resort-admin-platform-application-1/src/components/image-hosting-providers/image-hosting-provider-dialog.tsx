import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, CloudIcon, RefreshCw, Save, X } from "lucide-react";
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
import { imageHostingProvidersService } from "@/services/image-hosting-providers";
import { toast } from "sonner";
import type { ImageHostingProviderDialogMode, ImageHostingProviderFormState } from "./types";
import { ImageHostingProviderGeneralInfo } from "./image-hosting-provider-general-info";
import { ImageHostingProviderConfigFields } from "./image-hosting-provider-config-fields";
import { ImageHostingProviderConfigs } from "./image-hosting-provider-configs";

export const emptyImageHostingProviderForm: ImageHostingProviderFormState = {
  code: "",
  name: "",
  description: "",
  sort_order: 0,
  config_fields: [{ key: "", label: "", field_type: "TEXT", placeholder: "", default_value: "", is_required: true, sort_order: 1, _new: true }],
  configs: [],
};

// Local autosave for the create form — never sent to the backend, just a browser-local checkpoint.
const DRAFT_STORAGE_KEY = "image-hosting-provider-dialog-draft";
const DRAFT_SAVE_DEBOUNCE_MS = 500;

function hasDraftContent(f: ImageHostingProviderFormState): boolean {
  return f.code.trim() !== "" || f.name.trim() !== "" || f.description.trim() !== ""
    || f.config_fields.some((r) => r.key.trim() !== "" || r.label.trim() !== "");
}

function readDraft(): ImageHostingProviderFormState | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ImageHostingProviderFormState;
    return hasDraftContent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

export interface ImageHostingProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ImageHostingProviderDialogMode;
  providerId?: number;
  form: ImageHostingProviderFormState;
  onFormChange: (form: ImageHostingProviderFormState) => void;
  onSaved?: () => void | Promise<void>;
}

export function ImageHostingProviderDialog({
  open,
  onOpenChange,
  mode,
  providerId,
  form,
  onFormChange,
  onSaved,
}: ImageHostingProviderDialogProps) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [generalEditing, setGeneralEditing] = useState(false);
  const [configFieldsEditing, setConfigFieldsEditing] = useState(false);
  const [configsEditing, setConfigsEditing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "configFields" | "configs">("general");
  const [refreshing, setRefreshing] = useState(false);
  const [configFieldsLoaded, setConfigFieldsLoaded] = useState(false);
  const [configsLoaded, setConfigsLoaded] = useState(false);
  // Owned here (not inside ImageHostingProviderConfigs) so it survives that component unmounting
  // when the user switches away from the tab and back — see [[feedback_tab_content_state]].
  const [configsSearch, setConfigsSearch] = useState("");
  const lastConfigsSearchKey = useRef("");
  const [draftPrompt, setDraftPrompt] = useState<ImageHostingProviderFormState | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [draftSyncing, setDraftSyncing] = useState(false);

  // `fetchConfigFields` and `fetchConfigs` both patch different fields of the same `form` object,
  // and both of their lazy-load effects can fire in the same commit when the Configs tab is opened
  // first (see the third effect below). If each spread the `form` closed over in its own render,
  // whichever async call resolves last would overwrite the other's just-applied update with the
  // stale value it captured before either fetch started — the resolved data silently disappears
  // even though the API returned it correctly. Reading `formRef.current` instead of `form` at the
  // point each response arrives always reflects whatever the other fetch already committed.
  const formRef = useRef(form);
  useEffect(() => { formRef.current = form; }, [form]);

  useEffect(() => {
    if (!open) {
      setGeneralEditing(false);
      setConfigFieldsEditing(false);
      setConfigsEditing(false);
      setConfirmClose(false);
      setActiveTab("general");
      setDraftPrompt(null);
      setDraftSavedAt(null);
      setDraftSyncing(false);
      setConfigFieldsLoaded(false);
      setConfigsLoaded(false);
      setConfigsSearch("");
      lastConfigsSearchKey.current = "";
    }
  }, [open]);

  // On opening a fresh create form, offer to resume a locally-saved draft.
  useEffect(() => {
    if (open && mode === "create") {
      setDraftPrompt(readDraft());
    }
  }, [open, mode]);

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
  const isDirty = generalEditing || configFieldsEditing || configsEditing;

  function requestClose() {
    if (mode === "create") { onOpenChange(false); return; }
    if (isDirty) setConfirmClose(true);
    else onOpenChange(false);
  }

  // Config fields are never embedded on the provider DTO — this sub-resource is the only way to
  // read them. Split into a pure data-fetcher plus a thin `onFormChange` wrapper so the merged
  // "landing on Configs" effect below can fetch this data WITHOUT it racing its own write against
  // `fetchConfigs`'s — see that effect for why.
  async function fetchConfigFieldsData() {
    if (providerId == null) return [];
    const rows = await imageHostingProvidersService.listConfigFields(providerId);
    return rows.map((f) => ({
      id: f.id,
      key: f.key,
      label: f.label,
      field_type: f.field_type,
      placeholder: f.placeholder,
      default_value: f.default_value,
      is_required: f.is_required,
      sort_order: f.sort_order,
    }));
  }

  async function fetchConfigFields(): Promise<void> {
    const config_fields = await fetchConfigFieldsData();
    onFormChange({ ...formRef.current, config_fields });
  }

  // Shared by the lazy first-load, the search box, and the manual refresh button. Configs are a
  // genuinely paginated sub-resource; this dialog only ever holds one page (size 50), same
  // simplification the Country pattern uses for locale translations.
  async function fetchConfigsData(name?: string) {
    if (providerId == null) return [];
    const res = await imageHostingProvidersService.listConfigs(providerId, { size: 50, name: name || undefined });
    return res.data.map((c) => ({ id: c.id, name: c.name, config: c.config }));
  }

  async function fetchConfigs(name?: string): Promise<void> {
    const configs = await fetchConfigsData(name);
    onFormChange({ ...formRef.current, configs });
  }

  // Config fields are fetched once the "Config Fields" tab is actually selected — not when the
  // provider card is opened — and only the first time per dialog session; re-selecting the tab
  // afterward reuses what's already loaded. Use the Refresh button for an explicit re-fetch.
  useEffect(() => {
    if (!open || mode === "create" || activeTab !== "configFields" || configFieldsLoaded) return;
    setConfigFieldsLoaded(true);
    fetchConfigFields().catch((err) => toast.error((err as Error).message));
  }, [open, mode, activeTab, configFieldsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // The Configs tab needs both its own list AND the field schema (to render each config's per-field
  // inputs — see ImageHostingProviderConfigs). Landing on Configs directly (without ever visiting
  // Config Fields first) means both are still unloaded, so both fetches must fire together. Doing
  // that as two separate effects each calling `onFormChange({ ...form, ownField })` raced: both
  // closed over the same pre-fetch `form`, so whichever async call resolved last overwrote the
  // other's just-committed field back to its stale value — even a `formRef` doesn't fully close this
  // gap if both promises happen to resolve within the same batch. Fetching both (only the ones not
  // already loaded) and merging into a *single* `onFormChange` call removes the race entirely: there
  // is only ever one write, so there is nothing for it to race against.
  useEffect(() => {
    if (!open || mode === "create" || activeTab !== "configs") return;
    if (configsLoaded && configFieldsLoaded) return;
    const needConfigs = !configsLoaded;
    const needFields = !configFieldsLoaded;
    if (needConfigs) setConfigsLoaded(true);
    if (needFields) setConfigFieldsLoaded(true);
    (async () => {
      try {
        const [configs, config_fields] = await Promise.all([
          needConfigs ? fetchConfigsData() : Promise.resolve(null),
          needFields ? fetchConfigFieldsData() : Promise.resolve(null),
        ]);
        onFormChange({
          ...formRef.current,
          ...(configs != null ? { configs } : {}),
          ...(config_fields != null ? { config_fields } : {}),
        });
      } catch (err) {
        toast.error((err as Error).message);
      }
    })();
  }, [open, mode, activeTab, configsLoaded, configFieldsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced server-side search — skipped while any config row has an open draft (a row being
  // edited, or a new one being added), since replacing `form.configs` mid-edit would pull the rug
  // out from under it.
  useEffect(() => {
    if (!open || mode === "create" || configsEditing) return;
    if (lastConfigsSearchKey.current === configsSearch) return;
    lastConfigsSearchKey.current = configsSearch;
    const timer = setTimeout(() => {
      fetchConfigs(configsSearch.trim()).catch((err) => toast.error((err as Error).message));
    }, 350);
    return () => clearTimeout(timer);
  }, [configsSearch, open, mode, configsEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Adding a config clears any active search and re-pulls the complete list first, so the new
  // draft row doesn't get appended on top of a filtered view. `configsEditing` itself is no longer
  // set here — ImageHostingProviderConfigs derives and reports it based on whether any row has an
  // open draft.
  function prepareAddConfig() {
    setConfigsSearch("");
    lastConfigsSearchKey.current = "";
    fetchConfigs().catch((err) => toast.error((err as Error).message));
  }

  // Manual refresh only — switching tabs never re-fetches on its own otherwise. Pulls whichever
  // the active tab needs.
  async function handleRefresh() {
    if (providerId == null) return;
    setRefreshing(true);
    try {
      if (activeTab === "general") {
        const res = await imageHostingProvidersService.get(providerId);
        const full = res.data;
        onFormChange({ ...form, name: full.name, description: full.description, sort_order: full.sort_order });
      } else if (activeTab === "configFields") {
        await fetchConfigFields();
        setConfigFieldsLoaded(true);
      } else {
        await fetchConfigs(configsSearch.trim());
        setConfigsLoaded(true);
      }
      toast.success(t("common.refreshed"));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRefreshing(false);
    }
  }

  // Silent check — drives the "config fields" tab's disabled state without firing toasts on every render.
  function isGeneralInfoValid(): boolean {
    return form.code.trim() !== "" && form.name.trim() !== "";
  }

  // Same checks, but reports which field is missing — used by both the Next button and submit.
  function validateGeneralInfo(): boolean {
    if (!form.code.trim()) { toast.error(t("toast.codeRequired")); return false; }
    if (!form.name.trim()) { toast.error(t("toast.nameRequired")); return false; }
    return true;
  }

  function handleNext() {
    if (!validateGeneralInfo()) return;
    setActiveTab("configFields");
  }

  // Silent check — drives the Create button's disabled state without firing toasts on every render.
  function isConfigFieldsValid(): boolean {
    if (form.config_fields.length === 0) return false;
    const keys = new Set<string>();
    for (const row of form.config_fields) {
      const key = row.key.trim();
      if (!key || !row.label.trim() || !row.field_type.trim()) return false;
      if (keys.has(key)) return false;
      keys.add(key);
    }
    return true;
  }

  function validateConfigFields(): boolean {
    if (form.config_fields.length === 0) { toast.error(t("toast.configFieldsRequired")); return false; }
    const keys = new Set<string>();
    for (const [i, row] of form.config_fields.entries()) {
      if (!row.key.trim()) { toast.error(t("toast.configFieldKeyRequiredRow", { n: i + 1 })); return false; }
      if (!row.label.trim()) { toast.error(t("toast.configFieldLabelRequiredRow", { n: i + 1 })); return false; }
      if (!row.field_type.trim()) { toast.error(t("toast.configFieldTypeRequiredRow", { n: i + 1 })); return false; }
      if (keys.has(row.key.trim())) { toast.error(t("toast.configFieldKeyDuplicate", { key: row.key.trim() })); return false; }
      keys.add(row.key.trim());
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode !== "create") return;
    if (!validateGeneralInfo()) { setActiveTab("general"); return; }
    if (!validateConfigFields()) return;
    setSubmitting(true);
    try {
      await imageHostingProvidersService.create({
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        sort_order: Number(form.sort_order) || 0,
        config_fields: form.config_fields.map((row) => ({
          key: row.key.trim(),
          label: row.label.trim(),
          field_type: row.field_type.trim(),
          placeholder: row.placeholder.trim(),
          default_value: row.default_value.trim(),
          is_required: row.is_required,
          sort_order: Number(row.sort_order) || 0,
        })),
      });
      clearDraft();
      toast.success(t("imageHostingProvider.createdToast"));
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const isEditing = generalEditing || configFieldsEditing || configsEditing;
  const headerTitle = mode === "create" ? t("dialog.imageHostingProvider.new") : (isEditing ? t("dialog.imageHostingProvider.edit") : t("dialog.imageHostingProvider.view"));
  const headerDesc = mode === "create" ? t("dialog.imageHostingProvider.desc.create") : (isEditing ? t("dialog.imageHostingProvider.desc.edit") : t("dialog.imageHostingProvider.desc.view"));

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

            <DialogEntityHeader icon={<CloudIcon className="h-4 w-4" />} title={headerTitle} description={headerDesc} />

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "general" | "configFields" | "configs")}
              className="flex-1 min-h-0 flex-col"
            >
              <div className="flex items-center justify-between mx-6 mt-4 gap-2">
                <TabsList className="w-fit shrink-0">
                  <TabsTrigger value="general">{t("common.generalInfo")}</TabsTrigger>
                  <TabsTrigger value="configFields" disabled={mode === "create" && !isGeneralInfoValid()}>
                    {t("imageHostingProvider.configFields")}
                  </TabsTrigger>
                  <TabsTrigger value="configs" disabled={mode === "create"}>
                    {t("imageHostingProvider.configs")}
                  </TabsTrigger>
                </TabsList>
                {mode !== "create" && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={handleRefresh}
                    disabled={refreshing || (activeTab === "general" ? generalEditing : activeTab === "configFields" ? configFieldsEditing : configsEditing)}
                    title={t("common.refresh")}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  </Button>
                )}
              </div>

              <TabsContent value="general" className="min-h-0 overflow-y-auto px-6 py-5">
                <ImageHostingProviderGeneralInfo
                  mode={mode}
                  form={form}
                  onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                  providerId={providerId}
                  onSaved={onSaved}
                  editing={generalEditing}
                  onEditingChange={setGeneralEditing}
                  open={open}
                />
              </TabsContent>

              <TabsContent value="configFields" className="min-h-0 overflow-y-auto px-6 py-5">
                <ImageHostingProviderConfigFields
                  mode={mode}
                  form={form}
                  onFormChange={onFormChange}
                  providerId={providerId}
                  onSaved={async () => { await fetchConfigFields(); await onSaved?.(); }}
                  onEditingChange={setConfigFieldsEditing}
                  open={open}
                />
              </TabsContent>

              <TabsContent value="configs" className="min-h-0 overflow-y-auto px-6 py-5">
                <ImageHostingProviderConfigs
                  form={form}
                  onFormChange={onFormChange}
                  providerId={providerId}
                  onSaved={onSaved}
                  editing={configsEditing}
                  onEditingChange={setConfigsEditing}
                  onPrepareAdd={prepareAddConfig}
                  search={configsSearch}
                  onSearchChange={setConfigsSearch}
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

            {mode === "create" && activeTab === "configFields" && (
              <DialogCreateFooter submitting={submitting} onCancel={requestClose} disabled={!isConfigFieldsValid()} indicator={draftIndicator} />
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
            <AlertDialogDescription>{t("dialog.restoreDraft.descImageHostingProvider")}</AlertDialogDescription>
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
