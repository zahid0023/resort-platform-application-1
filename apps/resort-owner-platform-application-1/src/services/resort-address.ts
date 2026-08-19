import { api } from "./api"
import type { Locale } from "./locales"
import type { Country } from "./countries"
import type { City } from "./cities"

export interface ResortAddressLocale {
  id: number
  locale: Locale
  address: string
  sort_order: number
}

export interface ResortAddress {
  id: number
  country: Country
  city: City
  postal_code?: string
  lat?: number
  lon?: number
  /** The single translation matching Accept-Language (falls back to en, then null). */
  locale: ResortAddressLocale | null
}

export interface UpdateResortAddressRequest {
  country_id: number
  city_id: number
  postal_code?: string
  lat?: number
  lon?: number
}

export interface MutationResponse {
  success: boolean
  id: number
}

export interface AddressLocaleListResponse {
  data: ResortAddressLocale[]
  current_page: number
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export interface AddResortAddressLocaleRequest {
  locale_id: number
  address: string
  sort_order: number
}

export interface UpdateResortAddressLocaleRequest {
  address: string
  sort_order: number
}

export interface ListAddressLocalesParams {
  localeCode?: string
  page?: number
  size?: number
}

function buildLocaleQuery(params: ListAddressLocalesParams): URLSearchParams {
  const { page = 0, size = 50, localeCode } = params
  const q = new URLSearchParams({ page: String(page), size: String(size) })
  if (localeCode) q.set("localeCode", localeCode)
  return q
}

export const resortAddressService = {
  async get(resortId: number): Promise<{ data: ResortAddress }> {
    return api.get<{ data: ResortAddress }>(`/resorts/${resortId}/address`)
  },

  async update(resortId: number, body: UpdateResortAddressRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/resorts/${resortId}/address`, body)
  },

  async listLocales(
    resortId: number,
    params: ListAddressLocalesParams = {},
  ): Promise<AddressLocaleListResponse> {
    return api.get<AddressLocaleListResponse>(
      `/resorts/${resortId}/address/locales?${buildLocaleQuery(params)}`,
    )
  },

  async addLocale(resortId: number, body: AddResortAddressLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/resorts/${resortId}/address/locales`, body)
  },

  async updateLocale(
    resortId: number,
    id: number,
    body: UpdateResortAddressLocaleRequest,
  ): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/resorts/${resortId}/address/locales/${id}`, body)
  },

  async removeLocale(resortId: number, id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/resorts/${resortId}/address/locales/${id}`)
  },
}
