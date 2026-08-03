"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CloudIcon, Database, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button, Dialog, DialogContent, DialogTitle, Input, Label } from "@resort/shadcn-ui";
import { imageHostingProvidersService, type ImageHostingProvider, type ImageHostingProviderConfig } from "@/services/image-hosting-providers";
import { Pagination } from "@/components/shared/pagination";
import { buildDraftValues, ConfigValueField } from "./config-value-field";
import type { ConfigFieldRow } from "./types";

const PAGE_SIZE = 20;

export interface SelectedProviderConfig {
  id: number;
  name: string;
  providerId: number;
  providerCode: string;
  providerName: string;
}

export interface ImageHostingProviderConfigPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedConfigId?: number;
  onSelect: (config: SelectedProviderConfig) => void;
}

// Two-level drill-down: image hosting configs are always scoped to a provider (there is no flat
// "all configs" endpoint), so this picker selects a provider first, then one of its configs.
export function ImageHostingProviderConfigPickerDialog({
  open,
  onOpenChange,
  selectedConfigId,
  onSelect,
}: ImageHostingProviderConfigPickerDialogProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<"provider" | "config">("provider");

  const [providers, setProviders] = useState<ImageHostingProvider[]>([]);
  const [providerLoading, setProviderLoading] = useState(false);
  const [providerSearch, setProviderSearch] = useState("");
  const [providerPage, setProviderPage] = useState(0);
  const [providerTotalPages, setProviderTotalPages] = useState(0);
  const [providerTotalElements, setProviderTotalElements] = useState(0);
  const [providerHasNext, setProviderHasNext] = useState(false);
  const [providerHasPrevious, setProviderHasPrevious] = useState(false);
  const isFirstProviderSearchRender = useRef(true);

  const [activeProvider, setActiveProvider] = useState<ImageHostingProvider | null>(null);
  const [configs, setConfigs] = useState<ImageHostingProviderConfig[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSearch, setConfigSearch] = useState("");
  const [configPage, setConfigPage] = useState(0);
  const [configTotalPages, setConfigTotalPages] = useState(0);
  const [configTotalElements, setConfigTotalElements] = useState(0);
  const [configHasNext, setConfigHasNext] = useState(false);
  const [configHasPrevious, setConfigHasPrevious] = useState(false);
  const isFirstConfigSearchRender = useRef(true);

  // Inline "create a config" form — only actually shown once the admin clicks "+ New Config" (see
  // handleStartCreateConfig), not just because the provider turns out to have none. Lets the admin
  // finish picking a config without leaving this dialog to go manage providers separately.
  const [creatingConfig, setCreatingConfig] = useState(false);
  const [configFields, setConfigFields] = useState<ConfigFieldRow[]>([]);
  const [configFieldsLoading, setConfigFieldsLoading] = useState(false);
  const [newConfigName, setNewConfigName] = useState("");
  const [newConfigValues, setNewConfigValues] = useState<Record<string, string | boolean>>({});
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("provider");
      setActiveProvider(null);
      setProviderSearch("");
      setProviderPage(0);
      isFirstProviderSearchRender.current = true;
      loadProviders(0, "");
    } else {
      setProviders([]);
      setConfigs([]);
      resetCreateConfigForm();
    }
  }, [open]);

  useEffect(() => {
    if (isFirstProviderSearchRender.current) { isFirstProviderSearchRender.current = false; return; }
    if (!open) return;
    setProviderPage(0);
    const timer = setTimeout(() => loadProviders(0, providerSearch), 350);
    return () => clearTimeout(timer);
  }, [providerSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isFirstConfigSearchRender.current) { isFirstConfigSearchRender.current = false; return; }
    if (!open || !activeProvider) return;
    setConfigPage(0);
    const timer = setTimeout(() => loadConfigs(activeProvider.id, 0, configSearch), 350);
    return () => clearTimeout(timer);
  }, [configSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProviders(p: number, q: string) {
    setProviderLoading(true);
    try {
      const res = await imageHostingProvidersService.list({ page: p, size: PAGE_SIZE, sort_by: "name", name: q.trim() || undefined });
      setProviders(res.data);
      setProviderPage(p);
      setProviderTotalPages(res.total_pages);
      setProviderTotalElements(res.total_elements);
      setProviderHasNext(res.has_next);
      setProviderHasPrevious(res.has_previous);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("imageHostingProviderConfigPicker.loadProvidersFailed"));
    } finally {
      setProviderLoading(false);
    }
  }

  // Returns the fetched configs (not just sets state) so `selectProvider` can decide, right after
  // awaiting this, whether the provider has none and the inline create-config form should show —
  // reading the `configs` state variable here wouldn't reflect this call's result until next render.
  async function loadConfigs(providerId: number, p: number, q: string): Promise<ImageHostingProviderConfig[]> {
    setConfigLoading(true);
    try {
      const res = await imageHostingProvidersService.listConfigs(providerId, { page: p, size: PAGE_SIZE, sort_by: "name", name: q.trim() || undefined });
      setConfigs(res.data);
      setConfigPage(p);
      setConfigTotalPages(res.total_pages);
      setConfigTotalElements(res.total_elements);
      setConfigHasNext(res.has_next);
      setConfigHasPrevious(res.has_previous);
      return res.data;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("imageHostingProviderConfigPicker.loadConfigsFailed"));
      return [];
    } finally {
      setConfigLoading(false);
    }
  }

  function resetCreateConfigForm() {
    setCreatingConfig(false);
    setConfigFields([]);
    setConfigFieldsLoading(false);
    setNewConfigName("");
    setNewConfigValues({});
    setSavingConfig(false);
  }

  // Only fetched once the admin actually clicks "+ New Config" — this is the schema the inline
  // create-config form renders against, mirroring how ImageHostingProviderConfigs renders each
  // existing config's fields.
  async function loadConfigFieldsForCreate(providerId: number) {
    setConfigFieldsLoading(true);
    try {
      const fields = await imageHostingProvidersService.listConfigFields(providerId);
      setConfigFields(fields);
      setNewConfigValues(buildDraftValues(fields, {}));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("imageHostingProviderConfigPicker.loadConfigsFailed"));
    } finally {
      setConfigFieldsLoading(false);
    }
  }

  function handleStartCreateConfig() {
    if (!activeProvider) return;
    setCreatingConfig(true);
    if (configFields.length === 0) {
      loadConfigFieldsForCreate(activeProvider.id).catch(() => {});
    }
  }

  async function selectProvider(provider: ImageHostingProvider) {
    setActiveProvider(provider);
    setStep("config");
    setConfigSearch("");
    setConfigPage(0);
    isFirstConfigSearchRender.current = true;
    resetCreateConfigForm();
    await loadConfigs(provider.id, 0, "");
  }

  function backToProviders() {
    setStep("provider");
    setActiveProvider(null);
    setConfigs([]);
    resetCreateConfigForm();
  }

  async function handleCreateConfig() {
    if (!activeProvider) return;
    if (!newConfigName.trim()) { toast.error(t("toast.configNameRequired")); return; }
    const parsedConfig: Record<string, unknown> = {};
    for (const field of configFields) {
      if (field.field_type === "BOOLEAN") { parsedConfig[field.key] = !!newConfigValues[field.key]; continue; }
      const raw = newConfigValues[field.key];
      const strVal = typeof raw === "string" ? raw.trim() : "";
      if (field.is_required && !strVal) {
        toast.error(t("toast.configValueRequired", { field: field.label }));
        return;
      }
      parsedConfig[field.key] = field.field_type === "NUMBER" ? (Number(strVal) || 0) : strVal;
    }
    setSavingConfig(true);
    try {
      const res = await imageHostingProvidersService.createConfig(activeProvider.id, {
        name: newConfigName.trim(),
        config: parsedConfig,
      });
      // Immediately select the config just created and close — completes the flow the admin
      // started (picking a config to upload through) instead of making them pick it again from a
      // freshly reloaded list.
      onSelect({
        id: res.id,
        name: newConfigName.trim(),
        providerId: activeProvider.id,
        providerCode: activeProvider.code,
        providerName: activeProvider.name,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("imageHostingProviderConfigPicker.createConfigFailed"));
    } finally {
      setSavingConfig(false);
    }
  }

  function handleSelectConfig(config: ImageHostingProviderConfig) {
    if (!activeProvider) return;
    onSelect({
      id: config.id,
      name: config.name,
      providerId: activeProvider.id,
      providerCode: activeProvider.code,
      providerName: activeProvider.name,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogTitle className="sr-only">{t("imageHostingProviderConfigPicker.title")}</DialogTitle>

        {/* Header */}
        <div className="flex flex-col gap-3 px-5 pt-4 pb-4 pr-12 border-b shrink-0">
          <div className="flex items-center gap-3">
            {step === "config" && (
              <button
                type="button"
                onClick={backToProviders}
                className="flex size-8 items-center justify-center rounded-lg border shrink-0 hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              {step === "provider" ? <CloudIcon className="h-4 w-4" /> : <Database className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {step === "provider"
                  ? t("imageHostingProviderConfigPicker.titleProvider")
                  : t("imageHostingProviderConfigPicker.titleConfig", { provider: activeProvider?.name })}
              </p>
              {step === "provider" && providerTotalElements > 0 && (
                <p className="text-xs text-muted-foreground">{t("imageHostingProviderConfigPicker.countProviders", { n: providerTotalElements })}</p>
              )}
              {step === "config" && configTotalElements > 0 && (
                <p className="text-xs text-muted-foreground">{t("imageHostingProviderConfigPicker.countConfigs", { n: configTotalElements })}</p>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            {step === "provider" ? (
              <Input
                value={providerSearch}
                onChange={(e) => setProviderSearch(e.target.value)}
                placeholder={t("imageHostingProviderConfigPicker.searchProviders")}
                className="pl-8 h-8 text-sm w-full"
                autoFocus
              />
            ) : (
              <Input
                value={configSearch}
                onChange={(e) => setConfigSearch(e.target.value)}
                placeholder={t("imageHostingProviderConfigPicker.searchConfigs")}
                className="pl-8 h-8 text-sm w-full"
                autoFocus
              />
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === "provider" ? (
            providerLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : providers.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground border rounded-xl border-dashed">
                {t("imageHostingProviderConfigPicker.emptyProviders")}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {providers.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectProvider(p)}
                    className="text-left rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5 bg-card hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-muted text-muted-foreground">
                        <CloudIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm leading-tight truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-1 truncate">{p.code}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : configLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : configs.length === 0 ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-6 text-sm text-muted-foreground border rounded-xl border-dashed">
                {t("imageHostingProviderConfigPicker.emptyConfigs")}
                {!creatingConfig && (
                  <Button type="button" size="sm" variant="outline" onClick={handleStartCreateConfig} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> {t("imageHostingProvider.config.addFirst")}
                  </Button>
                )}
              </div>

              {creatingConfig && (
                <div className="rounded-xl border p-4 space-y-3">
                  <p className="text-sm font-medium">
                    {t("imageHostingProviderConfigPicker.createConfigPrompt", { provider: activeProvider?.name })}
                  </p>
                  {configFieldsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t("imageHostingProvider.config.name")} *</Label>
                        <Input
                          value={newConfigName}
                          onChange={(e) => setNewConfigName(e.target.value)}
                          placeholder={activeProvider ? t("placeholder.configNameForProvider", { provider: activeProvider.name }) : t("placeholder.configName")}
                          className="h-9 text-sm"
                          disabled={savingConfig}
                        />
                      </div>
                      {[...configFields].sort((a, b) => a.sort_order - b.sort_order).map((field) => (
                        <ConfigValueField
                          key={field.key}
                          field={field}
                          value={newConfigValues[field.key] ?? (field.field_type === "BOOLEAN" ? false : "")}
                          disabled={savingConfig}
                          onChange={(v) => setNewConfigValues((prev) => ({ ...prev, [field.key]: v }))}
                        />
                      ))}
                      <Button type="button" size="sm" className="w-full gap-1.5" onClick={handleCreateConfig} disabled={savingConfig}>
                        {savingConfig ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        {t("imageHostingProvider.config.addFirst")}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {configs.map((c) => {
                const isSelected = c.id === selectedConfigId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectConfig(c)}
                    className={`text-left rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        <Database className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm leading-tight truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{activeProvider?.name}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {step === "provider" && providerTotalPages > 1 && (
          <div className="border-t px-5 py-3 shrink-0">
            <Pagination
              currentPage={providerPage}
              totalPages={providerTotalPages}
              totalElements={providerTotalElements}
              hasNext={providerHasNext}
              hasPrevious={providerHasPrevious}
              onPageChange={(p) => loadProviders(p, providerSearch)}
            />
          </div>
        )}
        {step === "config" && activeProvider && configTotalPages > 1 && (
          <div className="border-t px-5 py-3 shrink-0">
            <Pagination
              currentPage={configPage}
              totalPages={configTotalPages}
              totalElements={configTotalElements}
              hasNext={configHasNext}
              hasPrevious={configHasPrevious}
              onPageChange={(p) => loadConfigs(activeProvider.id, p, configSearch)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
