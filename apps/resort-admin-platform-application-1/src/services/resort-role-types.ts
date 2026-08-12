import { api } from "./api";
import type { Locale, LocaleCount } from "./locales";

export interface ResortRoleTypeLocale {
  id: number;
  locale: Locale;
  name: string;
  description?: string;
  sort_order: number;
}

export interface ResortRoleType {
  id: number;
  code: string;
  sort_order: number;
  /** The single translation matching Accept-Language (falls back to en, then null) — on GET /{id} and list alike. */
  locale: ResortRoleTypeLocale | null;
}

export interface ResortRoleTypeListResponse {
  data: ResortRoleType[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface ResortRoleTypeLocaleListResponse {
  data: ResortRoleTypeLocale[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CreateResortRoleTypeLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

// The initial translation is always resolved to the "en" locale server-side —
// there's no locale_id here, and only a single locale entry is accepted at creation.
export interface CreateResortRoleTypeRequest {
  code: string;
  sort_order: number;
  locale: {
    name: string;
    description: string;
    sort_order: number;
  };
}

export interface UpdateResortRoleTypeRequest {
  sort_order: number;
}

export interface UpdateResortRoleTypeLocaleRequest {
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

export const resortRoleTypesService = {
  async list(params: ListParams = {}): Promise<ResortRoleTypeListResponse> {
    const { page = 0, size = 10, sort_by, sort_dir = "ASC", code, name } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sortDir: sort_dir,
    });
    if (sort_by) query.set("sortBy", sort_by);
    if (code) query.set("code", code);
    if (name) query.set("name", name);
    return api.get<ResortRoleTypeListResponse>(`/resort-role-types?${query}`);
  },

  async get(id: number): Promise<{ data: ResortRoleType }> {
    return api.get<{ data: ResortRoleType }>(`/resort-role-types/${id}`);
  },

  async listLocales(roleTypeId: number, params: ListLocalesParams = {}): Promise<ResortRoleTypeLocaleListResponse> {
    const { page = 0, size = 10, localeCode } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (localeCode) query.set("localeCode", localeCode);
    return api.get<ResortRoleTypeLocaleListResponse>(`/resort-role-types/${roleTypeId}/locales?${query}`);
  },

  async create(body: CreateResortRoleTypeRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/resort-role-types", body);
  },

  async update(id: number, body: UpdateResortRoleTypeRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/resort-role-types/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/resort-role-types/${id}`);
  },

  async addLocale(roleTypeId: number, body: CreateResortRoleTypeLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/resort-role-types/${roleTypeId}/locales`, body);
  },

  async updateLocale(roleTypeId: number, localeId: number, body: UpdateResortRoleTypeLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/resort-role-types/${roleTypeId}/locales/${localeId}`, body);
  },

  async removeLocale(roleTypeId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/resort-role-types/${roleTypeId}/locales/${localeId}`);
  },
};
