"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, Pencil, X } from "lucide-react"
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@resort/shadcn-ui"
import { resortBasicInfoService } from "@/services/resort-basic-info"
import { listCountries, type CountrySummary } from "@/services/countries"
import { listCities, type CitySummary } from "@/services/cities"
import { toast } from "sonner"
import type { ResortBasicInfoFormState } from "./types"

interface LocalDraft {
  sort_order: number | ""
  estd: number | ""
  lat: string
  lon: string
  country: CountrySummary | null
  city: CitySummary | null
}

export interface ResortGeneralInfoProps {
  resortId: number
  form: ResortBasicInfoFormState
  onSaved?: () => void | Promise<void>
  editing: boolean
  onEditingChange: (v: boolean) => void
}

export function ResortGeneralInfo({
  resortId,
  form,
  onSaved,
  editing,
  onEditingChange,
}: ResortGeneralInfoProps) {
  const { t } = useTranslation()

  const [local, setLocal] = useState<LocalDraft>({
    sort_order: "", estd: "", lat: "", lon: "", country: null, city: null,
  })
  const [countries, setCountries] = useState<CountrySummary[]>([])
  const [cities, setCities] = useState<CitySummary[]>([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function startEdit() {
    setLocal({
      sort_order: form.sort_order,
      estd: form.estd,
      lat: form.lat,
      lon: form.lon,
      country: null,
      city: null,
    })
    setCountries([])
    setCities([])
    onEditingChange(true)
    setLoadingCountries(true)
    setLoadingCities(true)
    try {
      const [countriesRes, citiesRes] = await Promise.all([
        listCountries({ size: 50 }),
        listCities({ countryId: form.country.id, size: 50 }),
      ])
      setCountries(countriesRes.data)
      setCities(citiesRes.data)
      setLocal((prev) => ({
        ...prev,
        country: countriesRes.data.find((c) => c.id === form.country.id) ?? null,
        city: citiesRes.data.find((c) => c.id === form.city.id) ?? null,
      }))
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoadingCountries(false)
      setLoadingCities(false)
    }
  }

  async function handleCountryChange(countryId: string) {
    const country = countries.find((c) => String(c.id) === countryId) ?? null
    setLocal((prev) => ({ ...prev, country, city: null }))
    setCities([])
    if (!country) return
    setLoadingCities(true)
    try {
      const res = await listCities({ countryId: country.id, size: 50 })
      setCities(res.data)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoadingCities(false)
    }
  }

  async function save() {
    if (local.estd === "" || isNaN(Number(local.estd))) {
      toast.error(t("basicInfo.errEstd"))
      return
    }
    if (!local.country) { toast.error(t("basicInfo.errCountry")); return }
    if (!local.city) { toast.error(t("basicInfo.errCity")); return }
    setSubmitting(true)
    try {
      const parsedLat = local.lat.trim() !== "" ? parseFloat(local.lat) : undefined
      const parsedLon = local.lon.trim() !== "" ? parseFloat(local.lon) : undefined
      await resortBasicInfoService.update(resortId, {
        sort_order: Number(local.sort_order) || 0,
        estd: Number(local.estd),
        country_id: local.country.id,
        city_id: local.city.id,
        logo_url: form.logo_url || undefined,
        lat: parsedLat !== undefined && !isNaN(parsedLat) ? parsedLat : undefined,
        lon: parsedLon !== undefined && !isNaN(parsedLon) ? parsedLon : undefined,
      })
      toast.success(t("basicInfo.updatedToast"))
      onEditingChange(false)
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  function cancelEdit() {
    onEditingChange(false)
  }

  const displayCountry = form.country.locales[0]?.name ?? form.country.code
  const displayCity = form.city.locales[0]?.name ?? form.city.code

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("common.generalInfo")}
          </h3>
        </div>
        {!editing && (
          <Button type="button" size="sm" variant="outline" onClick={startEdit} className="h-7 text-xs px-2.5 gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
          </Button>
        )}
        {editing && (
          <div className="flex items-center gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={cancelEdit} disabled={submitting} className="h-7 text-xs px-2.5 gap-1.5">
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

          {/* Country */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">{t("resort.country")} {editing && "*"}</Label>
            {editing ? (
              <Select value={local.country ? String(local.country.id) : ""} onValueChange={handleCountryChange} disabled={loadingCountries}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingCountries ? t("common.loading") : t("resort.countryPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={displayCountry} disabled onChange={() => {}} />
            )}
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">{t("resort.city")} {editing && "*"}</Label>
            {editing ? (
              <Select
                value={local.city ? String(local.city.id) : ""}
                onValueChange={(v) => setLocal((prev) => ({ ...prev, city: cities.find((c) => String(c.id) === v) ?? null }))}
                disabled={loadingCities || !local.country}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingCities ? t("common.loading") : t("resort.cityPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={displayCity} disabled onChange={() => {}} />
            )}
          </div>

          {/* Estd */}
          <div className="space-y-2">
            <Label htmlFor="rbi-estd" className="text-xs font-medium">{t("resort.estd")} {editing && "*"}</Label>
            <Input
              id="rbi-estd"
              type="number"
              value={editing ? (local.estd === "" ? "" : String(local.estd)) : (form.estd === "" ? "" : String(form.estd))}
              onChange={(e) => setLocal((p) => ({ ...p, estd: e.target.value === "" ? "" : Number(e.target.value) }))}
              disabled={!editing}
              placeholder="1998"
            />
          </div>

          {/* Sort order */}
          <div className="space-y-2">
            <Label htmlFor="rbi-sort" className="text-xs font-medium">{t("field.sort")}</Label>
            <Input
              id="rbi-sort"
              type="number"
              value={editing ? (local.sort_order === "" ? "" : String(local.sort_order)) : String(form.sort_order)}
              onChange={(e) => setLocal((p) => ({ ...p, sort_order: e.target.value === "" ? "" : Number(e.target.value) }))}
              disabled={!editing}
            />
          </div>

          {/* Latitude */}
          <div className="space-y-2">
            <Label htmlFor="rbi-lat" className="text-xs font-medium">{t("resort.latitude")}</Label>
            <Input
              id="rbi-lat"
              type="number"
              value={editing ? local.lat : form.lat}
              onChange={(e) => setLocal((p) => ({ ...p, lat: e.target.value }))}
              disabled={!editing}
              placeholder="41.0082"
            />
          </div>

          {/* Longitude */}
          <div className="space-y-2">
            <Label htmlFor="rbi-lon" className="text-xs font-medium">{t("resort.longitude")}</Label>
            <Input
              id="rbi-lon"
              type="number"
              value={editing ? local.lon : form.lon}
              onChange={(e) => setLocal((p) => ({ ...p, lon: e.target.value }))}
              disabled={!editing}
              placeholder="28.9784"
            />
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
