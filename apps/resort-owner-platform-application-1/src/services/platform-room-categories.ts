import { api } from "./api"

export interface PlatformRoomCategoryLocale {
  id: number
  locale_id: number
  name: string
  description?: string
  sort_order: number
}

export interface PlatformRoomCategorySummary {
  id: number
  code: string
  sort_order: number
  locales: PlatformRoomCategoryLocale[]
}

export interface PlatformRoomCategoryListResponse {
  data: PlatformRoomCategorySummary[]
  has_next: boolean
  has_previous: boolean
  total_pages: number
  total_elements: number
}

export const platformRoomCategoriesService = {
  list(params: { page?: number; size?: number; sort_by?: string; code?: string } = {}): Promise<PlatformRoomCategoryListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.sort_by) q.set("sort_by", params.sort_by)
    if (params.code) q.set("code", params.code)
    return api.get<PlatformRoomCategoryListResponse>(`/room-categories?${q}`)
  },
}
