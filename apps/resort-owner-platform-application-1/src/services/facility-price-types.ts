import { api } from "./api"

export interface FacilityPriceTypeLocale {
  id: number
  locale_id: number
  name: string
  description?: string
  sort_order: number
  purpose?: string
  usage_example?: string
}

export interface FacilityPriceType {
  id: number
  code: string
  sort_order: number
  locales: FacilityPriceTypeLocale[]
}

export interface FacilityPriceTypeListResponse {
  data: FacilityPriceType[]
  current_page: number
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export interface ListParams {
  page?: number
  size?: number
  sort_by?: "id" | "code" | "sortOrder" | "createdAt"
  sort_dir?: "ASC" | "DESC"
  code?: string
}

export const facilityPriceTypesService = {
  list(params: ListParams = {}): Promise<FacilityPriceTypeListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.sort_by) q.set("sort_by", params.sort_by)
    if (params.sort_dir) q.set("sort_dir", params.sort_dir)
    if (params.code) q.set("code", params.code)
    return api.get<FacilityPriceTypeListResponse>(`/facility-price-types?${q}`)
  },
}
