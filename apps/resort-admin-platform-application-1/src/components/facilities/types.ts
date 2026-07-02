import type { IconValue } from "@/components/shared/icon-picker"
import type { Facility, FacilitySummary, IconType } from "@/services/facilities"

export type FacilityDialogMode = "create" | "view"

export interface LocaleRow {
  id?: number
  locale_id: number | ""
  name: string
  description: string
  sort_order: number
  _new?: boolean
}

export interface FacilityFormState {
  facility_group_id: number | ""
  code: string
  sort_order: number
  icon: IconValue
  locales: LocaleRow[]
}

/** Convert API entity → IconValue for the icon system. */
export function toIconValue(facility: FacilitySummary | Facility): IconValue {
  return {
    type: (facility.icon_type ?? "") as IconType | "",
    value: facility.icon_value ?? "",
    meta: Object.fromEntries(
      Object.entries(facility.icon_meta ?? {}).map(([k, v]) => [k, String(v)]),
    ),
  }
}

/** Convert IconValue → API payload fields. */
export function fromIconValue(icon: IconValue) {
  return {
    icon_type: icon.type as IconType,
    icon_value: icon.value || undefined,
    icon_meta: Object.keys(icon.meta).length > 0 ? icon.meta : undefined,
  }
}
