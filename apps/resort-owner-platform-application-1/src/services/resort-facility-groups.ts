import { api } from "./api"
import type { Locale } from "./locales"

export type IconType = "LUCIDE" | "IMAGE" | "SVG" | "EXTERNAL"

export interface ResortFacilityGroupLocale {
  id: number
  locale: Locale
  name: string
  description?: string
  sort_order: number
}

export interface ResortFacilityGroupSummary {
  id: number
  /** The linked platform facility group's id — set at creation, immutable, read-only afterward.
   * `null`/absent for a fully custom group. */
  facility_group_id?: number | null
  code: string
  sort_order: number
  icon_type?: IconType
  icon_value?: string
  icon_meta?: Record<string, unknown>
  /** The single translation matching Accept-Language (falls back to en, then null). */
  locale: ResortFacilityGroupLocale | null
}

export interface ResortFacilityGroupListResponse {
  data: ResortFacilityGroupSummary[]
  current_page: number
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
  sortable_fields?: string[]
  searchable_fields?: string[]
}

export interface ResortFacilityGroupLocaleListResponse {
  data: ResortFacilityGroupLocale[]
  current_page: number
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export interface CreateResortFacilityGroupLocaleInput {
  name: string
  description?: string
  sort_order: number
}

export interface CreateResortFacilityGroupRequest {
  facility_group_id?: number | null
  code: string
  sort_order: number
  icon_type?: IconType | null
  icon_value?: string | null
  icon_meta?: Record<string, unknown> | null
  /** Always resolved to the `en` locale server-side — no `locale_id` field. */
  locale: CreateResortFacilityGroupLocaleInput
}

export interface UpdateResortFacilityGroupRequest {
  sort_order: number
  icon_type?: IconType | null
  icon_value?: string | null
  icon_meta?: Record<string, unknown> | null
}

export interface CreateResortFacilityGroupLocaleRequest {
  locale_id: number
  name: string
  description?: string
  sort_order: number
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

// Query params bind onto ResortFacilityGroupFilterRequest's Java field names via Spring's
// DataBinder — camelCase, not the snake_case used in JSON request/response bodies.
// `id` is not a selectable sortBy value — it's the implicit default only.
export interface ListParams {
  page?: number
  size?: number
  sort_by?: "createdAt" | "facilityGroupEntity.id" | "code" | "name"
  sort_dir?: "ASC" | "DESC"
  facilityGroupId?: number
  code?: string
  name?: string
}

export interface ListLocalesParams {
  page?: number
  size?: number
  localeCode?: string
}

export const resortFacilityGroupsService = {
  list(resortId: number, params: ListParams = {}): Promise<ResortFacilityGroupListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.sort_by) q.set("sortBy", params.sort_by)
    if (params.sort_dir) q.set("sortDir", params.sort_dir)
    if (params.facilityGroupId !== undefined) q.set("facilityGroupId", String(params.facilityGroupId))
    if (params.code) q.set("code", params.code)
    if (params.name) q.set("name", params.name)
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

  listLocales(resortId: number, groupId: number, params: ListLocalesParams = {}): Promise<ResortFacilityGroupLocaleListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.localeCode) q.set("localeCode", params.localeCode)
    return api.get<ResortFacilityGroupLocaleListResponse>(`/resorts/${resortId}/facility-groups/${groupId}/locales?${q}`)
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
