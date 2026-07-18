import { api } from "./api"

export interface ResortRoomCategoryPrice {
  id: number
  resort_room_category_id: number
  price_type_id: number
  price_unit_id: number
  amount: number
  priority: number
  valid_from?: string
  valid_to?: string
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
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

export interface PriceRequest {
  price_type_id: number
  price_unit_id: number
  amount: number
  priority: number
  valid_from?: string | null
  valid_to?: string | null
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
}

export interface ListParams {
  page?: number
  size?: number
  sort_by?: "id" | "amount" | "priority" | "validFrom" | "validTo" | "createdAt"
  sort_dir?: "ASC" | "DESC"
  priceTypeId?: number
  priceUnitId?: number
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
    if (params.sort_by) q.set("sort_by", params.sort_by)
    if (params.sort_dir) q.set("sort_dir", params.sort_dir)
    if (params.priceTypeId !== undefined) q.set("priceTypeId", String(params.priceTypeId))
    if (params.priceUnitId !== undefined) q.set("priceUnitId", String(params.priceUnitId))
    if (params.validFrom) q.set("validFrom", params.validFrom)
    if (params.validTo) q.set("validTo", params.validTo)
    return api.get<ResortRoomCategoryPriceListResponse>(`${base(resortId, rcId)}?${q}`)
  },

  create(resortId: number, rcId: number, body: PriceRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(base(resortId, rcId), body)
  },

  update(resortId: number, rcId: number, id: number, body: PriceRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`${base(resortId, rcId)}/${id}`, body)
  },

  remove(resortId: number, rcId: number, id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`${base(resortId, rcId)}/${id}`)
  },
}
