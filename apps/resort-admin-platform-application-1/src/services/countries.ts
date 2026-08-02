import { api } from "./api";
import type { Locale } from "./locales";

export interface CountryLocale {
  id: number;
  locale: Locale;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CountryCityLocale {
  id: number;
  locale: Locale;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CountryCity {
  id: number;
  code: string;
  sort_order: number;
  locales: CountryCityLocale[];
}

export interface CountryCurrencyLocale {
  id: number;
  locale: Locale;
  name: string;
  short_name?: string;
  sort_order: number;
}

export interface CountryCurrency {
  id: number;
  code: string;
  numeric_code: string;
  symbol: string;
  decimal_places: number;
  is_default: boolean;
  sort_order: number;
  locales: CountryCurrencyLocale[];
}

export interface Country {
  id: number;
  code: string;
  iso3_code: string;
  phone_code: string;
  sort_order: number;
  /** Every translation on GET /{id}; exactly one (Accept-Language-matched, en fallback) everywhere else */
  locales: CountryLocale[];
  /** [] except on GET /{id} */
  cities: CountryCity[];
  /** [] except on GET /{id} */
  currencies: CountryCurrency[];
}

export interface CountryListResponse {
  data: Country[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CreateCountryLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

// The initial translation is always resolved to the "en" locale server-side —
// there's no locale_id here, and only a single locale entry is accepted at creation.
export interface CreateCountryRequest {
  code: string;
  iso3_code: string;
  phone_code: string;
  sort_order: number;
  locale: {
    name: string;
    description: string;
    sort_order: number;
  };
}

export interface UpdateCountryRequest {
  iso3_code: string;
  phone_code: string;
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
  // sortBy=id throws 400 — it's only valid as the implicit default when sortBy is omitted entirely.
  sort_by?: "createdAt" | "code" | "iso3Code" | "phoneCode" | "name";
  sort_dir?: "ASC" | "DESC";
  // `code` is accepted by the backend but not currently wired into search predicates — omit it as a filter.
  iso3Code?: string;
  phoneCode?: string;
  name?: string;
}

export const countriesService = {
  async list(params: ListParams = {}): Promise<CountryListResponse> {
    const { page = 0, size = 10, sort_by, sort_dir = "ASC", iso3Code, phoneCode, name } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sortDir: sort_dir,
    });
    if (sort_by) query.set("sortBy", sort_by);
    if (iso3Code) query.set("iso3Code", iso3Code);
    if (phoneCode) query.set("phoneCode", phoneCode);
    if (name)      query.set("name", name);
    return api.get<CountryListResponse>(`/countries?${query}`);
  },

  async get(id: number): Promise<{ data: Country }> {
    return api.get<{ data: Country }>(`/countries/${id}`);
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
