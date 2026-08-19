import { api } from "./api"
import type { Locale } from "./locales"
import type { FacilityScope } from "./facility-scopes"

export interface PlatformFacilityGroupLocale {
  id: number
  locale: Locale
  name: string
  description?: string
  sort_order: number
}

export interface PlatformFacilityGroupSummary {
  id: number
  code: string
  sort_order: number
  icon_type: string
  icon_value?: string
  icon_meta?: Record<string, unknown>
  /** The single translation matching Accept-Language (falls back to en, then null). */
  locale: PlatformFacilityGroupLocale | null
  facility_scopes: FacilityScope[]
}

export interface PlatformFacilityGroupListResponse {
  data: PlatformFacilityGroupSummary[]
  current_page: number
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
  sortable_fields?: string[]
  searchable_fields?: string[]
}

// Query params bind onto FacilityGroupFilterRequest's Java field names via Spring's DataBinder —
// camelCase, not the snake_case used in JSON request/response bodies. `id` is not a selectable
// sortBy value — it's the implicit default only.
export interface ListPlatformFacilityGroupsParams {
  page?: number
  size?: number
  code?: string
  name?: string
  /** Union/OR match — a group needs only one of these scopes to be included. */
  facilityScopeIds?: number[]
  sort_by?: "createdAt" | "code" | "name"
  sort_dir?: "ASC" | "DESC"
}

export const platformFacilityGroupsService = {
  list(params: ListPlatformFacilityGroupsParams = {}): Promise<PlatformFacilityGroupListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.code) q.set("code", params.code)
    if (params.name) q.set("name", params.name)
    if (params.facilityScopeIds?.length) q.set("facilityScopeIds", params.facilityScopeIds.join(","))
    if (params.sort_by) q.set("sortBy", params.sort_by)
    if (params.sort_dir) q.set("sortDir", params.sort_dir)
    return api.get<PlatformFacilityGroupListResponse>(`/facility-groups?${q}`)
  },
}
