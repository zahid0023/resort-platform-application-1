import { api } from "./api";

export interface Locale {
  id: number;
  code: string;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateLocaleRequest {
  code: string;
  name: string;
  description?: string;
  sort_order: number;
}

export interface UpdateLocaleRequest {
  code: string;
  name: string;
  description?: string;
  sort_order: number;
}

export interface LocaleListResponse {
  data: Locale[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface LocaleMutationResponse {
  success: boolean;
  id: number;
}

export interface ListLocalesParams {
  page?: number;
  size?: number;
  sort_by?: "id" | "code" | "name" | "sortOrder" | "createdAt";
  sort_dir?: "ASC" | "DESC";
  code?: string;
  name?: string;
}

export const localesService = {
  async list(params: ListLocalesParams = {}): Promise<LocaleListResponse> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC", code, name } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort_by,
      sort_dir,
    });
    if (code) query.set("code", code);
    if (name) query.set("name", name);
    return api.get<LocaleListResponse>(`/locales?${query}`);
  },

  async get(id: number): Promise<{ locale: Locale }> {
    return api.get<{ locale: Locale }>(`/locales/${id}`);
  },

  async create(body: CreateLocaleRequest): Promise<LocaleMutationResponse> {
    return api.post<LocaleMutationResponse>("/locales", body);
  },

  async update(id: number, body: UpdateLocaleRequest): Promise<LocaleMutationResponse> {
    return api.put<LocaleMutationResponse>(`/locales/${id}`, body);
  },

  async remove(id: number): Promise<LocaleMutationResponse> {
    return api.delete<LocaleMutationResponse>(`/locales/${id}`);
  },
};
