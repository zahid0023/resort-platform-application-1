import { api } from "./api";
import type { Locale, LocaleCount } from "./locales";

export interface BedTypeLocale {
  id: number;
  locale: Locale;
  name: string;
  description?: string;
  sort_order: number;
}

export interface BedType {
  id: number;
  code: string;
  sort_order: number;
  /** The single translation matching Accept-Language (falls back to en, then null) — on GET /{id} and list alike. */
  locale: BedTypeLocale | null;
}

export interface BedTypeListResponse {
  data: BedType[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface BedTypeLocaleListResponse {
  data: BedTypeLocale[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CreateBedTypeLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

// The initial translation is always resolved to the "en" locale server-side —
// there's no locale_id here, and only a single locale entry is accepted at creation.
export interface CreateBedTypeRequest {
  code: string;
  sort_order: number;
  locale: {
    name: string;
    description: string;
    sort_order: number;
  };
}

export interface UpdateBedTypeRequest {
  sort_order: number;
}

export interface UpdateBedTypeLocaleRequest {
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

export const bedTypesService = {
  async list(params: ListParams = {}): Promise<BedTypeListResponse> {
    const { page = 0, size = 10, sort_by, sort_dir = "ASC", code, name } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sortDir: sort_dir,
    });
    if (sort_by) query.set("sortBy", sort_by);
    if (code) query.set("code", code);
    if (name) query.set("name", name);
    return api.get<BedTypeListResponse>(`/bed-types?${query}`);
  },

  async get(id: number): Promise<{ data: BedType }> {
    return api.get<{ data: BedType }>(`/bed-types/${id}`);
  },

  async listLocales(bedTypeId: number, params: ListLocalesParams = {}): Promise<BedTypeLocaleListResponse> {
    const { page = 0, size = 10, localeCode } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (localeCode) query.set("localeCode", localeCode);
    return api.get<BedTypeLocaleListResponse>(`/bed-types/${bedTypeId}/locales?${query}`);
  },

  // `codes` here is the authoritative, complete set of locale codes this bed type already has a
  // translation for — unlike listLocales, which is paginated (size 10) and can miss codes past the
  // first page. Compare against `localesService.count()`'s codes to know what's still addable.
  async countLocales(bedTypeId: number): Promise<LocaleCount> {
    return api.get<LocaleCount>(`/bed-types/${bedTypeId}/locales/count`);
  },

  async create(body: CreateBedTypeRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/bed-types", body);
  },

  async update(id: number, body: UpdateBedTypeRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/bed-types/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/bed-types/${id}`);
  },

  async addLocale(bedTypeId: number, body: CreateBedTypeLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/bed-types/${bedTypeId}/locales`, body);
  },

  async updateLocale(bedTypeId: number, localeId: number, body: UpdateBedTypeLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/bed-types/${bedTypeId}/locales/${localeId}`, body);
  },

  async removeLocale(bedTypeId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/bed-types/${bedTypeId}/locales/${localeId}`);
  },
};
