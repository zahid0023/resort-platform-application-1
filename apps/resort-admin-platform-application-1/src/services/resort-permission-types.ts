import { api } from "./api";
import type { Locale } from "./locales";

export interface ResortPermissionTypeLocale {
  id: number;
  locale: Locale;
  name: string;
  description?: string;
  sort_order: number;
}

export interface ResortPermissionType {
  id: number;
  code: string;
  sort_order: number;
  /** The single translation matching Accept-Language (falls back to en, then null) — on GET /{id} and list alike. */
  locale: ResortPermissionTypeLocale | null;
}

export interface ResortPermissionTypeListResponse {
  data: ResortPermissionType[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface ResortPermissionTypeLocaleListResponse {
  data: ResortPermissionTypeLocale[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CreateResortPermissionTypeLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

// The initial translation is always resolved to the "en" locale server-side —
// there's no locale_id here, and only a single locale entry is accepted at creation.
export interface CreateResortPermissionTypeRequest {
  code: string;
  sort_order: number;
  locale: {
    name: string;
    description: string;
    sort_order: number;
  };
}

export interface UpdateResortPermissionTypeRequest {
  sort_order: number;
}

export interface UpdateResortPermissionTypeLocaleRequest {
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

export const resortPermissionTypesService = {
  async list(params: ListParams = {}): Promise<ResortPermissionTypeListResponse> {
    const { page = 0, size = 10, sort_by, sort_dir = "ASC", code, name } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sortDir: sort_dir,
    });
    if (sort_by) query.set("sortBy", sort_by);
    if (code) query.set("code", code);
    if (name) query.set("name", name);
    return api.get<ResortPermissionTypeListResponse>(`/resort-permission-types?${query}`);
  },

  async get(id: number): Promise<{ data: ResortPermissionType }> {
    return api.get<{ data: ResortPermissionType }>(`/resort-permission-types/${id}`);
  },

  async listLocales(permissionTypeId: number, params: ListLocalesParams = {}): Promise<ResortPermissionTypeLocaleListResponse> {
    const { page = 0, size = 10, localeCode } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (localeCode) query.set("localeCode", localeCode);
    return api.get<ResortPermissionTypeLocaleListResponse>(`/resort-permission-types/${permissionTypeId}/locales?${query}`);
  },

  async create(body: CreateResortPermissionTypeRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/resort-permission-types", body);
  },

  async update(id: number, body: UpdateResortPermissionTypeRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/resort-permission-types/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/resort-permission-types/${id}`);
  },

  async addLocale(permissionTypeId: number, body: CreateResortPermissionTypeLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/resort-permission-types/${permissionTypeId}/locales`, body);
  },

  async updateLocale(permissionTypeId: number, localeId: number, body: UpdateResortPermissionTypeLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/resort-permission-types/${permissionTypeId}/locales/${localeId}`, body);
  },

  async removeLocale(permissionTypeId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/resort-permission-types/${permissionTypeId}/locales/${localeId}`);
  },
};
