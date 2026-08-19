import { api } from "./api"
import type { Locale } from "./locales"

// No standalone GET — basic info is only ever read embedded in `GET /resorts/{id}`
// (see `services/resorts.ts`'s `getResort`).

export interface ResortBasicInfoLocale {
  id: number
  locale: Locale
  sort_order: number
  name: string
  tagline: string
  short_description?: string
}

export interface UpdateResortBasicInfoRequest {
  estd: number
  logo_url?: string
}

export interface MutationResponse {
  success: boolean
  id: number
}

export interface BasicInfoLocaleListResponse {
  data: ResortBasicInfoLocale[]
  current_page: number
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export interface AddResortBasicInfoLocaleRequest {
  locale_id: number
  sort_order: number
  name: string
  tagline: string
  short_description?: string
}

export interface UpdateResortBasicInfoLocaleRequest {
  sort_order: number
  name: string
  tagline: string
  short_description?: string
}

export interface ListBasicInfoLocalesParams {
  localeCode?: string
  page?: number
  size?: number
}

function buildLocaleQuery(params: ListBasicInfoLocalesParams): URLSearchParams {
  const { page = 0, size = 50, localeCode } = params
  const q = new URLSearchParams({ page: String(page), size: String(size) })
  if (localeCode) q.set("localeCode", localeCode)
  return q
}

export const resortBasicInfoService = {
  async update(resortId: number, body: UpdateResortBasicInfoRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/resorts/${resortId}/basic-info`, body)
  },

  async listLocales(
    resortId: number,
    params: ListBasicInfoLocalesParams = {},
  ): Promise<BasicInfoLocaleListResponse> {
    return api.get<BasicInfoLocaleListResponse>(
      `/resorts/${resortId}/basic-info/locales?${buildLocaleQuery(params)}`,
    )
  },

  async addLocale(resortId: number, body: AddResortBasicInfoLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/resorts/${resortId}/basic-info/locales`, body)
  },

  async updateLocale(
    resortId: number,
    id: number,
    body: UpdateResortBasicInfoLocaleRequest,
  ): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/resorts/${resortId}/basic-info/locales/${id}`, body)
  },

  async removeLocale(resortId: number, id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/resorts/${resortId}/basic-info/locales/${id}`)
  },
}
