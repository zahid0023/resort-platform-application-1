"use client"

import { ResortAddressSection } from "@/components/resort-basic-info/resort-address-section"
import { ResortAddressLocaleTranslations } from "@/components/resort-basic-info/resort-address-locale-translations"
import type { ResortAddress } from "@/services/resorts"
import type { Locale } from "@/services/locales"

interface AddressOverviewProps {
  resortId: number
  address: ResortAddress
  availableLocales: Locale[]
  totalLocaleCount: number | null
  editing: boolean
  onEditingChange: (v: boolean) => void
  onSaved?: () => void | Promise<void>
  reloadToken?: number
}

export function AddressOverview({
  resortId,
  address,
  availableLocales,
  totalLocaleCount,
  editing,
  onEditingChange,
  onSaved,
  reloadToken,
}: AddressOverviewProps) {
  return (
    <div className="flex flex-col gap-6">
      <ResortAddressSection
        resortId={resortId}
        address={address}
        onSaved={onSaved}
        editing={editing}
        onEditingChange={onEditingChange}
      />

      <ResortAddressLocaleTranslations
        resortId={resortId}
        availableLocales={availableLocales}
        totalLocaleCount={totalLocaleCount}
        reloadToken={reloadToken}
      />
    </div>
  )
}
