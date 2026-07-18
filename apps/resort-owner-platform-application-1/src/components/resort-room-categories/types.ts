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
  code: string
  sort_order: number
  max_adults: number
  max_children: number
  max_occupancy: number
  default_check_in_time: string
  default_check_out_time: string
  is_extra_bed_allowed: boolean
  max_extra_beds: number
  is_smoking_allowed: boolean
  is_pets_allowed: boolean
  locales: LocaleRow[]
}

export const emptyForm: ResortRoomCategoryFormState = {
  room_category_id: "",
  code: "",
  sort_order: 0,
  max_adults: 2,
  max_children: 0,
  max_occupancy: 2,
  default_check_in_time: "",
  default_check_out_time: "",
  is_extra_bed_allowed: false,
  max_extra_beds: 0,
  is_smoking_allowed: false,
  is_pets_allowed: false,
  locales: [{ locale_id: "", name: "", description: "", sort_order: 0 }],
}

export function toFormState(rc: ResortRoomCategory): ResortRoomCategoryFormState {
  return {
    room_category_id: rc.room_category_id,
    code: rc.code,
    sort_order: rc.sort_order,
    max_adults: rc.max_adults,
    max_children: rc.max_children,
    max_occupancy: rc.max_occupancy,
    default_check_in_time: rc.default_check_in_time ?? "",
    default_check_out_time: rc.default_check_out_time ?? "",
    is_extra_bed_allowed: rc.is_extra_bed_allowed,
    max_extra_beds: rc.max_extra_beds,
    is_smoking_allowed: rc.is_smoking_allowed,
    is_pets_allowed: rc.is_pets_allowed,
    locales: rc.locales.map((l) => ({
      id: l.id,
      locale_id: l.locale_id,
      name: l.name,
      description: l.description ?? "",
      sort_order: l.sort_order,
    })),
  }
}
