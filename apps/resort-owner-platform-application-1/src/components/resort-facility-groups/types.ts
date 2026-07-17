import type { ResortFacilityGroupSummary, IconType } from "@/services/resort-facility-groups"

export type ResortFacilityGroupDialogMode = "create" | "view"

export interface LocaleRow {
  id?: number
  locale_id: number | ""
  name: string
  description: string
  sort_order: number
  _new?: boolean
}

export interface ResortFacilityGroupFormState {
  facility_group_id: number | ""
  sort_order: number
  icon_type: IconType | ""
  icon_value: string
  icon_color: string
  locales: LocaleRow[]
}

export const emptyForm: ResortFacilityGroupFormState = {
  facility_group_id: "",
  sort_order: 0,
  icon_type: "",
  icon_value: "",
  icon_color: "",
  locales: [],
}

export function toFormState(group: ResortFacilityGroupSummary): ResortFacilityGroupFormState {
  return {
    facility_group_id: group.facility_group_id ?? "",
    sort_order: group.sort_order,
    icon_type: (group.icon_type ?? "") as IconType | "",
    icon_value: group.icon_value ?? "",
    icon_color: String(group.icon_meta?.color ?? ""),
    locales: group.locales.map((l) => ({
      id: l.id,
      locale_id: l.locale_id,
      name: l.name,
      description: l.description ?? "",
      sort_order: l.sort_order,
    })),
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
