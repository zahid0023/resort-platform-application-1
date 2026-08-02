import { api } from "./api";
import type { Locale } from "./locales";
import type { CountryLocale } from "./countries";

export interface CurrencyLocale {
  id: number;
  locale: Locale;
  name: string;
  short_name?: string;
  sort_order: number;
}

// Minimal embedded parent summary — the country's own single Accept-Language-matched translation.
export interface CurrencyCountry {
  id: number;
  code: string;
  iso3_code: string;
  phone_code: string;
  sort_order: number;
  locale: CountryLocale | null;
}

export interface Currency {
  id: number;
  country: CurrencyCountry;
  code: string;
  numeric_code: string;
  symbol: string;
  decimal_places: number;
  is_default: boolean;
  sort_order: number;
  /** The single translation matching Accept-Language (falls back to en, then null) — on GET /{id} and list alike. */
  locale: CurrencyLocale | null;
}

export interface CurrencyListResponse {
  data: Currency[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CurrencyLocaleListResponse {
  data: CurrencyLocale[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CreateCurrencyLocaleRequest {
  locale_id: number;
  name: string;
  short_name?: string;
  sort_order: number;
}

// The initial translation is always resolved to the "en" locale server-side —
// there's no locale_id here, and only a single locale entry is accepted at creation.
export interface CreateCurrencyRequest {
  code: string;
  numeric_code: string;
  country_id: number;
  symbol: string;
  decimal_places: number;
  is_default: boolean;
  sort_order: number;
  locale: {
    name: string;
    short_name?: string;
    sort_order: number;
  };
}

export interface UpdateCurrencyRequest {
  symbol: string;
  decimal_places: number;
  is_default: boolean;
  sort_order: number;
}

export interface UpdateCurrencyLocaleRequest {
  name: string;
  short_name?: string;
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
  // Unlike Countries/Cities, there is no sortOrder option here.
  sort_by?: "createdAt" | "code" | "numericCode" | "name" | "shortName";
  sort_dir?: "ASC" | "DESC";
  code?: string;
  numericCode?: string;
  countryId?: number;
  isDefault?: boolean;
  name?: string;
  shortName?: string;
}

export interface ListLocalesParams {
  page?: number;
  size?: number;
  localeCode?: string;
}

export const currenciesService = {
  async list(params: ListParams = {}): Promise<CurrencyListResponse> {
    const { page = 0, size = 10, sort_by, sort_dir = "ASC", code, numericCode, countryId, isDefault, name, shortName } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sortDir: sort_dir,
    });
    if (sort_by) query.set("sortBy", sort_by);
    if (code) query.set("code", code);
    if (numericCode) query.set("numericCode", numericCode);
    if (countryId != null) query.set("countryId", String(countryId));
    if (isDefault != null) query.set("isDefault", String(isDefault));
    if (name) query.set("name", name);
    if (shortName) query.set("shortName", shortName);
    return api.get<CurrencyListResponse>(`/currencies?${query}`);
  },

  async get(id: number): Promise<{ data: Currency }> {
    return api.get<{ data: Currency }>(`/currencies/${id}`);
  },

  async listLocales(currencyId: number, params: ListLocalesParams = {}): Promise<CurrencyLocaleListResponse> {
    const { page = 0, size = 10, localeCode } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (localeCode) query.set("localeCode", localeCode);
    return api.get<CurrencyLocaleListResponse>(`/currencies/${currencyId}/locales?${query}`);
  },

  async create(body: CreateCurrencyRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/currencies", body);
  },

  async update(id: number, body: UpdateCurrencyRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/currencies/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/currencies/${id}`);
  },

  async addLocale(currencyId: number, body: CreateCurrencyLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/currencies/${currencyId}/locales`, body);
  },

  async updateLocale(currencyId: number, localeId: number, body: UpdateCurrencyLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/currencies/${currencyId}/locales/${localeId}`, body);
  },

  async removeLocale(currencyId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/currencies/${currencyId}/locales/${localeId}`);
  },
};
