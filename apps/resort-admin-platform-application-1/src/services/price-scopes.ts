import { api } from "./api";
import type { Locale, LocaleCount } from "./locales";

export interface PriceScopeLocale {
  id: number;
  locale: Locale;
  name: string;
  description?: string;
  sort_order: number;
}

export interface PriceScope {
  id: number;
  code: string;
  sort_order: number;
  /** The single translation matching Accept-Language (falls back to en, then null) — on GET /{id} and list alike. */
  locale: PriceScopeLocale | null;
}

export interface PriceScopeListResponse {
  data: PriceScope[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface PriceScopeLocaleListResponse {
  data: PriceScopeLocale[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CreatePriceScopeLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

// The initial translation is always resolved to the "en" locale server-side —
// there's no locale_id here, and only a single locale entry is accepted at creation.
export interface CreatePriceScopeRequest {
  code: string;
  sort_order: number;
  locale: {
    name: string;
    description: string;
    sort_order: number;
  };
}

export interface UpdatePriceScopeRequest {
  sort_order: number;
}

export interface UpdatePriceScopeLocaleRequest {
  name: string;
  description?: string;
  sort_order: number;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

export interface PriceScopeCount {
  count: number;
  codes: string[];
}

export interface ListParams {
  page?: number;
  size?: number;
  // sortBy=id throws 400 — it's only valid as the implicit default when sortBy is omitted entirely.
  sort_by?: "createdAt" | "code" | "name";
  sort_dir?: "ASC" | "DESC";
  code?: string;
  name?: string;
}

export interface ListLocalesParams {
  page?: number;
  size?: number;
  localeCode?: string;
}

export const priceScopesService = {
  async list(params: ListParams = {}): Promise<PriceScopeListResponse> {
    const { page = 0, size = 10, sort_by, sort_dir = "ASC", code, name } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sortDir: sort_dir,
    });
    if (sort_by) query.set("sortBy", sort_by);
    if (code) query.set("code", code);
    if (name) query.set("name", name);
    return api.get<PriceScopeListResponse>(`/price-scopes?${query}`);
  },

  async get(id: number): Promise<{ data: PriceScope }> {
    return api.get<{ data: PriceScope }>(`/price-scopes/${id}`);
  },

  // Authoritative, unpaginated count of every active price scope, plus each one's code — unlike
  // `list`, which is paginated (size 10 default) and can undercount past the first page. Used to
  // know whether a price type still has any assignable scopes left.
  async count(): Promise<PriceScopeCount> {
    return api.get<PriceScopeCount>("/price-scopes/count");
  },

  async listLocales(priceScopeId: number, params: ListLocalesParams = {}): Promise<PriceScopeLocaleListResponse> {
    const { page = 0, size = 10, localeCode } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (localeCode) query.set("localeCode", localeCode);
    return api.get<PriceScopeLocaleListResponse>(`/price-scopes/${priceScopeId}/locales?${query}`);
  },

  // `codes` here is the authoritative, complete set of locale codes this price scope already has a
  // translation for — unlike listLocales, which is paginated (size 10) and can miss codes past the
  // first page. Compare against `localesService.count()`'s codes to know what's still addable.
  async countLocales(priceScopeId: number): Promise<LocaleCount> {
    return api.get<LocaleCount>(`/price-scopes/${priceScopeId}/locales/count`);
  },

  async create(body: CreatePriceScopeRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/price-scopes", body);
  },

  async update(id: number, body: UpdatePriceScopeRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/price-scopes/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/price-scopes/${id}`);
  },

  async addLocale(priceScopeId: number, body: CreatePriceScopeLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/price-scopes/${priceScopeId}/locales`, body);
  },

  async updateLocale(priceScopeId: number, localeId: number, body: UpdatePriceScopeLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/price-scopes/${priceScopeId}/locales/${localeId}`, body);
  },

  async removeLocale(priceScopeId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/price-scopes/${priceScopeId}/locales/${localeId}`);
  },
};
