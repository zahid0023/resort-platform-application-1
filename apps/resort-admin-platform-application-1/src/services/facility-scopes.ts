import { api } from "./api";

export interface FacilityScopeLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface FacilityScope {
  id: number;
  code: string;
  sort_order: number;
  locales: FacilityScopeLocale[];
}

export interface FacilityScopeListResponse {
  data: FacilityScope[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface UpdateFacilityScopeRequest {
  sort_order: number;
}

export interface CreateFacilityScopeLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface UpdateFacilityScopeLocaleRequest {
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
  sort_by?: string;
  sort_dir?: "ASC" | "DESC";
  code?: string;
}

export const facilityScopesService = {
  async list(params: ListParams = {}): Promise<FacilityScopeListResponse> {
    const { page = 0, size = 10, sort_by = "sortOrder", sort_dir = "ASC", code } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort_by,
      sort_dir,
    });
    if (code) query.set("code", code);
    return api.get<FacilityScopeListResponse>(`/facility-scopes?${query}`);
  },

  async get(id: number): Promise<{ data: FacilityScope }> {
    return api.get<{ data: FacilityScope }>(`/facility-scopes/${id}`);
  },

  async update(id: number, body: UpdateFacilityScopeRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/facility-scopes/${id}`, body);
  },

  async addLocale(facilityScopeId: number, body: CreateFacilityScopeLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/facility-scopes/${facilityScopeId}/locales`, body);
  },

  async updateLocale(facilityScopeId: number, localeId: number, body: UpdateFacilityScopeLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/facility-scopes/${facilityScopeId}/locales/${localeId}`, body);
  },

  async removeLocale(facilityScopeId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/facility-scopes/${facilityScopeId}/locales/${localeId}`);
  },
};
