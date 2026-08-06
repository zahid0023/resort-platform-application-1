import { api } from "./api";
import type { Locale, LocaleCount } from "./locales";

export interface CountryLocale {
  id: number;
  locale: Locale;
  name: string;
  description?: string;
  sort_order: number;
}

export interface Country {
  id: number;
  code: string;
  iso3_code: string;
  phone_code: string;
  /** URL of the uploaded flag image, or "" if none has been uploaded — see country-images.ts. */
  flag_url: string;
  sort_order: number;
  /** The single translation matching Accept-Language (falls back to en, then null) — on GET /{id} and list alike. */
  locale: CountryLocale | null;
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

export interface CountryLocaleListResponse {
  data: CountryLocale[];
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

export interface ListLocalesParams {
  page?: number;
  size?: number;
  localeCode?: string;
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

  async listLocales(countryId: number, params: ListLocalesParams = {}): Promise<CountryLocaleListResponse> {
    const { page = 0, size = 10, localeCode } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (localeCode) query.set("localeCode", localeCode);
    return api.get<CountryLocaleListResponse>(`/countries/${countryId}/locales?${query}`);
  },

  // `codes` here is the authoritative, complete set of locale codes this country already has a
  // translation for — unlike listLocales, which is paginated (size 10) and can miss codes past the
  // first page. Compare against `localesService.count()`'s codes to know what's still addable.
  async countLocales(countryId: number): Promise<LocaleCount> {
    return api.get<LocaleCount>(`/countries/${countryId}/locales/count`);
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
