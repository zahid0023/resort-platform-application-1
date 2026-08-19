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
  notes: string
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

// A single time range within a day (e.g. the "6AM-1PM" half of a lunch/dinner split). Each window
// maps 1:1 to one persisted OperatingHoursRow once saved — `id` is set only for a window that
// already exists as its own row; a window added locally (not yet saved) has no `id`.
export interface OperatingHoursWindowDraft {
  id?: number
  opens_at: string   // "" or "HH:mm"
  closes_at: string  // "" or "HH:mm"
}

// create-only per-day draft — the API requires the full weekly schedule on the create POST, so
// unlike OperatingHoursRow (an existing, persisted sub-resource row) this never round-trips
// through the API on its own; it's held in ResortFacilityFormState until the whole form submits.
// A day can have multiple windows (e.g. a pool open 6AM-1PM and again 4PM-11PM) — mutually
// exclusive with is_closed/is_twenty_four_hours, same as the API's own validation.
export interface OperatingHoursDraft {
  is_closed: boolean
  is_twenty_four_hours: boolean
  windows: OperatingHoursWindowDraft[]
}

// Defaults every unconfigured day to Open 24 Hours rather than Custom — Custom's own "add a
// window" UI has nothing useful to show until the owner has actually picked times, so defaulting
// to it would surface an empty, unprompted windows section on every day before any choice is made.
export const emptyOperatingHoursDraft: OperatingHoursDraft = {
  is_closed: false, is_twenty_four_hours: true, windows: [],
}

// "HH:mm" (TimePickerField's value contract) <-> "HH:mm:ss" (API)
export function toTimeInputValue(v: string | null | undefined): string {
  return v ? v.slice(0, 5) : ""
}
export function toApiTime(v: string): string | null {
  if (!v) return null
  return v.length === 5 ? `${v}:00` : v
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
  locale: { name: string; description: string; notes: string; sort_order: number }
  /** view-only, populated lazily by the Translations section on first load, see the sub-resource GET */
  locales: LocaleRow[]
  /** view-only, populated lazily by the Operating Hours section on first load, see the sub-resource GET */
  operating_hours: OperatingHoursRow[]
  /** create-only — the full weekly schedule collected before the facility exists, keyed by
   * day_of_week id; the create POST requires operating_hours to cover every active day. */
  operating_hours_draft: Record<number, OperatingHoursDraft>
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
  locale: { name: "", description: "", notes: "", sort_order: 0 },
  locales: [],
  operating_hours: [],
  operating_hours_draft: {},
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
    locale: { name: "", description: "", notes: "", sort_order: 0 },
    locales: [],
    operating_hours: [],
    operating_hours_draft: {},
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
