"use client"

import { MapPin } from "lucide-react"
import { Input, Textarea } from "@resort/shadcn-ui"
import { useTranslation } from "react-i18next"
import { StepHeader, FieldRow, PickerField } from "./step-dialog"
import { CountryPickerDialog } from "@/components/countries/country-picker-dialog"
import { CityPickerDialog } from "@/components/cities/city-picker-dialog"
import type { Country } from "@/services/countries"
import type { City } from "@/services/cities"
import type { StepTwoForm } from "./create-resort-dialog"

export interface StepLocationProps {
  form: StepTwoForm
  submitting: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onCountrySelect: (country: Country) => void
  onCitySelect: (city: City) => void
  countryPickerOpen: boolean
  onCountryPickerOpenChange: (open: boolean) => void
  cityPickerOpen: boolean
  onCityPickerOpenChange: (open: boolean) => void
}

export function StepLocation({
  form,
  submitting,
  onChange,
  onCountrySelect,
  onCitySelect,
  countryPickerOpen,
  onCountryPickerOpenChange,
  cityPickerOpen,
  onCityPickerOpenChange,
}: StepLocationProps) {
  const { t } = useTranslation()

  return (
    <>
      <StepHeader
        eyebrow={t("resort.step2Label")}
        title={t("resort.location")}
        badge={{ icon: <MapPin className="h-3 w-3" />, label: t("resort.locationSubtitle") }}
      />

      {/* Country — required, global */}
      <PickerField
        label={t("resort.country")}
        value={form.country_name}
        placeholder={t("resort.countryPlaceholder")}
        onClick={() => onCountryPickerOpenChange(true)}
        disabled={submitting}
      />

      {/* City — required, filtered by selected country */}
      <PickerField
        label={t("resort.city")}
        value={form.city_name}
        placeholder={form.country_id ? t("resort.cityPlaceholder") : t("resort.cityAfterCountry")}
        onClick={() => onCityPickerOpenChange(true)}
        disabled={!form.country_id || submitting}
      />

      {/* Address — EN badge, locale-specific text */}
      <FieldRow
        label={t("resort.address")}
        htmlFor="address"
        labelExtra={
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 leading-none">EN</span>
        }
      >
        <Textarea
          id="address"
          name="address"
          value={form.address}
          onChange={onChange}
          placeholder={t("resort.addressPlaceholder")}
          maxLength={400}
          rows={2}
          disabled={submitting}
        />
      </FieldRow>

      {/* Postal code — optional */}
      <FieldRow
        label={t("resort.postalCode")}
        htmlFor="postal_code"
        labelExtra={<span className="text-xs text-muted-foreground">{t("resort.optional")}</span>}
      >
        <Input
          id="postal_code"
          name="postal_code"
          value={form.postal_code}
          onChange={onChange}
          placeholder={t("resort.postalCodePlaceholder")}
          maxLength={50}
          disabled={submitting}
        />
      </FieldRow>

      {/* Lat / Lon — global numeric */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <FieldRow
          label={t("resort.latitude")}
          htmlFor="lat2"
          labelExtra={<span className="text-xs text-muted-foreground">{t("resort.optional")}</span>}
        >
          <Input
            id="lat2"
            name="latitude"
            type="number"
            value={form.latitude}
            onChange={onChange}
            placeholder="e.g. 36.7783"
            step="any"
            disabled={submitting}
          />
        </FieldRow>
        <FieldRow
          label={t("resort.longitude")}
          htmlFor="lon2"
          labelExtra={<span className="text-xs text-muted-foreground">{t("resort.optional")}</span>}
        >
          <Input
            id="lon2"
            name="longitude"
            type="number"
            value={form.longitude}
            onChange={onChange}
            placeholder="e.g. -119.4179"
            step="any"
            disabled={submitting}
          />
        </FieldRow>
      </div>

      <CountryPickerDialog
        open={countryPickerOpen}
        onOpenChange={onCountryPickerOpenChange}
        selectedId={form.country_id ?? undefined}
        onSelect={onCountrySelect}
      />

      <CityPickerDialog
        open={cityPickerOpen}
        onOpenChange={onCityPickerOpenChange}
        selectedId={form.city_id ?? undefined}
        countryId={form.country_id ?? undefined}
        onSelect={onCitySelect}
      />
    </>
  )
}
