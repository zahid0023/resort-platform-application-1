import { api } from "./api";
import type { Locale, LocaleCount } from "./locales";
import type { CountryLocale } from "./countries";

export interface CityLocale {
  id: number;
  locale: Locale;
  name: string;
  description?: string;
  sort_order: number;
}

// Minimal embedded parent summary — the country's own single Accept-Language-matched translation.
export interface CityCountry {
  id: number;
  code: string;
  iso3_code: string;
  phone_code: string;
  sort_order: number;
  locale: CountryLocale | null;
}

export interface City {
  id: number;
  country: CityCountry;
  code: string;
  sort_order: number;
  /** The single translation matching Accept-Language (falls back to en, then null) — on GET /{id} and list alike. */
  locale: CityLocale | null;
}

export interface CityListResponse {
  data: City[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CityLocaleListResponse {
  data: CityLocale[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CreateCityLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

// The initial translation is always resolved to the "en" locale server-side —
// there's no locale_id here, and only a single locale entry is accepted at creation.
export interface CreateCityRequest {
  code: string;
  country_id: number;
  sort_order: number;
  locale: {
    name: string;
    description: string;
    sort_order: number;
  };
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

export interface ListParams {
  page?: number;
  size?: number;
  // sortBy=id throws 400 — it's only valid as the implicit default when sortBy is omitted entirely.
  sort_by?: "createdAt" | "sortOrder" | "code" | "name";
  sort_dir?: "ASC" | "DESC";
  code?: string;
  countryId?: number;
  name?: string;
}

export interface ListLocalesParams {
  page?: number;
  size?: number;
  localeCode?: string;
}

export const citiesService = {
  async list(params: ListParams = {}): Promise<CityListResponse> {
    const { page = 0, size = 10, sort_by, sort_dir = "ASC", code, countryId, name } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sortDir: sort_dir,
    });
    if (sort_by) query.set("sortBy", sort_by);
    if (code) query.set("code", code);
    if (countryId != null) query.set("countryId", String(countryId));
    if (name) query.set("name", name);
    return api.get<CityListResponse>(`/cities?${query}`);
  },

  async get(id: number): Promise<{ data: City }> {
    return api.get<{ data: City }>(`/cities/${id}`);
  },

  async listLocales(cityId: number, params: ListLocalesParams = {}): Promise<CityLocaleListResponse> {
    const { page = 0, size = 10, localeCode } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (localeCode) query.set("localeCode", localeCode);
    return api.get<CityLocaleListResponse>(`/cities/${cityId}/locales?${query}`);
  },

  // `codes` here is the authoritative, complete set of locale codes this city already has a
  // translation for — unlike listLocales, which is paginated (size 10) and can miss codes past the
  // first page. Compare against `localesService.count()`'s codes to know what's still addable.
  async countLocales(cityId: number): Promise<LocaleCount> {
    return api.get<LocaleCount>(`/cities/${cityId}/locales/count`);
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
