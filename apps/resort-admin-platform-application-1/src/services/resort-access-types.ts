import { api } from "./api";

export interface ResortAccessTypeLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface ResortAccessType {
  id: number;
  code: string;
  sort_order: number;
  locales: ResortAccessTypeLocale[];
}

export interface ResortAccessTypeListResponse {
  data: ResortAccessType[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateResortAccessTypeLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateResortAccessTypeRequest {
  code: string;
  sort_order: number;
  locales?: CreateResortAccessTypeLocaleRequest[];
}

export interface UpdateResortAccessTypeRequest {
  sort_order: number;
}

export interface UpdateResortAccessTypeLocaleRequest {
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

export const resortAccessTypesService = {
  async list(params: ListParams = {}): Promise<ResortAccessTypeListResponse> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC", code } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort_by,
      sort_dir,
    });
    if (code) query.set("code", code);
    return api.get<ResortAccessTypeListResponse>(`/resort-access-types?${query}`);
  },

  async get(id: number): Promise<{ data: ResortAccessType }> {
    return api.get<{ data: ResortAccessType }>(`/resort-access-types/${id}`);
  },

  async create(body: CreateResortAccessTypeRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/resort-access-types", body);
  },

  async update(id: number, body: UpdateResortAccessTypeRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/resort-access-types/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/resort-access-types/${id}`);
  },

  async addLocale(accessTypeId: number, body: CreateResortAccessTypeLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/resort-access-types/${accessTypeId}/locales`, body);
  },

  async updateLocale(accessTypeId: number, localeId: number, body: UpdateResortAccessTypeLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/resort-access-types/${accessTypeId}/locales/${localeId}`, body);
  },

  async removeLocale(accessTypeId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/resort-access-types/${accessTypeId}/locales/${localeId}`);
  },
};
