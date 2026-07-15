import type { ResortFacilitySummary, IconType } from "@/services/resort-facilities"

export type ResortFacilityDialogMode = "create" | "view"
export type FacilityMode = "platform" | "custom"

export interface LocaleRow {
  id?: number
  locale_id: number | ""
  name: string
  description: string
  sort_order: number
  _new?: boolean
}

export interface ResortFacilityFormState {
  resort_facility_group_id: number | ""
  facility_id: number | ""
  sort_order: number
  icon_type: IconType | ""
  icon_value: string
  icon_color: string
  locales: LocaleRow[]
}

export const emptyForm: ResortFacilityFormState = {
  resort_facility_group_id: "",
  facility_id: "",
  sort_order: 0,
  icon_type: "",
  icon_value: "",
  icon_color: "",
  locales: [{ locale_id: "", name: "", description: "", sort_order: 0 }],
}

export function toFormState(facility: ResortFacilitySummary): ResortFacilityFormState {
  return {
    resort_facility_group_id: facility.resort_facility_group_id,
    facility_id: facility.facility_id ?? "",
    sort_order: facility.sort_order,
    icon_type: (facility.icon_type ?? "") as IconType | "",
    icon_value: facility.icon_value ?? "",
    icon_color: String(facility.icon_meta?.color ?? ""),
    locales: facility.locales.map((l) => ({
      id: l.id,
      locale_id: l.locale_id,
      name: l.name,
      description: l.description ?? "",
      sort_order: l.sort_order,
    })),
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
