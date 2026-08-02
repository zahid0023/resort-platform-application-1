import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Loader2, Pencil, X } from "lucide-react";
import { Button } from "@resort/shadcn-ui";
import { Card, CardContent } from "@resort/shadcn-ui";
import { Input } from "@resort/shadcn-ui";
import { Label } from "@resort/shadcn-ui";
import { Popover, PopoverContent, PopoverTrigger } from "@resort/shadcn-ui";
import { citiesService } from "@/services/cities";
import { countriesService, type Country } from "@/services/countries";
import { toast } from "sonner";
import type { CityDialogMode, CityFormState } from "./types";

const COUNTRY_PAGE_SIZE = 20;

export interface CityGeneralInfoProps {
  mode: CityDialogMode;
  form: CityFormState;
  onFormChange: (patch: Partial<CityFormState>) => void;
  cityId?: number;
  /** When provided, country field is hidden and this value is used for create */
  fixedCountryId?: number;
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
  onSaved,
  editing,
  onEditingChange,
  open,
}: CityGeneralInfoProps) {
  const { t } = useTranslation();
  const [localSortOrder, setLocalSortOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Country selector state
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryPage, setCountryPage] = useState(0);
  const [hasNextCountry, setHasNextCountry] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);

  const showCountrySelector = mode === "create" && fixedCountryId == null;

  // Reset edit state when dialog closes
  useEffect(() => {
    if (!open) {
      setSubmitting(false);
      setCountries([]);
      setCountryPage(0);
      setHasNextCountry(false);
      setCountrySearch("");
      setCountryPopoverOpen(false);
    }
  }, [open]);

  // Load first page of countries when dialog opens in create mode (no fixed country)
  useEffect(() => {
    if (open && showCountrySelector) {
      loadCountryPage(0, true);
    }
  }, [open, showCountrySelector]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadCountryPage(page: number, reset = false) {
    setLoadingCountries(true);
    try {
      const res = await countriesService.list({ page, size: COUNTRY_PAGE_SIZE, sort_by: "code" });
      setCountries((prev) => (reset ? res.data : [...prev, ...res.data]));
      setCountryPage(page);
      setHasNextCountry(res.has_next);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoadingCountries(false);
    }
  }

  function loadMoreCountries() {
    loadCountryPage(countryPage + 1);
  }

  const filteredCountries = countrySearch.trim()
    ? countries.filter((c) => {
        const q = countrySearch.toLowerCase();
        return (
          c.code.toLowerCase().includes(q) ||
          (c.locales[0]?.name ?? "").toLowerCase().includes(q)
        );
      })
    : countries;

  const selectedCountry = countries.find((c) => c.id === form.country_id);
  const selectedLabel = selectedCountry
    ? `${selectedCountry.locales[0]?.name ?? selectedCountry.code} (${selectedCountry.code})`
    : "Select country…";

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

  const sortValue = editing ? localSortOrder : form.sort_order;
  const isReadOnly = !editing && mode !== "create";

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

          {/* Country selector — only in create mode when no fixedCountryId */}
          {showCountrySelector && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Country *</Label>
              <Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between font-normal"
                  >
                    <span className={form.country_id ? "" : "text-muted-foreground"}>
                      {selectedLabel}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  {/* Search */}
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search by name or code…"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  </div>

                  {/* Country list */}
                  <div className="max-h-52 overflow-y-auto">
                    {loadingCountries && countries.length === 0 ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredCountries.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No countries found.</p>
                    ) : (
                      filteredCountries.map((c) => {
                        const name = c.locales[0]?.name ?? c.code;
                        const isSelected = form.country_id === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2 ${isSelected ? "bg-accent" : ""}`}
                            onClick={() => {
                              onFormChange({ country_id: c.id });
                              setCountryPopoverOpen(false);
                              setCountrySearch("");
                            }}
                          >
                            {isSelected
                              ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                              : <span className="w-3.5 shrink-0" />
                            }
                            {name} ({c.code})
                          </button>
                        );
                      })
                    )}

                    {/* Load more — only shown when not filtering client-side */}
                    {hasNextCountry && !countrySearch.trim() && (
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent flex items-center justify-center gap-1.5 border-t"
                        onClick={loadMoreCountries}
                        disabled={loadingCountries}
                      >
                        {loadingCountries && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Load more
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="city-code" className="text-xs font-medium">
              {t("common.code")}
            </Label>
            <Input
              id="city-code"
              value={form.code}
              onChange={(e) => onFormChange({ code: e.target.value })}
              placeholder={t("placeholder.cityCode")}
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
    </div>
  );
}
