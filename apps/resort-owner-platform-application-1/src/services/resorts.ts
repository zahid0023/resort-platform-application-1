import { api } from "./api";

export interface ResortSummary {
  id: number;
  code: string;
}

export interface ResortListResponse {
  data: ResortSummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
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

function buildQuery(params: ListParams): URLSearchParams {
  const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC", code } = params;
  const q = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
  if (code) q.set("code", code);
  return q;
}

/** Resort-user endpoint: only resorts the current user has access to. */
export function listResorts(params: ListParams = {}): Promise<ResortListResponse> {
  return api.get<ResortListResponse>(`/resorts/my-resorts?${buildQuery(params)}`);
}

/** Admin endpoint: all resorts across the platform. */
export function listAllResorts(params: ListParams = {}): Promise<ResortListResponse> {
  return api.get<ResortListResponse>(`/resorts?${buildQuery(params)}`);
}

export function getResort(id: number): Promise<{ data: ResortSummary }> {
  return api.get<{ data: ResortSummary }>(`/resorts/${id}`);
}

export function createResort(code: string): Promise<MutationResponse> {
  return api.post<MutationResponse>("/resorts", { code });
}

export function deleteResort(id: number): Promise<MutationResponse> {
  return api.delete<MutationResponse>(`/resorts/${id}`);
}
