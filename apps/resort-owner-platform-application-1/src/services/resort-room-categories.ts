import { api } from "./api"

export interface ResortRoomCategoryLocale {
  id: number
  locale_id: number
  name: string
  description?: string
  sort_order: number
}

export interface ResortRoomCategory {
  id: number
  resort_id: number
  room_category_id: number
  code: string
  sort_order: number
  max_adults: number
  max_children: number
  max_occupancy: number
  default_check_in_time?: string
  default_check_out_time?: string
  is_extra_bed_allowed: boolean
  max_extra_beds: number
  is_smoking_allowed: boolean
  is_pets_allowed: boolean
  locales: ResortRoomCategoryLocale[]
}

export interface ResortRoomCategoryListResponse {
  data: ResortRoomCategory[]
  current_page: number
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export interface CreateResortRoomCategoryLocaleRequest {
  locale_id: number
  name: string
  description?: string
  sort_order: number
}

export interface CreateResortRoomCategoryRequest {
  room_category_id: number
  code: string
  sort_order: number
  max_adults: number
  max_children: number
  max_occupancy: number
  default_check_in_time?: string
  default_check_out_time?: string
  is_extra_bed_allowed: boolean
  max_extra_beds: number
  is_smoking_allowed: boolean
  is_pets_allowed: boolean
  locales?: CreateResortRoomCategoryLocaleRequest[]
}

export interface UpdateResortRoomCategoryRequest {
  sort_order: number
  max_adults: number
  max_children: number
  max_occupancy: number
  default_check_in_time?: string | null
  default_check_out_time?: string | null
  is_extra_bed_allowed: boolean
  max_extra_beds: number
  is_smoking_allowed: boolean
  is_pets_allowed: boolean
}

export interface UpdateResortRoomCategoryLocaleRequest {
  name: string
  description?: string
  sort_order: number
}

export interface MutationResponse {
  success: boolean
  id: number
}

export interface ListParams {
  page?: number
  size?: number
  sort_by?: "id" | "code" | "sortOrder" | "maxAdults" | "maxOccupancy" | "createdAt"
  sort_dir?: "ASC" | "DESC"
  code?: string
  roomCategoryId?: number
  isExtraBedAllowed?: boolean
  isSmokingAllowed?: boolean
  isPetsAllowed?: boolean
}

function base(resortId: number) {
  return `/resorts/${resortId}/room-categories`
}

export const resortRoomCategoriesService = {
  list(resortId: number, params: ListParams = {}): Promise<ResortRoomCategoryListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.sort_by) q.set("sort_by", params.sort_by)
    if (params.sort_dir) q.set("sort_dir", params.sort_dir)
    if (params.code) q.set("code", params.code)
    if (params.roomCategoryId !== undefined) q.set("roomCategoryId", String(params.roomCategoryId))
    if (params.isExtraBedAllowed !== undefined) q.set("isExtraBedAllowed", String(params.isExtraBedAllowed))
    if (params.isSmokingAllowed !== undefined) q.set("isSmokingAllowed", String(params.isSmokingAllowed))
    if (params.isPetsAllowed !== undefined) q.set("isPetsAllowed", String(params.isPetsAllowed))
    return api.get<ResortRoomCategoryListResponse>(`${base(resortId)}?${q}`)
  },

  get(resortId: number, id: number): Promise<{ data: ResortRoomCategory }> {
    return api.get<{ data: ResortRoomCategory }>(`${base(resortId)}/${id}`)
  },

  create(resortId: number, body: CreateResortRoomCategoryRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(base(resortId), body)
  },

  update(resortId: number, id: number, body: UpdateResortRoomCategoryRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`${base(resortId)}/${id}`, body)
  },

  remove(resortId: number, id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`${base(resortId)}/${id}`)
  },

  addLocale(resortId: number, resortRoomCategoryId: number, body: CreateResortRoomCategoryLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`${base(resortId)}/${resortRoomCategoryId}/locales`, body)
  },

  updateLocale(resortId: number, resortRoomCategoryId: number, localeId: number, body: UpdateResortRoomCategoryLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`${base(resortId)}/${resortRoomCategoryId}/locales/${localeId}`, body)
  },

  removeLocale(resortId: number, resortRoomCategoryId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`${base(resortId)}/${resortRoomCategoryId}/locales/${localeId}`)
  },
}
