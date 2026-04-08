import { api } from "./api";

export interface UiBlockCategory {
  id: number;
  key: string;
  name: string;
  description: string | null;
}

export interface UiBlockCategoryListResponse {
  data: UiBlockCategory[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateUiBlockCategoryRequest {
  key: string;
  name: string;
  description?: string;
}

export interface UpdateUiBlockCategoryRequest {
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

export const listUiBlockCategories = (params: ListParams = {}): Promise<UiBlockCategoryListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  return api.get<UiBlockCategoryListResponse>(`/ui-block-categories?${query.toString()}`);
};

export const getUiBlockCategory = (id: number): Promise<{ data: UiBlockCategory }> =>
  api.get<{ data: UiBlockCategory }>(`/ui-block-categories/${id}`);

export const createUiBlockCategory = (body: CreateUiBlockCategoryRequest): Promise<MutationResponse> =>
  api.post<MutationResponse>("/ui-block-categories", body);

export const updateUiBlockCategory = (id: number, body: UpdateUiBlockCategoryRequest): Promise<{ data: UiBlockCategory }> =>
  api.put<{ data: UiBlockCategory }>(`/ui-block-categories/${id}`, body);

export const deleteUiBlockCategory = (id: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/ui-block-categories/${id}`);
