"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Spinner } from "@resort/shadcn-ui"
import { resortBasicInfoService, type ResortBasicInfo } from "@/services/resort-basic-info"
import { localesService, type Locale } from "@/services/locales"
import { ResortLogoSection } from "@/components/resort-basic-info/resort-logo-section"
import { ResortGeneralInfo } from "@/components/resort-basic-info/resort-general-info"
import { ResortLocaleTranslations } from "@/components/resort-basic-info/resort-locale-translations"
import type { ResortBasicInfoFormState } from "@/components/resort-basic-info/types"

function infoToForm(info: ResortBasicInfo): ResortBasicInfoFormState {
  return {
    sort_order: info.sort_order,
    estd: info.estd,
    lat: info.lat != null ? String(info.lat) : "",
    lon: info.lon != null ? String(info.lon) : "",
    logo_url: info.logo_url ?? "",
    country: {
      id: info.country.id,
      code: info.country.code,
      locales: info.country.locales.map((l) => ({
        id: l.id,
        locale_id: l.locale_id,
        name: l.name,
      })),
    },
    city: {
      id: info.city.id,
      code: info.city.code ?? "",
      locales: info.city.locales.map((l) => ({
        id: l.id,
        locale_id: l.locale_id,
        name: l.name,
      })),
    },
    locales: info.locales.map((l) => ({
      id: l.id,
      locale_id: l.locale_id,
      name: l.name,
      tagline: l.tagline,
      short_description: l.short_description ?? "",
      address: l.address ?? "",
      sort_order: l.sort_order,
    })),
  }
}

export default function ResortBasicInfoPage() {
  const params = useParams()
  const { t } = useTranslation()
  const resortId = Number(params.id)

  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<ResortBasicInfoFormState | null>(null)
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([])
  const [generalEditing, setGeneralEditing] = useState(false)
  const [translationsEditing, setTranslationsEditing] = useState(false)

  async function refresh() {
    try {
      const res = await resortBasicInfoService.get(resortId)
      setForm(infoToForm(res.resort_basic_info))
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    localesService
      .list({ size: 50, sort_by: "sortOrder" })
      .then((res) => setAvailableLocales(res.data))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="size-6" />
        </div>
      ) : !form ? (
        <p className="text-sm text-muted-foreground">{t("basicInfo.notFound")}</p>
      ) : (
        <div className="space-y-6">
          <ResortLogoSection
            resortId={resortId}
            form={form}
            onSaved={refresh}
          />
          <ResortGeneralInfo
            resortId={resortId}
            form={form}
            onSaved={refresh}
            editing={generalEditing}
            onEditingChange={setGeneralEditing}
            availableLocales={availableLocales}
          />
          <ResortLocaleTranslations
            resortId={resortId}
            form={form}
            availableLocales={availableLocales}
            onSaved={refresh}
            editing={translationsEditing}
            onEditingChange={setTranslationsEditing}
          />
        </div>
      )}
    </div>
  )
}
