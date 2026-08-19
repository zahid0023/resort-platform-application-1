import type { Locale } from "@/services/locales"
import type { ResortFacilityGroupSummary, IconType } from "@/services/resort-facility-groups"

export type ResortFacilityGroupDialogMode = "create" | "view"

export interface LocaleRow {
  id?: number
  locale?: Locale          // present on existing rows, read from API, immutable
  locale_id?: number | ""  // only set while adding a new row
  name: string
  description: string
  sort_order: number
  _new?: boolean
}

export interface ResortFacilityGroupFormState {
  facility_group_id: number | ""
  code: string
  sort_order: number
  icon_type: IconType | ""
  icon_value: string
  icon_color: string
  /** create-only, single "en" translation — the backend resolves the locale server-side */
  locale: { name: string; description: string; sort_order: number }
  /** view-only, populated lazily by the Translations section on first load, see the sub-resource GET */
  locales: LocaleRow[]
}

export const emptyForm: ResortFacilityGroupFormState = {
  facility_group_id: "",
  code: "",
  sort_order: 0,
  icon_type: "",
  icon_value: "",
  icon_color: "",
  locale: { name: "", description: "", sort_order: 0 },
  locales: [],
}

export function toFormState(group: ResortFacilityGroupSummary): ResortFacilityGroupFormState {
  return {
    facility_group_id: group.facility_group_id ?? "",
    code: group.code,
    sort_order: group.sort_order,
    icon_type: (group.icon_type ?? "") as IconType | "",
    icon_value: group.icon_value ?? "",
    icon_color: String(group.icon_meta?.color ?? ""),
    locale: { name: "", description: "", sort_order: 0 },
    locales: [],
  }
}

export function toApiIconPayload(form: Pick<ResortFacilityGroupFormState, "icon_type" | "icon_value" | "icon_color">) {
  const hasIcon = !!form.icon_type && !!form.icon_value
  return {
    icon_type: hasIcon ? (form.icon_type as IconType) : null,
    icon_value: hasIcon ? form.icon_value : null,
    icon_meta: hasIcon && form.icon_color ? { color: form.icon_color } : null,
  }
}
