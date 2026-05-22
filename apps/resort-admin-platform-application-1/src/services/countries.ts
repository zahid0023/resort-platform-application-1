import { api } from "./api";

export interface CountryLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface Country {
  id: number;
  code: string;
  iso3_code?: string;
  phone_code?: string;
  sort_order: number;
  locales: CountryLocale[];
}

export interface CountryListResponse {
  data: Country[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateCountryLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateCountryRequest {
  code: string;
  iso3_code?: string;
  phone_code?: string;
  sort_order: number;
  locales?: CreateCountryLocaleRequest[];
}

export interface UpdateCountryRequest {
  iso3_code?: string;
  phone_code?: string;
  sort_order: number;
}

export interface UpdateCountryLocaleRequest {
  name: string;
  description?: string;
  sort_order: number;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

export interface ListParams {
  page?: number;
  size?: number;
  sort_by?: string;
  sort_dir?: "ASC" | "DESC";
}

export const countriesService = {
  async list(params: ListParams = {}): Promise<CountryListResponse> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort_by,
      sort_dir,
    });
    return api.get<CountryListResponse>(`/countries?${query}`);
  },

  async get(id: number): Promise<{ country: Country }> {
    return api.get<{ country: Country }>(`/countries/${id}`);
  },

  async create(body: CreateCountryRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/countries", body);
  },

  async update(id: number, body: UpdateCountryRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/countries/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/countries/${id}`);
  },

  async addLocale(countryId: number, body: CreateCountryLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/countries/${countryId}/locales`, body);
  },

  async updateLocale(countryId: number, localeId: number, body: UpdateCountryLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/countries/${countryId}/locales/${localeId}`, body);
  },

  async removeLocale(countryId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/countries/${countryId}/locales/${localeId}`);
  },
};
