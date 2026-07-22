import { api } from "./api"

export interface BedTypeEmbeddedLocale {
  id: number
  code: string
  name: string
  sort_order: number
}

export interface BedTypeLocale {
  id: number
  locale: BedTypeEmbeddedLocale
  name: string
  description?: string
  sort_order: number
}

export interface BedType {
  id: number
  code: string
  sort_order: number
  locales: BedTypeLocale[]
}

export interface BedTypeListResponse {
  data: BedType[]
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

export interface CreateBedTypeLocaleRequest {
  locale_id: number
  name: string
  description?: string
  sort_order: number
}

export interface UpdateBedTypeLocaleRequest {
  name: string
  description?: string
  sort_order: number
}

export interface CreateBedTypeRequest {
  code: string
  sort_order: number
  locales?: CreateBedTypeLocaleRequest[]
}

export interface UpdateBedTypeRequest {
  sort_order: number
}

export interface ListParams {
  page?: number
  size?: number
  sort_by?: "id" | "code" | "sortOrder" | "createdAt"
  sort_dir?: "ASC" | "DESC"
  code?: string
}

export const bedTypesService = {
  list(params: ListParams = {}): Promise<BedTypeListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.sort_by) q.set("sort_by", params.sort_by)
    if (params.sort_dir) q.set("sort_dir", params.sort_dir)
    if (params.code) q.set("code", params.code)
    return api.get<BedTypeListResponse>(`/bed-types?${q}`)
  },

  get(id: number): Promise<{ bed_type: BedType }> {
    return api.get<{ bed_type: BedType }>(`/bed-types/${id}`)
  },

  create(body: CreateBedTypeRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/bed-types", body)
  },

  update(id: number, body: UpdateBedTypeRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/bed-types/${id}`, body)
  },

  remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/bed-types/${id}`)
  },

  addLocale(bedTypeId: number, body: CreateBedTypeLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/bed-types/${bedTypeId}/locales`, body)
  },

  updateLocale(bedTypeId: number, localeId: number, body: UpdateBedTypeLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/bed-types/${bedTypeId}/locales/${localeId}`, body)
  },

  removeLocale(bedTypeId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/bed-types/${bedTypeId}/locales/${localeId}`)
  },
}
