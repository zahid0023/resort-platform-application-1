import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Globe, Pencil, RefreshCw, X } from "lucide-react";
import { Button } from "@resort/shadcn-ui";
import { Card, CardContent } from "@resort/shadcn-ui";
import { Input } from "@resort/shadcn-ui";
import { Label } from "@resort/shadcn-ui";
import { citiesService } from "@/services/cities";
import { countriesService, type Country } from "@/services/countries";
import { toast } from "sonner";
import type { CityDialogMode, CityFormState } from "./types";
import { CountryPickerDialog } from "./country-picker-dialog";

export interface CityGeneralInfoProps {
  mode: CityDialogMode;
  form: CityFormState;
  onFormChange: (patch: Partial<CityFormState>) => void;
  cityId?: number;
  /** Pre-set country (e.g. opened from a country's own detail page) — hides the picker entirely */
  fixedCountryId?: number;
  /** Display label for the resolved country ("Bangladesh (BD)") — used in view/edit and when fixedCountryId is set */
  countryLabel?: string;
  onSaved?: () => void | Promise<void>;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  open: boolean;
}

export function CityGeneralInfo({
  mode,
  form,
  onFormChange,
  cityId,
  fixedCountryId,
  countryLabel,
  onSaved,
  editing,
  onEditingChange,
  open,
}: CityGeneralInfoProps) {
  const { t } = useTranslation();
  const [localSortOrder, setLocalSortOrder] = useState(0);
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
    setLocalSortOrder(form.sort_order);
    onEditingChange(true);
  }

  async function save() {
    if (cityId == null) return;
    setSubmitting(true);
    try {
      await citiesService.update(cityId, { sort_order: Number(localSortOrder) || 0 });
      toast.success(t("common.saved"));
      onEditingChange(false);
      onFormChange({ sort_order: Number(localSortOrder) || 0 });
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

  const sortValue = editing ? localSortOrder : form.sort_order;
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

          <div className="space-y-2">
            <Label htmlFor="city-code" className="text-xs font-medium">
              {t("common.code")} *
            </Label>
            <Input
              id="city-code"
              value={form.code}
              onChange={(e) => {
                const letters = e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase();
                if (letters.length > 3) { toast.error(t("toast.cityCodeMaxLength")); return; }
                onFormChange({ code: letters });
              }}
              placeholder={t("placeholder.cityCode")}
              required
              disabled={mode !== "create"}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city-sort" className="text-xs font-medium">
              {t("field.sort")} *
            </Label>
            <Input
              id="city-sort"
              type="number"
              value={sortValue}
              onChange={(e) =>
                mode === "create"
                  ? onFormChange({ sort_order: Number(e.target.value) })
                  : setLocalSortOrder(Number(e.target.value))
              }
              required={mode === "create"}
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
