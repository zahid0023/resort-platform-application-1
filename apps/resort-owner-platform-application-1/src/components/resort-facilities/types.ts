import type { Locale } from "@/services/locales"
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
