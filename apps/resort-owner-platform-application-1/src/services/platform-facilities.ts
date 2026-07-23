import { api } from "./api"

export interface PlatformFacilityLocale {
  id: number
  locale_id: number
  name: string
  sort_order: number
}

export interface PlatformFacilitySummary {
  id: number
  facility_group_id: number
  code: string
  sort_order?: number
  icon_type?: string
  icon_value?: string
  icon_meta?: Record<string, unknown>
  locales: PlatformFacilityLocale[]
}

export interface PlatformFacilityListResponse {
  data: PlatformFacilitySummary[]
  has_next: boolean
  has_previous: boolean
  total_pages: number
  total_elements: number
}

export const platformFacilitiesService = {
  list(params: { page?: number; size?: number; sort_by?: string; scope_code?: "RESORT" | "ROOM_CATEGORY" | "ROOM"; facilityGroupId?: number } = {}): Promise<PlatformFacilityListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.sort_by) q.set("sort_by", params.sort_by)
    if (params.scope_code) q.set("scope-code", params.scope_code)
    if (params.facilityGroupId !== undefined) q.set("facility-group-id", String(params.facilityGroupId))
    return api.get<PlatformFacilityListResponse>(`/facilities?${q}`)
  },
}
