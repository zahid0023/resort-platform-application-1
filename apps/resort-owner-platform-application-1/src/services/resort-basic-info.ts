import { api } from "./api"



export interface ResortBasicInfoLocale {
  id: number
  locale_id: number
  sort_order: number
  name: string
  tagline: string
  short_description?: string
  address?: string
}

export interface EmbeddedLocaleEntry {
  id: number
  locale_id: number
  name: string
  sort_order: number
}

export interface EmbeddedCountry {
  id: number
  code: string
  sort_order: number
  locales: EmbeddedLocaleEntry[]
}

export interface EmbeddedCity {
  id: number
  country_id: number
  code?: string
  sort_order: number
  locales: EmbeddedLocaleEntry[]
}

export interface ResortBasicInfo {
  id: number
  code: string
  sort_order: number
  estd: number
  country: EmbeddedCountry
  city: EmbeddedCity
  logo_url?: string
  lat?: number
  lon?: number
  locales: ResortBasicInfoLocale[]
}

export interface UpdateResortBasicInfoRequest {
  sort_order: number
  estd: number
  country_id: number
  city_id: number
  logo_url?: string
  lat?: number
  lon?: number
}

export interface MutationResponse {
  success: boolean
  id: number
}

export interface AddResortLocaleRequest {
  locale_id: number
  name: string
  tagline: string
  sort_order: number
  short_description?: string
  address?: string
}

export interface UpdateResortLocaleRequest {
  name: string
  tagline: string
  sort_order: number
  short_description?: string
  address?: string
}

export const resortBasicInfoService = {
  async get(resortId: number): Promise<{ resort_basic_info: ResortBasicInfo }> {
    return api.get<{ resort_basic_info: ResortBasicInfo }>(`/resorts/${resortId}/basic-info`)
  },

  async update(resortId: number, body: UpdateResortBasicInfoRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/resorts/${resortId}/basic-info`, body)
  },

  async addLocale(resortId: number, body: AddResortLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/resorts/${resortId}/basic-info/locales`, body)
  },

  async updateLocale(
    resortId: number,
    localeId: number,
    body: UpdateResortLocaleRequest,
  ): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/resorts/${resortId}/basic-info/locales/${localeId}`, body)
  },

  async removeLocale(resortId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/resorts/${resortId}/basic-info/locales/${localeId}`)
  },

  async uploadLogo(resortId: number, configId: number, file: File): Promise<MutationResponse> {
    const formData = new FormData()
    formData.append("config_id", String(configId))
    formData.append("file", file)
    return api.postForm<MutationResponse>(`/resorts/${resortId}/basic-info/logo`, formData)
  },
}
