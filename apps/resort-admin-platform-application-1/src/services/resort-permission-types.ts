import { api } from "./api";

export interface ResortPermissionTypeLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface ResortPermissionType {
  id: number;
  code: string;
  sort_order: number;
  locales: ResortPermissionTypeLocale[];
}

export interface ResortPermissionTypeListResponse {
  data: ResortPermissionType[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateResortPermissionTypeLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateResortPermissionTypeRequest {
  code: string;
  sort_order: number;
  locales?: CreateResortPermissionTypeLocaleRequest[];
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
  sort_by?: string;
  sort_dir?: "ASC" | "DESC";
  code?: string;
}

export const resortPermissionTypesService = {
  async list(params: ListParams = {}): Promise<ResortPermissionTypeListResponse> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC", code } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort_by,
      sort_dir,
    });
    if (code) query.set("code", code);
    return api.get<ResortPermissionTypeListResponse>(`/resort-permission-types?${query}`);
  },

  async get(id: number): Promise<{ data: ResortPermissionType }> {
    return api.get<{ data: ResortPermissionType }>(`/resort-permission-types/${id}`);
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
