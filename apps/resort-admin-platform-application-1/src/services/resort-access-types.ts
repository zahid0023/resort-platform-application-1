import { api } from "./api";

export interface ResortAccessTypeSummary {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface ResortAccessType {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface ResortAccessTypeListResponse {
  data: ResortAccessTypeSummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateResortAccessTypeRequest {
  code: string;
  name: string;
  description: string;
}

export interface UpdateResortAccessTypeRequest {
  code?: string;
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
  sort_by?: "id" | "code" | "name";
  sort_dir?: "ASC" | "DESC";
}

export const listResortAccessTypes = (params: ListParams = {}): Promise<ResortAccessTypeListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  return api.get<ResortAccessTypeListResponse>(`/resort-access-types?${query.toString()}`);
};

export const getResortAccessType = (id: number): Promise<{ data: ResortAccessType }> =>
  api.get<{ data: ResortAccessType }>(`/resort-access-types/${id}`);

export const createResortAccessType = (body: CreateResortAccessTypeRequest): Promise<MutationResponse> =>
  api.post<MutationResponse>("/resort-access-types", body);

export const updateResortAccessType = (id: number, body: UpdateResortAccessTypeRequest): Promise<{ data: ResortAccessType }> =>
  api.put<{ data: ResortAccessType }>(`/resort-access-types/${id}`, body);

export const deleteResortAccessType = (id: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/resort-access-types/${id}`);
