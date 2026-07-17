import { api } from "./api"

export type IconType = "LUCIDE" | "IMAGE" | "SVG" | "EXTERNAL"

export interface ResortFacilityLocale {
  id: number
  locale_id: number
  name: string
  description: string
  sort_order: number
}

export interface ResortFacilitySummary {
  id: number
  resort_id: number
  resort_facility_group_id: number
  facility_id?: number
  sort_order: number
  is_highlighted: boolean
  icon_type?: IconType
  icon_value?: string
  icon_meta?: Record<string, unknown>
  locales: ResortFacilityLocale[]
}

export interface ResortFacilityListResponse {
  data: ResortFacilitySummary[]
  current_page: number
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export interface CreateResortFacilityLocaleRequest {
  locale_id: number
  name: string
  description: string
  sort_order: number
}

export interface CreateResortFacilityRequest {
  resort_facility_group_id: number
  facility_id?: number
  sort_order: number
  icon_type?: IconType | null
  icon_value?: string | null
  icon_meta?: Record<string, unknown> | null
  locales?: CreateResortFacilityLocaleRequest[]
}

export interface UpdateResortFacilityRequest {
  facility_id?: number | null
  sort_order: number
  icon_type?: IconType | null
  icon_value?: string | null
  icon_meta?: Record<string, unknown> | null
}

export interface UpdateResortFacilityLocaleRequest {
  name: string
  description: string
  sort_order: number
}

export interface MutationResponse {
  success: boolean
  id: number
}

export interface SetHighlightsRequest {
  facility_ids: number[]
}

export interface ListParams {
  page?: number
  size?: number
  sort_by?: "id" | "sortOrder" | "createdAt"
  sort_dir?: "ASC" | "DESC"
  resort_facility_group_id?: number
}

function base(resortId: number) {
  return `/resorts/${resortId}/facilities`
}

export const resortFacilitiesService = {
  list(resortId: number, params: ListParams = {}): Promise<ResortFacilityListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.sort_by) q.set("sort_by", params.sort_by)
    if (params.sort_dir) q.set("sort_dir", params.sort_dir)
    if (params.resort_facility_group_id !== undefined) q.set("resortFacilityGroupId", String(params.resort_facility_group_id))
    return api.get<ResortFacilityListResponse>(`${base(resortId)}?${q}`)
  },

  get(resortId: number, id: number): Promise<{ data: ResortFacilitySummary }> {
    return api.get<{ data: ResortFacilitySummary }>(`${base(resortId)}/${id}`)
  },

  create(resortId: number, body: CreateResortFacilityRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(base(resortId), body)
  },

  update(resortId: number, id: number, body: UpdateResortFacilityRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`${base(resortId)}/${id}`, body)
  },

  remove(resortId: number, id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`${base(resortId)}/${id}`)
  },

  addLocale(resortId: number, facilityId: number, body: CreateResortFacilityLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`${base(resortId)}/${facilityId}/locales`, body)
  },

  updateLocale(resortId: number, facilityId: number, localeId: number, body: UpdateResortFacilityLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`${base(resortId)}/${facilityId}/locales/${localeId}`, body)
  },

  removeLocale(resortId: number, facilityId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`${base(resortId)}/${facilityId}/locales/${localeId}`)
  },

  setHighlights(resortId: number, body: SetHighlightsRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`${base(resortId)}/highlights`, body)
  },
}
