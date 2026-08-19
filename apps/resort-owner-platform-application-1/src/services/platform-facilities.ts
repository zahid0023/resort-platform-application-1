import { api } from "./api"
import type { Locale } from "./locales"

export interface PlatformFacilityLocale {
  id: number
  locale: Locale
  name: string
  description?: string
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
  /** The single translation matching Accept-Language (falls back to en, then null). */
  locale: PlatformFacilityLocale | null
}

export interface PlatformFacilityListResponse {
  data: PlatformFacilitySummary[]
  has_next: boolean
  has_previous: boolean
  total_pages: number
  total_elements: number
}

export const platformFacilitiesService = {
  // Query params bind onto FacilityFilterRequest's Java field names via Spring's DataBinder —
  // camelCase, not the kebab/snake-case previously used here (which the server silently ignored).
  list(params: { page?: number; size?: number; sort_by?: string; facilityScopeCodes?: ("RESORT" | "ROOM_CATEGORY" | "ROOM")[]; facilityGroupId?: number } = {}): Promise<PlatformFacilityListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.sort_by) q.set("sortBy", params.sort_by)
    if (params.facilityGroupId !== undefined) q.set("facilityGroupId", String(params.facilityGroupId))
    params.facilityScopeCodes?.forEach((code) => q.append("facilityScopeCodes", code))
    return api.get<PlatformFacilityListResponse>(`/facilities?${q}`)
  },
}
