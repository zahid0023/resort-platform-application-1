import { api } from "./api"

export interface CurrencyLocale {
  id: number
  locale_id: number
  name: string
  short_name?: string
  sort_order: number
}

export interface Currency {
  id: number
  code: string
  numeric_code?: string
  symbol: string
  decimal_places: number
  is_default: boolean
  sort_order: number
  country_id: number
  locales: CurrencyLocale[]
}

export interface CurrencyListResponse {
  data: Currency[]
  current_page: number
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export interface MutationResponse {
  success: boolean
  id: number
}

export interface CreateCurrencyRequest {
  code: string
  numeric_code?: string
  symbol: string
  decimal_places: number
  is_default: boolean
  sort_order: number
  country_id: number
  locales?: CreateLocaleRequest[]
}

export interface UpdateCurrencyRequest {
  numeric_code?: string | null
  symbol: string
  decimal_places: number
  is_default: boolean
  sort_order: number
}

export interface CreateLocaleRequest {
  locale_id: number
  name: string
  short_name?: string
  sort_order: number
}

export interface UpdateLocaleRequest {
  name: string
  short_name?: string | null
  sort_order: number
}

export interface ListParams {
  page?: number
  size?: number
  sort_by?: "id" | "code" | "sortOrder" | "createdAt"
  sort_dir?: "ASC" | "DESC"
  code?: string
  numeric_code?: string
  symbol?: string
}

export const currenciesService = {
  list(params: ListParams = {}): Promise<CurrencyListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.sort_by) q.set("sort_by", params.sort_by)
    if (params.sort_dir) q.set("sort_dir", params.sort_dir)
    if (params.code) q.set("code", params.code)
    if (params.numeric_code) q.set("numeric_code", params.numeric_code)
    if (params.symbol) q.set("symbol", params.symbol)
    return api.get<CurrencyListResponse>(`/currencies?${q}`)
  },

  get(id: number): Promise<{ currency: Currency }> {
    return api.get<{ currency: Currency }>(`/currencies/${id}`)
  },

  create(body: CreateCurrencyRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/currencies", body)
  },

  update(id: number, body: UpdateCurrencyRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/currencies/${id}`, body)
  },

  remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/currencies/${id}`)
  },

  createLocale(currencyId: number, body: CreateLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/currencies/${currencyId}/locales`, body)
  },

  updateLocale(currencyId: number, localeId: number, body: UpdateLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/currencies/${currencyId}/locales/${localeId}`, body)
  },

  removeLocale(currencyId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/currencies/${currencyId}/locales/${localeId}`)
  },
}
