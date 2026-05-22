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
  country_id: number;
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
}

export const citiesService = {
  async list(countryId: number, params: ListCitiesParams = {}): Promise<CityListResponse> {
    const { page = 0, size = 50, sort_by = "sortOrder", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort_by,
      sort_dir,
    });
    return api.get<CityListResponse>(`/countries/${countryId}/cities?${query}`);
  },

  async get(countryId: number, id: number): Promise<{ city: City }> {
    return api.get<{ city: City }>(`/countries/${countryId}/cities/${id}`);
  },

  async create(countryId: number, body: CreateCityRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/countries/${countryId}/cities`, body);
  },

  async update(countryId: number, id: number, body: UpdateCityRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/countries/${countryId}/cities/${id}`, body);
  },

  async remove(countryId: number, id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/countries/${countryId}/cities/${id}`);
  },

  async addLocale(countryId: number, cityId: number, body: CreateCityLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/countries/${countryId}/cities/${cityId}/locales`, body);
  },

  async updateLocale(countryId: number, cityId: number, localeId: number, body: UpdateCityLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/countries/${countryId}/cities/${cityId}/locales/${localeId}`, body);
  },

  async removeLocale(countryId: number, cityId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/countries/${countryId}/cities/${cityId}/locales/${localeId}`);
  },
};
