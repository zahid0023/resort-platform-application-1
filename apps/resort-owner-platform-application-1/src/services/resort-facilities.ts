import { api } from "./api"
import type { Locale } from "./locales"
import type { DayOfWeek } from "./days-of-week"

export type IconType = "LUCIDE" | "IMAGE" | "SVG" | "EXTERNAL"

export interface ResortFacilityLocale {
  id: number
  locale: Locale
  name: string
  description?: string
  sort_order: number
}

export interface ResortFacilitySummary {
  id: number
  code: string
  sort_order: number
  is_highlighted: boolean
  icon_type?: IconType
  icon_value?: string
  icon_meta?: Record<string, unknown>
  /** The single translation matching Accept-Language (falls back to en, then null). */
  locale: ResortFacilityLocale | null
}

export interface ResortFacilityListResponse {
  data: ResortFacilitySummary[]
  current_page: number
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
  sortable_fields?: string[]
  searchable_fields?: string[]
}

export interface ResortFacilityLocaleListResponse {
  data: ResortFacilityLocale[]
  current_page: number
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export interface CreateResortFacilityLocaleInput {
  name: string
  description?: string
  sort_order: number
}

export interface ResortFacilityOperatingHours {
  id: number
  day_of_week: DayOfWeek
  opens_at: string | null
  closes_at: string | null
  is_closed: boolean
  is_twenty_four_hours: boolean
}

export interface ResortFacilityOperatingHoursListResponse {
  data: ResortFacilityOperatingHours[]
  current_page: number
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export interface CreateOperatingHoursRequest {
  day_of_week_id: number
  opens_at?: string | null
  closes_at?: string | null
  is_closed: boolean
  is_twenty_four_hours: boolean
}

export interface UpdateOperatingHoursRequest {
  day_of_week_id: number
  opens_at?: string | null
  closes_at?: string | null
  is_closed: boolean
  is_twenty_four_hours: boolean
}

export interface ListOperatingHoursParams {
  page?: number
  size?: number
}

export interface CreateResortFacilityRequest {
  resort_facility_group_id: number
  facility_id?: number | null
  code: string
  sort_order: number
  is_highlighted: boolean
  icon_type?: IconType | null
  icon_value?: string | null
  icon_meta?: Record<string, unknown> | null
  /** Always resolved to the `en` locale server-side — no `locale_id` field. */
  locale: CreateResortFacilityLocaleInput
}

export interface UpdateResortFacilityRequest {
  sort_order: number
  icon_type?: IconType | null
  icon_value?: string | null
  icon_meta?: Record<string, unknown> | null
}

export interface CreateResortFacilityLocaleRequest {
  locale_id: number
  name: string
  description?: string
  sort_order: number
}

export interface UpdateResortFacilityLocaleRequest {
  name: string
  description?: string
  sort_order: number
}

export interface MutationResponse {
  success: boolean
  id: number
}

// Query params bind onto ResortFacilityFilterRequest's Java field names via Spring's
// DataBinder — camelCase, not the snake_case used in JSON request/response bodies.
// `id` is not a selectable sortBy value — it's the implicit default only.
export interface ListParams {
  page?: number
  size?: number
  sort_by?: "createdAt" | "resortFacilityGroupEntity.id" | "facilityEntity.id" | "code" | "name"
  sort_dir?: "ASC" | "DESC"
  resort_facility_group_id?: number
  facilityId?: number
  code?: string
  name?: string
}

export interface ListLocalesParams {
  page?: number
  size?: number
  localeCode?: string
}

function base(resortId: number) {
  return `/resorts/${resortId}/facilities`
}

export const resortFacilitiesService = {
  list(resortId: number, params: ListParams = {}): Promise<ResortFacilityListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.sort_by) q.set("sortBy", params.sort_by)
    if (params.sort_dir) q.set("sortDir", params.sort_dir)
    if (params.resort_facility_group_id !== undefined) q.set("resortFacilityGroupId", String(params.resort_facility_group_id))
    if (params.facilityId !== undefined) q.set("facilityId", String(params.facilityId))
    if (params.code) q.set("code", params.code)
    if (params.name) q.set("name", params.name)
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

  listLocales(resortId: number, facilityId: number, params: ListLocalesParams = {}): Promise<ResortFacilityLocaleListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.localeCode) q.set("localeCode", params.localeCode)
    return api.get<ResortFacilityLocaleListResponse>(`${base(resortId)}/${facilityId}/locales?${q}`)
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

  listOperatingHours(resortId: number, facilityId: number, params: ListOperatingHoursParams = {}): Promise<ResortFacilityOperatingHoursListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    return api.get<ResortFacilityOperatingHoursListResponse>(`${base(resortId)}/${facilityId}/operating-hours?${q}`)
  },

  createOperatingHours(resortId: number, facilityId: number, body: CreateOperatingHoursRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`${base(resortId)}/${facilityId}/operating-hours`, body)
  },

  updateOperatingHours(resortId: number, facilityId: number, id: number, body: UpdateOperatingHoursRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`${base(resortId)}/${facilityId}/operating-hours/${id}`, body)
  },

  removeOperatingHours(resortId: number, facilityId: number, id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`${base(resortId)}/${facilityId}/operating-hours/${id}`)
  },
}
