import { api } from "./api"

export interface PlatformFacilityGroupLocale {
  id: number
  locale_id: number
  name: string
  sort_order: number
}

export interface PlatformFacilityGroupSummary {
  id: number
  code: string
  sort_order: number
  icon_type?: string
  icon_value?: string
  icon_meta?: Record<string, unknown>
  locales: PlatformFacilityGroupLocale[]
}

export interface PlatformFacilityGroupListResponse {
  data: PlatformFacilityGroupSummary[]
  has_next: boolean
  has_previous: boolean
  total_pages: number
  total_elements: number
}

export const platformFacilityGroupsService = {
  list(params: { page?: number; size?: number; sort_by?: string; scope_code?: "RESORT" | "ROOM_CATEGORY" | "ROOM" } = {}): Promise<PlatformFacilityGroupListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.sort_by) q.set("sort_by", params.sort_by)
    if (params.scope_code) q.set("scope-code", params.scope_code)
    return api.get<PlatformFacilityGroupListResponse>(`/facility-groups?${q}`)
  },
}
