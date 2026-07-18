import { api } from "./api"

export interface PriceUnitLocale {
  id: number
  locale_id: number
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

export const priceUnitsService = {
  list(params: { page?: number; size?: number; sort_by?: string; code?: string } = {}): Promise<PriceUnitListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.sort_by) q.set("sort_by", params.sort_by)
    if (params.code) q.set("code", params.code)
    return api.get<PriceUnitListResponse>(`/price-units?${q}`)
  },
}
