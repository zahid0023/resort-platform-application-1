import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Globe, Pencil, RefreshCw, X } from "lucide-react";
import { Button } from "@resort/shadcn-ui";
import { Card, CardContent } from "@resort/shadcn-ui";
import { Input } from "@resort/shadcn-ui";
import { Label } from "@resort/shadcn-ui";
import { Switch } from "@resort/shadcn-ui";
import { currenciesService } from "@/services/currencies";
import { countriesService, type Country } from "@/services/countries";
import { toast } from "sonner";
import type { CurrencyDialogMode, CurrencyFormState } from "./types";
import { CountryPickerDialog } from "@/components/cities/country-picker-dialog";

interface LocalState {
  symbol: string;
  decimal_places: number;
  is_default: boolean;
  sort_order: number;
}

export interface CurrencyGeneralInfoProps {
  mode: CurrencyDialogMode;
  form: CurrencyFormState;
  onFormChange: (patch: Partial<CurrencyFormState>) => void;
  currencyId?: number;
  /** Pre-set country (e.g. opened from a country's own detail page) — hides the picker entirely */
  fixedCountryId?: number;
  /** Display label for the resolved country ("Bangladesh (BD)") — used in view/edit and when fixedCountryId is set */
  countryLabel?: string;
  onSaved?: () => void | Promise<void>;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  open: boolean;
}

