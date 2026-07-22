import { api } from "./api"

export interface UnitTypeEmbeddedLocale {
  id: number
  code: string
  name: string
  sort_order: number
}

export interface UnitTypeLocale {
  id: number
  locale: UnitTypeEmbeddedLocale
  name: string
  description?: string
  sort_order: number
}

export interface UnitType {
  id: number
  code: string
  sort_order: number
  locales: UnitTypeLocale[]
}

export interface UnitTypeListResponse {
  data: UnitType[]
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

export interface CreateUnitTypeLocaleRequest {
  locale_id: number
  name: string
  description?: string
  sort_order: number
}

export interface UpdateUnitTypeLocaleRequest {
  name: string
  description?: string
  sort_order: number
}

export interface CreateUnitTypeRequest {
  code: string
  sort_order: number
  locales?: CreateUnitTypeLocaleRequest[]
}

export interface UpdateUnitTypeRequest {
  sort_order: number
}

export interface ListParams {
  page?: number
  size?: number
  sort_by?: "id" | "code" | "sortOrder" | "createdAt"
  sort_dir?: "ASC" | "DESC"
  code?: string
}

export const unitTypesService = {
  list(params: ListParams = {}): Promise<UnitTypeListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.sort_by) q.set("sort_by", params.sort_by)
    if (params.sort_dir) q.set("sort_dir", params.sort_dir)
    if (params.code) q.set("code", params.code)
    return api.get<UnitTypeListResponse>(`/unit-types?${q}`)
  },

  get(id: number): Promise<{ unit_type: UnitType }> {
    return api.get<{ unit_type: UnitType }>(`/unit-types/${id}`)
  },

  create(body: CreateUnitTypeRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/unit-types", body)
  },

  update(id: number, body: UpdateUnitTypeRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/unit-types/${id}`, body)
  },

  remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/unit-types/${id}`)
  },

  addLocale(unitTypeId: number, body: CreateUnitTypeLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/unit-types/${unitTypeId}/locales`, body)
  },

  updateLocale(unitTypeId: number, localeId: number, body: UpdateUnitTypeLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/unit-types/${unitTypeId}/locales/${localeId}`, body)
  },

  removeLocale(unitTypeId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/unit-types/${unitTypeId}/locales/${localeId}`)
  },
}
