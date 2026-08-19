import { api } from "./api"
import type { Locale } from "./locales"

export interface FacilityScopeLocale {
  id: number
  locale: Locale
  name: string
  description?: string
  sort_order: number
}

export interface FacilityScope {
  id: number
  code: string
  sort_order: number
  /** The single translation matching Accept-Language (falls back to en, then null). */
  locale: FacilityScopeLocale | null
}

export interface FacilityScopeListResponse {
  data: FacilityScope[]
  current_page: number
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
  sortable_fields?: string[]
  searchable_fields?: string[]
}

// Query params bind onto FacilityScopeFilterRequest's Java field names via Spring's DataBinder —
// camelCase, not the snake_case used in JSON request/response bodies.
export interface ListFacilityScopesParams {
  page?: number
  size?: number
  code?: string
  name?: string
  sort_by?: "createdAt" | "code" | "sortOrder"
  sort_dir?: "ASC" | "DESC"
}

export const facilityScopesService = {
  list(params: ListFacilityScopesParams = {}): Promise<FacilityScopeListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.code) q.set("code", params.code)
    if (params.name) q.set("name", params.name)
    if (params.sort_by) q.set("sortBy", params.sort_by)
    if (params.sort_dir) q.set("sortDir", params.sort_dir)
    return api.get<FacilityScopeListResponse>(`/facility-scopes?${q}`)
  },
}

let resortScopeIdPromise: Promise<number | null> | null = null

/** Resolves the numeric id of the "RESORT" facility scope, memoized for the session — facility
 * scopes are static reference data (RESORT/ROOM_CATEGORY/ROOM), not worth refetching per dialog-open. */
export function getResortFacilityScopeId(): Promise<number | null> {
  if (!resortScopeIdPromise) {
    resortScopeIdPromise = facilityScopesService
      .list({ code: "RESORT", size: 10 })
      .then((res) => res.data.find((s) => s.code === "RESORT")?.id ?? null)
  }
  return resortScopeIdPromise
}
