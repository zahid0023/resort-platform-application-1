import { api } from "./api"

export interface UnitEmbeddedLocale {
  id: number
  code: string
  name: string
  sort_order: number
}

export interface UnitLocale {
  id: number
  locale: UnitEmbeddedLocale
  name: string
  plural_name: string
  description?: string
  sort_order: number
}

export interface Unit {
  id: number
  unit_type_id: number
  code: string
  symbol: string
  is_base_unit: boolean
  conversion_factor: number
  sort_order: number
  locales: UnitLocale[]
}

export interface UnitListResponse {
  data: Unit[]
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

export interface CreateUnitLocaleRequest {
  locale_id: number
  name: string
  plural_name: string
  description?: string
  sort_order: number
}

export interface UpdateUnitLocaleRequest {
  name: string
  plural_name: string
  description?: string
  sort_order: number
}

export interface CreateUnitRequest {
  unit_type_id: number
  code: string
  symbol: string
  is_base_unit: boolean
  conversion_factor: number
  sort_order: number
  locales?: CreateUnitLocaleRequest[]
}

export interface UpdateUnitRequest {
  sort_order: number
}

export interface ListParams {
  page?: number
  size?: number
  sort_by?: "id" | "code" | "symbol" | "sortOrder" | "createdAt"
  sort_dir?: "ASC" | "DESC"
  code?: string
  symbol?: string
  unitTypeId?: number
  isBaseUnit?: boolean
}

export const unitsService = {
  list(params: ListParams = {}): Promise<UnitListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.sort_by) q.set("sort_by", params.sort_by)
    if (params.sort_dir) q.set("sort_dir", params.sort_dir)
    if (params.code) q.set("code", params.code)
    if (params.symbol) q.set("symbol", params.symbol)
    if (params.unitTypeId !== undefined) q.set("unit-type-id", String(params.unitTypeId))
    if (params.isBaseUnit !== undefined) q.set("is_base_unit", String(params.isBaseUnit))
    return api.get<UnitListResponse>(`/units?${q}`)
  },

  get(id: number): Promise<{ unit: Unit }> {
    return api.get<{ unit: Unit }>(`/units/${id}`)
  },

  create(body: CreateUnitRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/units", body)
  },

  update(id: number, body: UpdateUnitRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/units/${id}`, body)
  },

  remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/units/${id}`)
  },

  addLocale(unitId: number, body: CreateUnitLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/units/${unitId}/locales`, body)
  },

  updateLocale(unitId: number, localeId: number, body: UpdateUnitLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/units/${unitId}/locales/${localeId}`, body)
  },

  removeLocale(unitId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/units/${unitId}/locales/${localeId}`)
  },
}