export function CurrencyGeneralInfo({
  mode,
  form,
  onFormChange,
  currencyId,
  fixedCountryId,
  countryLabel,
  onSaved,
  editing,
  onEditingChange,
  open,
}: CurrencyGeneralInfoProps) {
  const { t } = useTranslation();
  const [local, setLocal] = useState<LocalState>({ symbol: "", decimal_places: 2, is_default: false, sort_order: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const showCountryPicker = mode === "create" && fixedCountryId == null;

  useEffect(() => {
    if (!open) {
      setSubmitting(false);
      setPickerOpen(false);
      setSelectedCountry(null);
    }
  }, [open]);

  // Restoring a local draft (or any other path that lands a country_id in the form without going
  // through handleCountrySelect) only brings back the id, not the country to display — resolve it
  // here so the picker shows the already-set country instead of the empty "select a country" state.
  useEffect(() => {
    if (!open || !showCountryPicker || form.country_id === "") return;
    if (selectedCountry?.id === Number(form.country_id)) return;
    let cancelled = false;
    countriesService.get(Number(form.country_id))
      .then((res) => { if (!cancelled) setSelectedCountry(res.data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open, showCountryPicker, form.country_id]); // eslint-disable-line react-hooks/exhaustive-deps

  function startEdit() {
    setLocal({
      symbol: form.symbol,
      decimal_places: form.decimal_places,
      is_default: form.is_default,
      sort_order: form.sort_order,
    });
    onEditingChange(true);
  }

  async function save() {
    if (currencyId == null) return;
    if (!local.symbol.trim()) { toast.error(t("toast.symbolRequired")); return; }
    setSubmitting(true);
    try {
      await currenciesService.update(currencyId, {
        symbol: local.symbol.trim(),
        decimal_places: Number(local.decimal_places) || 0,
        is_default: local.is_default,
        sort_order: Number(local.sort_order) || 0,
      });
      toast.success(t("currencies.updatedToast"));
      onEditingChange(false);
      onFormChange({
        symbol: local.symbol.trim(),
        decimal_places: Number(local.decimal_places) || 0,
        is_default: local.is_default,
        sort_order: Number(local.sort_order) || 0,
      });
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCountrySelect(country: Country) {
    setSelectedCountry(country);
    onFormChange({ country_id: country.id });
  }

  const symbolValue = editing ? local.symbol : form.symbol;
  const decimalPlacesValue = editing ? local.decimal_places : form.decimal_places;
  const isDefaultValue = editing ? local.is_default : form.is_default;
  const sortValue = editing ? local.sort_order : form.sort_order;
  const isReadOnly = !editing && mode !== "create";
  const resolvedCountryLabel = selectedCountry
    ? `${selectedCountry.locale?.name ?? selectedCountry.code} (${selectedCountry.code})`
    : countryLabel;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("common.generalInfo")}
          </h3>
        </div>
        {mode !== "create" && !editing && (
          <Button type="button" size="sm" variant="outline" onClick={startEdit} className="h-7 text-xs px-2.5 gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
          </Button>
        )}
        {editing && (
          <div className="flex items-center gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={() => onEditingChange(false)} disabled={submitting} className="h-7 text-xs px-2.5 gap-1.5">
              <X className="h-3.5 w-3.5" /> {t("common.cancel")}
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={submitting} className="h-7 text-xs px-2.5 gap-1.5">
              <Check className="h-3.5 w-3.5" />
              {submitting ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">{t("field.country")} *</Label>
            {showCountryPicker ? (
              form.country_id !== "" && resolvedCountryLabel ? (
                <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                  <span className="flex items-center gap-2 text-sm min-w-0">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{resolvedCountryLabel}</span>
                  </span>
                  <Button type="button" size="sm" variant="outline" className="h-7 text-xs px-2.5 shrink-0" onClick={() => setPickerOpen(true)}>
                    <RefreshCw className="h-3 w-3 mr-1" /> {t("countryPicker.change")}
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="w-full rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {t("countryPicker.selectPrompt")}
                </button>
              )
            ) : (
              <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm bg-muted/40">
                <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{resolvedCountryLabel ?? "—"}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency-code" className="text-xs font-medium">{t("common.code")} *</Label>
              <Input
                id="currency-code"
                value={form.code}
                onChange={(e) => {
                  const letters = e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase();
                  if (letters.length > 3) { toast.error(t("toast.currencyCodeMaxLength")); return; }
                  onFormChange({ code: letters });
                }}
                placeholder={t("placeholder.currencyCode")}
                required
                disabled={mode !== "create"}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency-numeric-code" className="text-xs font-medium">{t("field.numericCode")} *</Label>
              <Input
                id="currency-numeric-code"
                value={form.numeric_code}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, "");
                  if (digits.length > 3) { toast.error(t("toast.numericCodeMaxLength")); return; }
                  onFormChange({ numeric_code: digits });
                }}
                placeholder={t("placeholder.numericCode")}
                required
                disabled={mode !== "create"}
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency-symbol" className="text-xs font-medium">{t("field.symbol")} *</Label>
            <Input
              id="currency-symbol"
              value={symbolValue}
              onChange={(e) => {
                if (e.target.value.length > 10) { toast.error(t("toast.symbolMaxLength")); return; }
                mode === "create" ? onFormChange({ symbol: e.target.value }) : setLocal((p) => ({ ...p, symbol: e.target.value }));
              }}
              placeholder={t("placeholder.currencySymbol")}
              required
              disabled={isReadOnly}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency-decimal-places" className="text-xs font-medium">{t("field.decimalPlaces")} *</Label>
              <Input
                id="currency-decimal-places"
                type="number"
                value={decimalPlacesValue}
                onChange={(e) =>
                  mode === "create"
                    ? onFormChange({ decimal_places: Number(e.target.value) })
                    : setLocal((p) => ({ ...p, decimal_places: Number(e.target.value) }))
                }
                required={mode === "create"}
                disabled={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
              <Input
                id="currency-sort"
                type="number"
                value={sortValue}
                onChange={(e) =>
                  mode === "create"
                    ? onFormChange({ sort_order: Number(e.target.value) })
                    : setLocal((p) => ({ ...p, sort_order: Number(e.target.value) }))
                }
                required={mode === "create"}
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <Label className="text-xs font-medium">{t("field.isDefault")}</Label>
            <Switch
              checked={isDefaultValue}
              onCheckedChange={(v) =>
                mode === "create" ? onFormChange({ is_default: v }) : setLocal((p) => ({ ...p, is_default: v }))
              }
              disabled={isReadOnly}
            />
          </div>
        </CardContent>
      </Card>

      {showCountryPicker && (
        <CountryPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          selectedId={form.country_id !== "" ? Number(form.country_id) : undefined}
          onSelect={handleCountrySelect}
        />
      )}
    </div>
  );
}
