import { api } from "./api";

export interface PageTypeLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface PageType {
  id: number;
  code: string;
  sort_order: number;
  locales: PageTypeLocale[];
}

export interface PageTypeListResponse {
  data: PageType[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreatePageTypeLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreatePageTypeRequest {
  code: string;
  sort_order: number;
  locales?: CreatePageTypeLocaleRequest[];
}

export interface UpdatePageTypeRequest {
  sort_order: number;
}

export interface UpdatePageTypeLocaleRequest {
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

export const pageTypesService = {
  async list(params: ListParams = {}): Promise<PageTypeListResponse> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC", code } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort_by,
      sort_dir,
    });
    if (code) query.set("code", code);
    return api.get<PageTypeListResponse>(`/page-types?${query}`);
  },

  async get(id: number): Promise<{ page_type: PageType }> {
    return api.get<{ page_type: PageType }>(`/page-types/${id}`);
  },

  async create(body: CreatePageTypeRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/page-types", body);
  },

  async update(id: number, body: UpdatePageTypeRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/page-types/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/page-types/${id}`);
  },

  async addLocale(pageTypeId: number, body: CreatePageTypeLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/page-types/${pageTypeId}/locales`, body);
  },

  async updateLocale(pageTypeId: number, localeId: number, body: UpdatePageTypeLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/page-types/${pageTypeId}/locales/${localeId}`, body);
  },

  async removeLocale(pageTypeId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/page-types/${pageTypeId}/locales/${localeId}`);
  },
};
