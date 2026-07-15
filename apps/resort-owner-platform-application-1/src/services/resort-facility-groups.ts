import { api } from "./api"

export type IconType = "LUCIDE" | "IMAGE" | "SVG" | "EXTERNAL"

export interface ResortFacilityGroupLocale {
  id: number
  locale_id: number
  name: string
  description?: string
  sort_order: number
}

export interface ResortFacilityGroupSummary {
  id: number
  resort_id: number
  facility_group_id?: number
  sort_order: number
  icon_type?: IconType
  icon_value?: string
  icon_meta?: Record<string, unknown>
  locales: ResortFacilityGroupLocale[]
}

export interface ResortFacilityGroupListResponse {
  data: ResortFacilityGroupSummary[]
  current_page: number
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export interface CreateResortFacilityGroupLocaleRequest {
  locale_id: number
  name: string
  description?: string
  sort_order: number
}

export interface CreateResortFacilityGroupRequest {
  facility_group_id?: number
  sort_order: number
  icon_type?: IconType | null
  icon_value?: string | null
  icon_meta?: Record<string, unknown> | null
  locales?: CreateResortFacilityGroupLocaleRequest[]
}

export interface UpdateResortFacilityGroupRequest {
  facility_group_id?: number | null
  sort_order: number
  icon_type?: IconType | null
  icon_value?: string | null
  icon_meta?: Record<string, unknown> | null
}

export interface UpdateResortFacilityGroupLocaleRequest {
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
  sort_by?: "id" | "sortOrder" | "createdAt"
  sort_dir?: "ASC" | "DESC"
}

export const resortFacilityGroupsService = {
  list(resortId: number, params: ListParams = {}): Promise<ResortFacilityGroupListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.sort_by) q.set("sort_by", params.sort_by)
    if (params.sort_dir) q.set("sort_dir", params.sort_dir)
    return api.get<ResortFacilityGroupListResponse>(`/resorts/${resortId}/facility-groups?${q}`)
  },

  get(resortId: number, id: number): Promise<{ data: ResortFacilityGroupSummary }> {
    return api.get<{ data: ResortFacilityGroupSummary }>(`/resorts/${resortId}/facility-groups/${id}`)
  },

  create(resortId: number, body: CreateResortFacilityGroupRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/resorts/${resortId}/facility-groups`, body)
  },

  update(resortId: number, id: number, body: UpdateResortFacilityGroupRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/resorts/${resortId}/facility-groups/${id}`, body)
  },

  remove(resortId: number, id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/resorts/${resortId}/facility-groups/${id}`)
  },

  addLocale(resortId: number, groupId: number, body: CreateResortFacilityGroupLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/resorts/${resortId}/facility-groups/${groupId}/locales`, body)
  },

  updateLocale(resortId: number, groupId: number, localeId: number, body: UpdateResortFacilityGroupLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/resorts/${resortId}/facility-groups/${groupId}/locales/${localeId}`, body)
  },

  removeLocale(resortId: number, groupId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/resorts/${resortId}/facility-groups/${groupId}/locales/${localeId}`)
  },
}
