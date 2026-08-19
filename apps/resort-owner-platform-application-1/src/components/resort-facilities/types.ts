import type { Locale } from "@/services/locales"
import type { DayOfWeek } from "@/services/days-of-week"
import type { ResortFacilitySummary, IconType } from "@/services/resort-facilities"

export type ResortFacilityDialogMode = "create" | "view"
export type FacilityMode = "platform" | "custom"

export interface LocaleRow {
  id?: number
  locale?: Locale          // present on existing rows, read from API, immutable
  locale_id?: number | ""  // only set while adding a new row
  name: string
  description: string
  sort_order: number
  _new?: boolean
}

// Always exactly one of these per configured day — the full week (all 7 days_of_week) is rendered
// as a fixed grid, so unlike LocaleRow there's no "add a new row" concept or draft placeholder.
// A day with no saved record yet just has no matching entry in ResortFacilityFormState.operating_hours.
export interface OperatingHoursRow {
  id: number
  day_of_week: DayOfWeek
  opens_at: string   // "" or "HH:mm:ss"
  closes_at: string  // "" or "HH:mm:ss"
  is_closed: boolean
  is_twenty_four_hours: boolean
}

export interface ResortFacilityFormState {
  resort_facility_group_id: number | ""
  facility_id: number | ""
  code: string
  sort_order: number
  is_highlighted: boolean
  icon_type: IconType | ""
  icon_value: string
  icon_color: string
  /** create-only, single "en" translation — the backend resolves the locale server-side */
  locale: { name: string; description: string; sort_order: number }
  /** view-only, populated lazily by the Translations section on first load, see the sub-resource GET */
  locales: LocaleRow[]
  /** view-only, populated lazily by the Operating Hours section on first load — not part of create,
   * since the sub-resource requires an existing facility_id in the URL path. */
  operating_hours: OperatingHoursRow[]
}

export const emptyForm: ResortFacilityFormState = {
  resort_facility_group_id: "",
  facility_id: "",
  code: "",
  sort_order: 0,
  is_highlighted: false,
  icon_type: "",
  icon_value: "",
  icon_color: "",
  locale: { name: "", description: "", sort_order: 0 },
  locales: [],
  operating_hours: [],
}

export function toFormState(facility: ResortFacilitySummary): ResortFacilityFormState {
  return {
    resort_facility_group_id: "",
    facility_id: "",
    code: facility.code,
    sort_order: facility.sort_order,
    is_highlighted: facility.is_highlighted ?? false,
    icon_type: (facility.icon_type ?? "") as IconType | "",
    icon_value: facility.icon_value ?? "",
    icon_color: String(facility.icon_meta?.color ?? ""),
    locale: { name: "", description: "", sort_order: 0 },
    locales: [],
    operating_hours: [],
  }
}

export function toApiIconPayload(form: Pick<ResortFacilityFormState, "icon_type" | "icon_value" | "icon_color">) {
  const hasIcon = !!form.icon_type && !!form.icon_value
  return {
    icon_type: hasIcon ? (form.icon_type as IconType) : null,
    icon_value: hasIcon ? form.icon_value : null,
    icon_meta: hasIcon && form.icon_color ? { color: form.icon_color } : null,
  }
}
