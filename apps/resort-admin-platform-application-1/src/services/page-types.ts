import { api } from "./api";

export interface PageTypeSummary {
  id: number;
  key: string;
  name: string;
  description?: string | null;
}

export interface PageType {
  id: number;
  key: string;
  name: string;
  description: string | null;
}

export interface PageTypeListResponse {
  data: PageTypeSummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreatePageTypeRequest {
  key: string;
  name: string;
  description?: string;
}

export interface UpdatePageTypeRequest {
  key?: string;
  name?: string;
  description?: string;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

export interface ListParams {
  page?: number;
  size?: number;
  sort_by?: "id" | "key" | "name";
  sort_dir?: "ASC" | "DESC";
}

export const listPageTypes = (params: ListParams = {}): Promise<PageTypeListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  return api.get<PageTypeListResponse>(`/page-types?${query.toString()}`);
};

export const getPageType = (id: number): Promise<{ data: PageType }> =>
  api.get<{ data: PageType }>(`/page-types/${id}`);

export const createPageType = (body: CreatePageTypeRequest): Promise<MutationResponse> =>
  api.post<MutationResponse>("/page-types", body);

export const updatePageType = (id: number, body: UpdatePageTypeRequest): Promise<{ data: PageType }> =>
  api.put<{ data: PageType }>(`/page-types/${id}`, body);

export const deletePageType = (id: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/page-types/${id}`);
