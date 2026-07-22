import type { ResortRoomCategory } from "@/services/resort-room-categories"

export type ResortRoomCategoryDialogMode = "create" | "view"

export interface LocaleRow {
  id?: number
  locale_id: number | ""
  name: string
  description: string
  sort_order: number
  _new?: boolean
}

export interface ResortRoomCategoryFormState {
  room_category_id: number | ""
  room_category_code: string
  code: string
  sort_order: number
  // meta fields — collected in create mode; meta section handles them in view mode
  max_adults: number
  max_children: number
  max_infants: number
  max_occupancy: number
  room_size: string
  room_size_unit_id: number | ""
  bedroom_count: string
  bathroom_count: string
  default_check_in_time: string
  default_check_out_time: string
  is_extra_bed_allowed: boolean
  max_extra_beds: number
  is_smoking_allowed: boolean
  is_pets_allowed: boolean
  minimum_stay_nights: string
  maximum_stay_nights: string
  locales: LocaleRow[]
}

export const emptyForm: ResortRoomCategoryFormState = {
  room_category_id: "",
  room_category_code: "",
  code: "",
  sort_order: 0,
  max_adults: 2,
  max_children: 0,
  max_infants: 0,
  max_occupancy: 2,
  room_size: "",
  room_size_unit_id: "",
  bedroom_count: "",
  bathroom_count: "",
  default_check_in_time: "",
  default_check_out_time: "",
  is_extra_bed_allowed: false,
  max_extra_beds: 0,
  is_smoking_allowed: false,
  is_pets_allowed: false,
  minimum_stay_nights: "",
  maximum_stay_nights: "",
  locales: [{ locale_id: "", name: "", description: "", sort_order: 0 }],
}

export function toFormState(rc: ResortRoomCategory): ResortRoomCategoryFormState {
  return {
    room_category_id: rc.room_category.id,
    room_category_code: rc.room_category.code,
    code: rc.code,
    sort_order: rc.sort_order,
    // meta defaults — meta is loaded separately by ResortRoomCategoryMetaSection
    max_adults: 2,
    max_children: 0,
    max_infants: 0,
    max_occupancy: 2,
    room_size: "",
    room_size_unit_id: "",
    bedroom_count: "",
    bathroom_count: "",
    default_check_in_time: "",
    default_check_out_time: "",
    is_extra_bed_allowed: false,
    max_extra_beds: 0,
    is_smoking_allowed: false,
    is_pets_allowed: false,
    minimum_stay_nights: "",
    maximum_stay_nights: "",
    locales: (rc.locales ?? []).map((l) => ({
      id: l.id,
      locale_id: l.locale_id,
      name: l.name,
      description: l.description ?? "",
      sort_order: l.sort_order,
    })),
  }
}
