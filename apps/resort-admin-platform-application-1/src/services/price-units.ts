import { api } from "./api";
import type { Locale, LocaleCount } from "./locales";
import type { PriceScope } from "./price-scopes";

export interface PriceUnitLocale {
  id: number;
  locale: Locale;
  name: string;
  description?: string;
  sort_order: number;
  purpose?: string;
  usage_example?: string;
}

export interface PriceUnit {
  id: number;
  code: string;
  sort_order: number;
  /** The single translation matching Accept-Language (falls back to en, then null) — on GET /{id} and list alike. */
  locale: PriceUnitLocale | null;
  /** Only present on GET /{id} and GET (list) — the price scopes this price unit is assigned to. */
  price_scopes?: PriceScope[];
}

export interface PriceUnitListResponse {
  data: PriceUnit[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface PriceUnitLocaleListResponse {
  data: PriceUnitLocale[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CreatePriceUnitLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
  purpose?: string;
  usage_example?: string;
}

// The initial translation is always resolved to the "en" locale server-side —
// there's no locale_id here, and only a single locale entry is accepted at creation.
export interface CreatePriceUnitRequest {
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

export interface UpdatePriceUnitRequest {
  sort_order: number;
}

export interface UpdatePriceUnitLocaleRequest {
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

export const priceUnitsService = {
  async list(params: ListParams = {}): Promise<PriceUnitListResponse> {
    const { page = 0, size = 10, sort_by, sort_dir = "ASC", code, name } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sortDir: sort_dir,
    });
    if (sort_by) query.set("sortBy", sort_by);
    if (code) query.set("code", code);
    if (name) query.set("name", name);
    return api.get<PriceUnitListResponse>(`/price-units?${query}`);
  },

  async get(id: number): Promise<{ data: PriceUnit }> {
    return api.get<{ data: PriceUnit }>(`/price-units/${id}`);
  },

  async listLocales(priceUnitId: number, params: ListLocalesParams = {}): Promise<PriceUnitLocaleListResponse> {
    const { page = 0, size = 10, localeCode } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (localeCode) query.set("localeCode", localeCode);
    return api.get<PriceUnitLocaleListResponse>(`/price-units/${priceUnitId}/locales?${query}`);
  },

  // `codes` here is the authoritative, complete set of locale codes this price unit already has a
  // translation for — unlike listLocales, which is paginated (size 10) and can miss codes past the
  // first page. Compare against `localesService.count()`'s codes to know what's still addable.
  async countLocales(priceUnitId: number): Promise<LocaleCount> {
    return api.get<LocaleCount>(`/price-units/${priceUnitId}/locales/count`);
  },

  async create(body: CreatePriceUnitRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/price-units", body);
  },

  async update(id: number, body: UpdatePriceUnitRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/price-units/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/price-units/${id}`);
  },

  async addLocale(priceUnitId: number, body: CreatePriceUnitLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/price-units/${priceUnitId}/locales`, body);
  },

  async updateLocale(priceUnitId: number, localeId: number, body: UpdatePriceUnitLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/price-units/${priceUnitId}/locales/${localeId}`, body);
  },

  async removeLocale(priceUnitId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/price-units/${priceUnitId}/locales/${localeId}`);
  },

  async assignScope(priceUnitId: number, priceScopeId: number): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/price-units/${priceUnitId}/scope-assignments`, { price_scope_id: priceScopeId });
  },

  // Identified by the price scope's own id, not an assignment row id — a price unit can have at most
  // one active assignment to a given scope, so (price-unit-id, price-scope-id) is always enough.
  async unassignScope(priceUnitId: number, priceScopeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/price-units/${priceUnitId}/scope-assignments/${priceScopeId}`);
  },
};
