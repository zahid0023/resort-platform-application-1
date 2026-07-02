import { api } from "./api";

export interface CityLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface City {
  id: number;
  code?: string;
  sort_order: number;
  locales: CityLocale[];
}

export interface CityListResponse {
  data: City[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateCityLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateCityRequest {
  country_id: number;
  code?: string;
  sort_order: number;
  locales?: CreateCityLocaleRequest[];
}

export interface UpdateCityRequest {
  sort_order: number;
}

export interface UpdateCityLocaleRequest {
  name: string;
  description?: string;
  sort_order: number;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

export interface ListCitiesParams {
  page?: number;
  size?: number;
  sort_by?: string;
  sort_dir?: "ASC" | "DESC";
  code?: string;
}

export interface ListCitiesFlatParams {
  page?: number;
  size?: number;
  sort_by?: string;
  sort_dir?: "ASC" | "DESC";
  code?: string;
  countryId?: number;
}

export const citiesService = {
  // Flat list across all countries (used on /cities page)
  async listFlat(params: ListCitiesFlatParams = {}): Promise<CityListResponse> {
    const { page = 0, size = 20, sort_by = "sortOrder", sort_dir = "ASC", code, countryId } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    if (code) query.set("code", code);
    if (countryId) query.set("countryId", String(countryId));
    return api.get<CityListResponse>(`/cities?${query}`);
  },

  // List cities scoped to a country (used on country detail page)
  async list(countryId: number, params: ListCitiesParams = {}): Promise<CityListResponse> {
    const { page = 0, size = 20, sort_by = "sortOrder", sort_dir = "ASC", code } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort_by,
      sort_dir,
    });
    if (code) query.set("code", code);
    return api.get<CityListResponse>(`/countries/${countryId}/cities?${query}`);
  },

  async get(id: number): Promise<{ city: City }> {
    return api.get<{ city: City }>(`/cities/${id}`);
  },

  async create(body: CreateCityRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/cities", body);
  },

  async update(id: number, body: UpdateCityRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/cities/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/cities/${id}`);
  },

  async addLocale(cityId: number, body: CreateCityLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/cities/${cityId}/locales`, body);
  },

  async updateLocale(cityId: number, localeId: number, body: UpdateCityLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/cities/${cityId}/locales/${localeId}`, body);
  },

  async removeLocale(cityId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/cities/${cityId}/locales/${localeId}`);
  },
};
