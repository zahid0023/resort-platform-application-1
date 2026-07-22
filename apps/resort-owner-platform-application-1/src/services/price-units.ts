import { api } from "./api"

export interface PriceUnitEmbeddedLocale {
  id: number
  code: string
  name: string
  sort_order: number
}

export interface PriceUnitLocale {
  id: number
  locale: PriceUnitEmbeddedLocale
  name: string
  description?: string
  sort_order: number
  calculation_method?: string
  usage_example?: string
}

export interface PriceUnit {
  id: number
  code: string
  sort_order: number
  locales: PriceUnitLocale[]
}

export interface PriceUnitListResponse {
  data: PriceUnit[]
  current_page: number
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export interface PriceUnitGetResponse {
  price_unit: PriceUnit
}

export interface MutationResponse {
  success: boolean
  id: number
}

export interface CreatePriceUnitLocaleRequest {
  locale_id: number
  name: string
  description?: string
  sort_order: number
  calculation_method?: string
  usage_example?: string
}

export interface UpdatePriceUnitLocaleRequest {
  name: string
  description?: string
  sort_order: number
  calculation_method?: string
  usage_example?: string
}

export interface CreatePriceUnitRequest {
  code: string
  sort_order: number
  locales?: CreatePriceUnitLocaleRequest[]
}

export interface UpdatePriceUnitRequest {
  sort_order: number
}

export interface ListParams {
  page?: number
  size?: number
  sort_by?: "id" | "code" | "sortOrder" | "createdAt"
  sort_dir?: "ASC" | "DESC"
  code?: string
}

export const priceUnitsService = {
  list(params: ListParams = {}): Promise<PriceUnitListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.sort_by) q.set("sort_by", params.sort_by)
    if (params.sort_dir) q.set("sort_dir", params.sort_dir)
    if (params.code) q.set("code", params.code)
    return api.get<PriceUnitListResponse>(`/price-units?${q}`)
  },

  get(id: number): Promise<PriceUnitGetResponse> {
    return api.get<PriceUnitGetResponse>(`/price-units/${id}`)
  },

  create(body: CreatePriceUnitRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/price-units", body)
  },

  update(id: number, body: UpdatePriceUnitRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/price-units/${id}`, body)
  },

  remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/price-units/${id}`)
  },

  addLocale(priceUnitId: number, body: CreatePriceUnitLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/price-units/${priceUnitId}/locales`, body)
  },

  updateLocale(priceUnitId: number, localeId: number, body: UpdatePriceUnitLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/price-units/${priceUnitId}/locales/${localeId}`, body)
  },

  removeLocale(priceUnitId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/price-units/${priceUnitId}/locales/${localeId}`)
  },
}
