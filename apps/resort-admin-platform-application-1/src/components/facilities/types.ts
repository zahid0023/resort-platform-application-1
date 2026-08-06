import type { IconValue } from "@/components/shared/icon-picker"
import type { Facility, FacilitySummary, IconType } from "@/services/facilities"
import type { FacilityGroupSummary } from "@/services/facility-groups"
import type { Locale } from "@/services/locales"

export type FacilityDialogMode = "create" | "view"

export interface LocaleRow {
  id?: number
  /** Present on existing rows — read from the API, immutable once created */
  locale?: Locale
  /** Only set while adding a brand-new translation row — the language being assigned */
  locale_id?: number | ""
  name: string
  description: string
  sort_order: number
  _new?: boolean
}

export interface FacilityFormState {
  /** The full owning group, not just its id — `Facility`/`FacilitySummary` embed it directly (per the
   * Facilities API spec), and the create-mode picker dialog also hands back the full object, so there's
   * never a need to separately re-fetch the group's display name. `null` until one is picked/loaded. */
  facility_group: FacilityGroupSummary | null
  code: string
  sort_order: number
  icon: IconValue
  /** Create mode only — the single "en" translation created alongside the facility */
  locale: { name: string; description: string; sort_order: number }
  /** View mode only — every existing translation, populated after creation */
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
