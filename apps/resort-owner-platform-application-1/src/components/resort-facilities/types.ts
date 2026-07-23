import type { ResortFacilitySummary, IconType, ResortFacilityGroupRef, PlatformFacilityRef, FacilityPriceTypeRef, ResortFacilityPrice } from "@/services/resort-facilities"

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

export interface ResortFacilityPriceFormRow {
  price_unit_id: number | ""
  currency_id: number | ""
  amount: string
  notes: string
  sort_order: number
}

export interface ResortFacilityFormState {
  resort_facility_group_id: number | ""
  facility_id: number | ""
  facility_price_type_id: number | ""
  sort_order: number
  is_highlighted: boolean
  icon_type: IconType | ""
  icon_value: string
  icon_color: string
  locales: LocaleRow[]
  // Full objects for view-mode display
  resort_facility_group: ResortFacilityGroupRef | null
  platform_facility: PlatformFacilityRef | null
  facility_price_type: FacilityPriceTypeRef | null
  prices: ResortFacilityPrice[]
  // Price entry for create mode when PAID
  resort_facility_price: ResortFacilityPriceFormRow | null
}

export const emptyForm: ResortFacilityFormState = {
  resort_facility_group_id: "",
  facility_id: "",
  facility_price_type_id: "",
  sort_order: 0,
  is_highlighted: false,
  icon_type: "",
  icon_value: "",
  icon_color: "",
  locales: [{ locale_id: "", name: "", description: "", sort_order: 0 }],
  resort_facility_group: null,
  platform_facility: null,
  facility_price_type: null,
  prices: [],
  resort_facility_price: null,
}

export function toFormState(facility: ResortFacilitySummary): ResortFacilityFormState {
  return {
    resort_facility_group_id: facility.resort_facility_group.id,
    facility_id: facility.platform_facility?.id ?? "",
    facility_price_type_id: facility.facility_price_type.id,
    sort_order: facility.sort_order,
    is_highlighted: facility.is_highlighted ?? false,
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
    resort_facility_group: facility.resort_facility_group,
    platform_facility: facility.platform_facility ?? null,
    facility_price_type: facility.facility_price_type,
    prices: facility.prices ?? [],
    resort_facility_price: null,
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
