"use client"

import { ResortGeneralInfo } from "@/components/resort-basic-info/resort-general-info"
import { ResortLocaleTranslations } from "@/components/resort-basic-info/resort-locale-translations"
import type { ResortBasicInfo } from "@/services/resorts"
import type { Locale } from "@/services/locales"

interface BasicInfoOverviewProps {
  resortId: number
  basicInfo: ResortBasicInfo
  availableLocales: Locale[]
  totalLocaleCount: number | null
  editing: boolean
  onEditingChange: (v: boolean) => void
  onSaved?: () => void | Promise<void>
  reloadToken?: number
}

export function BasicInfoOverview({
  resortId,
  basicInfo,
  availableLocales,
  totalLocaleCount,
  editing,
  onEditingChange,
  onSaved,
  reloadToken,
}: BasicInfoOverviewProps) {
  return (
    <div className="flex flex-col gap-6">
      <ResortGeneralInfo
        resortId={resortId}
        basicInfo={basicInfo}
        onSaved={onSaved}
        editing={editing}
        onEditingChange={onEditingChange}
      />

      <ResortLocaleTranslations
        resortId={resortId}
        availableLocales={availableLocales}
        totalLocaleCount={totalLocaleCount}
        reloadToken={reloadToken}
      />
    </div>
  )
}
