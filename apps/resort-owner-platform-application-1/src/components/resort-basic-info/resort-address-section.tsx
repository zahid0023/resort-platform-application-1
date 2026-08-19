"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, MapPin, Pencil, X } from "lucide-react"
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@resort/shadcn-ui"
import { resortAddressService } from "@/services/resort-address"
import { toast } from "sonner"
import type { ResortAddress } from "@/services/resorts"

interface LocalDraft {
  postal_code: string
  lat: string
  lon: string
}

export interface ResortAddressSectionProps {
  resortId: number
  address: ResortAddress
  onSaved?: () => void | Promise<void>
  editing: boolean
  onEditingChange: (v: boolean) => void
}

export function ResortAddressSection({
  resortId,
  address,
  onSaved,
  editing,
  onEditingChange,
}: ResortAddressSectionProps) {
  const { t } = useTranslation()

  const [local, setLocal] = useState<LocalDraft>({ postal_code: "", lat: "", lon: "" })
  const [submitting, setSubmitting] = useState(false)

  function startEdit() {
    setLocal({
      postal_code: address.postal_code ?? "",
      lat: address.lat != null ? String(address.lat) : "",
      lon: address.lon != null ? String(address.lon) : "",
    })
    onEditingChange(true)
  }

  async function save() {
    setSubmitting(true)
    try {
      const parsedLat = local.lat.trim() !== "" ? parseFloat(local.lat) : undefined
      const parsedLon = local.lon.trim() !== "" ? parseFloat(local.lon) : undefined
      await resortAddressService.update(resortId, {
        country_id: address.country.id,
        city_id: address.city.id,
        postal_code: local.postal_code.trim() || undefined,
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

  const displayCountry = address.country.locale?.name ?? address.country.code
  const displayCity = address.city.locale?.name ?? address.city.code

  return (
    <Card className="shadow-none border-0 bg-transparent ring-0">
      <CardHeader className="flex flex-row items-center justify-between gap-4 px-0 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MapPin className="h-4 w-4" />
          </div>
          <CardTitle className="text-lg">{t("resortOverview.address.detailsTitle")}</CardTitle>
        </div>
        {!editing ? (
          <Button type="button" size="sm" variant="outline" onClick={startEdit} className="h-7 text-xs px-2.5 gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
          </Button>
        ) : (
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
      </CardHeader>
      <CardContent className="space-y-4 px-0">

        {/* Country — not editable, country/city changes are not supported from this view */}
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("resort.country")}
          </Label>
          <Input value={displayCountry} disabled onChange={() => {}} />
        </div>

        {/* City — not editable, country/city changes are not supported from this view */}
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("resort.city")}
          </Label>
          <Input value={displayCity} disabled onChange={() => {}} />
        </div>

        {/* Postal code */}
        <div className="space-y-2">
          <Label htmlFor="ra-postal" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("resort.postalCode")}
          </Label>
          <Input
            id="ra-postal"
            value={editing ? local.postal_code : (address.postal_code ?? "")}
            onChange={(e) => setLocal((p) => ({ ...p, postal_code: e.target.value }))}
            disabled={!editing}
            placeholder={editing ? "4700" : "—"}
          />
        </div>

        {/* Latitude */}
        <div className="space-y-2">
          <Label htmlFor="ra-lat" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("resort.latitude")}
          </Label>
          <Input
            id="ra-lat"
            type="number"
            value={editing ? local.lat : (address.lat != null ? String(address.lat) : "")}
            onChange={(e) => setLocal((p) => ({ ...p, lat: e.target.value }))}
            disabled={!editing}
            placeholder={editing ? "41.0082" : "—"}
          />
        </div>

        {/* Longitude */}
        <div className="space-y-2">
          <Label htmlFor="ra-lon" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("resort.longitude")}
          </Label>
          <Input
            id="ra-lon"
            type="number"
            value={editing ? local.lon : (address.lon != null ? String(address.lon) : "")}
            onChange={(e) => setLocal((p) => ({ ...p, lon: e.target.value }))}
            disabled={!editing}
            placeholder={editing ? "28.9784" : "—"}
          />
        </div>

      </CardContent>
    </Card>
  )
}
