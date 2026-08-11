import { api } from "./api";
import type { Locale, LocaleCount } from "./locales";

export interface PriceTypeScopeLocale {
  id: number;
  locale: Locale;
  name: string;
  description?: string;
  sort_order: number;
}

export interface PriceTypeScope {
  id: number;
  code: string;
  sort_order: number;
  /** The single translation matching Accept-Language (falls back to en, then null) — on GET /{id} and list alike. */
  locale: PriceTypeScopeLocale | null;
}

export interface PriceTypeScopeListResponse {
  data: PriceTypeScope[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface PriceTypeScopeLocaleListResponse {
  data: PriceTypeScopeLocale[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CreatePriceTypeScopeLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

// The initial translation is always resolved to the "en" locale server-side —
// there's no locale_id here, and only a single locale entry is accepted at creation.
export interface CreatePriceTypeScopeRequest {
  code: string;
  sort_order: number;
  locale: {
    name: string;
    description: string;
    sort_order: number;
  };
}

export interface UpdatePriceTypeScopeRequest {
  sort_order: number;
}

export interface UpdatePriceTypeScopeLocaleRequest {
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

export const priceTypeScopesService = {
  async list(params: ListParams = {}): Promise<PriceTypeScopeListResponse> {
    const { page = 0, size = 10, sort_by, sort_dir = "ASC", code, name } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sortDir: sort_dir,
    });
    if (sort_by) query.set("sortBy", sort_by);
    if (code) query.set("code", code);
    if (name) query.set("name", name);
    return api.get<PriceTypeScopeListResponse>(`/price-type-scopes?${query}`);
  },

  async get(id: number): Promise<{ data: PriceTypeScope }> {
    return api.get<{ data: PriceTypeScope }>(`/price-type-scopes/${id}`);
  },

  async listLocales(priceTypeScopeId: number, params: ListLocalesParams = {}): Promise<PriceTypeScopeLocaleListResponse> {
    const { page = 0, size = 10, localeCode } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (localeCode) query.set("localeCode", localeCode);
    return api.get<PriceTypeScopeLocaleListResponse>(`/price-type-scopes/${priceTypeScopeId}/locales?${query}`);
  },

  // `codes` here is the authoritative, complete set of locale codes this scope already has a
  // translation for — unlike listLocales, which is paginated (size 10) and can miss codes past the
  // first page. Compare against `localesService.count()`'s codes to know what's still addable.
  async countLocales(priceTypeScopeId: number): Promise<LocaleCount> {
    return api.get<LocaleCount>(`/price-type-scopes/${priceTypeScopeId}/locales/count`);
  },

  async create(body: CreatePriceTypeScopeRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/price-type-scopes", body);
  },

  async update(id: number, body: UpdatePriceTypeScopeRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/price-type-scopes/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/price-type-scopes/${id}`);
  },

  async addLocale(priceTypeScopeId: number, body: CreatePriceTypeScopeLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/price-type-scopes/${priceTypeScopeId}/locales`, body);
  },

  async updateLocale(priceTypeScopeId: number, localeId: number, body: UpdatePriceTypeScopeLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/price-type-scopes/${priceTypeScopeId}/locales/${localeId}`, body);
  },

  async removeLocale(priceTypeScopeId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/price-type-scopes/${priceTypeScopeId}/locales/${localeId}`);
  },
};
