"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Building2, MapPin, RefreshCw } from "lucide-react"
import { Button, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from "@resort/shadcn-ui"
import { PageHeader } from "@/components/shared/page-header"
import { BasicInfoOverview } from "@/components/resort-overview/basic-info-overview"
import { AddressOverview } from "@/components/resort-overview/address-overview"
import { useLocales } from "@/providers/locales-provider"
import { getResort, type Resort } from "@/services/resorts"
import { resortAddressService } from "@/services/resort-address"

type TabKey = "basicInfo" | "address"

export default function ResortOverviewPage() {
  const params = useParams()
  const { t } = useTranslation()
  const resortId = Number(params.id)

  const [loading, setLoading] = useState(true)
  const [resort, setResort] = useState<Resort | null>(null)
  const [generalEditing, setGeneralEditing] = useState(false)
  const [addressEditing, setAddressEditing] = useState(false)

  const [activeTab, setActiveTab] = useState<TabKey>("basicInfo")
  const [visitedTabs, setVisitedTabs] = useState<Record<TabKey, boolean>>({ basicInfo: true, address: false })

  const [basicInfoReloadToken, setBasicInfoReloadToken] = useState(0)
  const [addressReloadToken, setAddressReloadToken] = useState(0)
  const [refreshingBasicInfo, setRefreshingBasicInfo] = useState(false)
  const [refreshingAddress, setRefreshingAddress] = useState(false)

  const {
    locales: availableLocales,
    totalCount: totalLocaleCount,
    loaded: localesLoaded,
    refresh: refreshLocales,
    refreshCount: refreshLocaleCount,
  } = useLocales()

  async function loadResort() {
    try {
      const res = await getResort(resortId)
      setResort(res.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("resortOverview.errLoad"))
    } finally {
      setLoading(false)
    }
  }

  async function refreshBasicInfoTab() {
    setRefreshingBasicInfo(true)
    try {
      const [res] = await Promise.all([
        getResort(resortId),
        refreshLocaleCount().catch(() => {}),
      ])
      setResort(res.data)
      setBasicInfoReloadToken((k) => k + 1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("resortOverview.errLoad"))
    } finally {
      setRefreshingBasicInfo(false)
    }
  }

  async function refreshAddressTab() {
    setRefreshingAddress(true)
    try {
      const [res] = await Promise.all([
        resortAddressService.get(resortId),
        refreshLocaleCount().catch(() => {}),
      ])
      setResort((prev) => (prev ? { ...prev, address: res.data } : prev))
      setAddressReloadToken((k) => k + 1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("resortOverview.errLoad"))
    } finally {
      setRefreshingAddress(false)
    }
  }

  useEffect(() => {
    loadResort()
    if (!localesLoaded) refreshLocales().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleTabChange(value: string) {
    const tab = value as TabKey
    setActiveTab(tab)
    setVisitedTabs((prev) => (prev[tab] ? prev : { ...prev, [tab]: true }))
  }

  const refreshing = activeTab === "basicInfo" ? refreshingBasicInfo : refreshingAddress

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        eyebrow={t("resortPortal.title")}
        title={resort?.basic_info.locale?.name ?? resort?.code ?? t("resortOverview.pageTitle")}
        subtitle={t("resortOverview.pageSubtitle")}
      />

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      ) : !resort ? (
        <p className="text-sm text-muted-foreground">{t("resortOverview.notFound")}</p>
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="flex items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="basicInfo" className="gap-1.5 cursor-pointer">
                <Building2 className="size-3.5" />
                {t("resortOverview.basicInfo.title")}
              </TabsTrigger>
              <TabsTrigger value="address" className="gap-1.5 cursor-pointer">
                <MapPin className="size-3.5" />
                {t("resortOverview.address.title")}
              </TabsTrigger>
            </TabsList>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={activeTab === "basicInfo" ? refreshBasicInfoTab : refreshAddressTab}
              disabled={refreshing}
              className="h-7 text-xs px-2.5 gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {t("common.refresh")}
            </Button>
          </div>

          <TabsContent value="basicInfo" forceMount className={activeTab === "basicInfo" ? undefined : "hidden"}>
            <BasicInfoOverview
              resortId={resortId}
              basicInfo={resort.basic_info}
              availableLocales={availableLocales}
              totalLocaleCount={totalLocaleCount}
              editing={generalEditing}
              onEditingChange={setGeneralEditing}
              onSaved={refreshBasicInfoTab}
              reloadToken={basicInfoReloadToken}
            />
          </TabsContent>
          <TabsContent
            value="address"
            {...(visitedTabs.address ? { forceMount: true as const } : {})}
            className={activeTab === "address" ? undefined : "hidden"}
          >
            {visitedTabs.address && (
              <AddressOverview
                resortId={resortId}
                address={resort.address}
                availableLocales={availableLocales}
                totalLocaleCount={totalLocaleCount}
                editing={addressEditing}
                onEditingChange={setAddressEditing}
                onSaved={refreshAddressTab}
                reloadToken={addressReloadToken}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
