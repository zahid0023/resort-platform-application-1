import { api } from "./api";
import type { Locale, LocaleCount } from "./locales";
import type { PriceScope } from "./price-scopes";

export interface PriceTypeLocale {
  id: number;
  locale: Locale;
  name: string;
  description?: string;
  sort_order: number;
  purpose?: string;
  usage_example?: string;
}

export interface PriceType {
  id: number;
  code: string;
  sort_order: number;
  /** The single translation matching Accept-Language (falls back to en, then null) — on GET /{id} and list alike. */
  locale: PriceTypeLocale | null;
  /** Only present on GET /{id} and GET (list) — the price scopes this price type is assigned to. */
  price_scopes?: PriceScope[];
}

export interface PriceTypeListResponse {
  data: PriceType[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface PriceTypeLocaleListResponse {
  data: PriceTypeLocale[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CreatePriceTypeLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
  purpose?: string;
  usage_example?: string;
}

// The initial translation is always resolved to the "en" locale server-side —
// there's no locale_id here, and only a single locale entry is accepted at creation.
export interface CreatePriceTypeRequest {
  code: string;
  sort_order: number;
  // Not empty — must reference at least one existing, active price scope, or the API rejects with
  // 400 INVALID_ARGUMENT.
  price_scope_ids: number[];
  locale: {
    name: string;
    description: string;
    sort_order: number;
    purpose: string;
    usage_example: string;
  };
}

export interface UpdatePriceTypeRequest {
  sort_order: number;
}

export interface UpdatePriceTypeLocaleRequest {
  name: string;
  description?: string;
  sort_order: number;
  purpose?: string;
  usage_example?: string;
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

export const priceTypesService = {
  async list(params: ListParams = {}): Promise<PriceTypeListResponse> {
    const { page = 0, size = 10, sort_by, sort_dir = "ASC", code, name } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sortDir: sort_dir,
    });
    if (sort_by) query.set("sortBy", sort_by);
    if (code) query.set("code", code);
    if (name) query.set("name", name);
    return api.get<PriceTypeListResponse>(`/price-types?${query}`);
  },

  async get(id: number): Promise<{ data: PriceType }> {
    return api.get<{ data: PriceType }>(`/price-types/${id}`);
  },

  async listLocales(priceTypeId: number, params: ListLocalesParams = {}): Promise<PriceTypeLocaleListResponse> {
    const { page = 0, size = 10, localeCode } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (localeCode) query.set("localeCode", localeCode);
    return api.get<PriceTypeLocaleListResponse>(`/price-types/${priceTypeId}/locales?${query}`);
  },

  // `codes` here is the authoritative, complete set of locale codes this price type already has a
  // translation for — unlike listLocales, which is paginated (size 10) and can miss codes past the
  // first page. Compare against `localesService.count()`'s codes to know what's still addable.
  async countLocales(priceTypeId: number): Promise<LocaleCount> {
    return api.get<LocaleCount>(`/price-types/${priceTypeId}/locales/count`);
  },

  async create(body: CreatePriceTypeRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/price-types", body);
  },

  async update(id: number, body: UpdatePriceTypeRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/price-types/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/price-types/${id}`);
  },

  async addLocale(priceTypeId: number, body: CreatePriceTypeLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/price-types/${priceTypeId}/locales`, body);
  },

  async updateLocale(priceTypeId: number, localeId: number, body: UpdatePriceTypeLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/price-types/${priceTypeId}/locales/${localeId}`, body);
  },

  async removeLocale(priceTypeId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/price-types/${priceTypeId}/locales/${localeId}`);
  },

  async assignScope(priceTypeId: number, priceScopeId: number): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/price-types/${priceTypeId}/scope-assignments`, { price_scope_id: priceScopeId });
  },

  // Identified by the price scope's own id, not an assignment row id — a price type can have at most
  // one active assignment to a given scope, so (price-type-id, price-scope-id) is always enough.
  async unassignScope(priceTypeId: number, priceScopeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/price-types/${priceTypeId}/scope-assignments/${priceScopeId}`);
  },
};
