import { api } from "./api"
import type { PriceType } from "./price-types"
import type { PriceUnit } from "./price-units"
import type { Currency } from "./currencies"

export type PriceTypeCode = "BAS" | "WKD" | "WKE" | "HOL" | "SPE"

export interface ResortRoomCategoryPrice {
  id: number
  price_type: PriceType
  price_unit: PriceUnit
  currency: Currency
  name: string
  description?: string
  price: number
  day_of_week_ids?: number[]
  valid_from?: string
  valid_to?: string
  priority: number
  discount_amount?: number
  discount_percentage?: number
}

export interface ResortRoomCategoryPriceListResponse {
  data: ResortRoomCategoryPrice[]
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

export interface CreatePriceRequest {
  price_type_id: number
  currency_id: number
  price_unit_id: number
  name: string
  description?: string | null
  price: number
  day_of_week_ids?: number[]
  valid_from?: string | null
  valid_to?: string | null
  priority?: number
}

export interface UpdatePriceRequest {
  price_unit_id: number
  name: string
  description?: string | null
  price: number
  day_of_week_ids?: number[]
  valid_from?: string | null
  valid_to?: string | null
  priority?: number
}

export interface ListParams {
  page?: number
  size?: number
  sort_by?: "id" | "price" | "priority" | "validFrom" | "validTo" | "createdAt"
  sort_dir?: "ASC" | "DESC"
  priceTypeId?: number
  priceUnitId?: number
  currencyId?: number
  validFrom?: string
  validTo?: string
}

function base(resortId: number, rcId: number) {
  return `/resorts/${resortId}/room-categories/${rcId}/prices`
}

export const resortRoomCategoryPricesService = {
  list(resortId: number, rcId: number, params: ListParams = {}): Promise<ResortRoomCategoryPriceListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.sort_by) q.set("sortBy", params.sort_by)
    if (params.sort_dir) q.set("sortDir", params.sort_dir)
    if (params.priceTypeId !== undefined) q.set("priceTypeId", String(params.priceTypeId))
    if (params.priceUnitId !== undefined) q.set("priceUnitId", String(params.priceUnitId))
    if (params.currencyId !== undefined) q.set("currencyId", String(params.currencyId))
    if (params.validFrom) q.set("validFrom", params.validFrom)
    if (params.validTo) q.set("validTo", params.validTo)
    return api.get<ResortRoomCategoryPriceListResponse>(`${base(resortId, rcId)}?${q}`)
  },

  get(resortId: number, rcId: number, id: number): Promise<{ data: ResortRoomCategoryPrice }> {
    return api.get<{ data: ResortRoomCategoryPrice }>(`${base(resortId, rcId)}/${id}`)
  },

  create(resortId: number, rcId: number, body: CreatePriceRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(base(resortId, rcId), body)
  },

  update(resortId: number, rcId: number, id: number, body: UpdatePriceRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`${base(resortId, rcId)}/${id}`, body)
  },

  remove(resortId: number, rcId: number, id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`${base(resortId, rcId)}/${id}`)
  },
}
