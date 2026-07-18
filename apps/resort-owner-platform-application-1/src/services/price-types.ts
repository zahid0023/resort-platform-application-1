import { api } from "./api"

export interface PriceTypeEmbeddedLocale {
  id: number
  code: string
  name: string
  sort_order: number
}

export interface PriceTypeLocale {
  id: number
  locale: PriceTypeEmbeddedLocale
  name: string
  description?: string
  sort_order: number
  purpose?: string
  usage_example?: string
}

export interface PriceType {
  id: number
  code: string
  sort_order: number
  locales: PriceTypeLocale[]
}

export interface PriceTypeListResponse {
  data: PriceType[]
  current_page: number
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export interface PriceTypeGetResponse {
  price_type: PriceType
}

export interface MutationResponse {
  success: boolean
  id: number
}

export interface CreatePriceTypeLocaleRequest {
  locale_id: number
  name: string
  description?: string
  sort_order: number
  purpose?: string
  usage_example?: string
}

export interface UpdatePriceTypeLocaleRequest {
  name: string
  description?: string
  sort_order: number
  purpose?: string
  usage_example?: string
}

export interface CreatePriceTypeRequest {
  code: string
  sort_order: number
  locales?: CreatePriceTypeLocaleRequest[]
}

export interface UpdatePriceTypeRequest {
  sort_order: number
}

export interface ListParams {
  page?: number
  size?: number
  sort_by?: "id" | "code" | "sortOrder" | "createdAt"
  sort_dir?: "ASC" | "DESC"
  code?: string
}

export const priceTypesService = {
  list(params: ListParams = {}): Promise<PriceTypeListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.sort_by) q.set("sort_by", params.sort_by)
    if (params.sort_dir) q.set("sort_dir", params.sort_dir)
    if (params.code) q.set("code", params.code)
    return api.get<PriceTypeListResponse>(`/price-types?${q}`)
  },

  get(id: number): Promise<PriceTypeGetResponse> {
    return api.get<PriceTypeGetResponse>(`/price-types/${id}`)
  },

  create(body: CreatePriceTypeRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/price-types", body)
  },

  update(id: number, body: UpdatePriceTypeRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/price-types/${id}`, body)
  },

  remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/price-types/${id}`)
  },

  addLocale(priceTypeId: number, body: CreatePriceTypeLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/price-types/${priceTypeId}/locales`, body)
  },

  updateLocale(priceTypeId: number, localeId: number, body: UpdatePriceTypeLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/price-types/${priceTypeId}/locales/${localeId}`, body)
  },

  removeLocale(priceTypeId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/price-types/${priceTypeId}/locales/${localeId}`)
  },
}
