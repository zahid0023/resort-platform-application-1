import { api } from "./api";

export interface ResortSummary {
  id: number;
  uuid: string;
  name: string;
  description: string;
  address: string | null;
  country_id: number;
  city_id: number | null;
  contact_email: string | null;
  contact_phone: string | null;
}

export interface Resort {
  id: number;
  uuid: string;
  name: string;
  description: string;
  address: string | null;
  country_id: number;
  city_id: number | null;
  contact_email: string | null;
  contact_phone: string | null;
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

export interface ListParams {
  page?: number;
  size?: number;
  sort_by?: "id" | "name";
  sort_dir?: "ASC" | "DESC";
}

export interface CreateResortRequest {
  name: string;
  description: string;
  address?: string;
  country_id: number;
  city_id?: number;
  contact_email?: string;
  contact_phone?: string;
}

export interface UpdateResortRequest {
  name?: string;
  description?: string;
  address?: string;
  country_id?: number;
  city_id?: number;
  contact_email?: string;
  contact_phone?: string;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

export const createResort = (body: CreateResortRequest): Promise<Resort> =>
  api.post<Resort>("/resorts", body);

export const listResorts = (params: ListParams = {}): Promise<ResortListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  return api.get<ResortListResponse>(`/resorts?${query.toString()}`);
};

export const getResort = (id: number): Promise<{ data: Resort }> =>
  api.get<{ data: Resort }>(`/resorts/${id}`);

export const updateResort = (id: number, body: UpdateResortRequest): Promise<Resort> =>
  api.put<Resort>(`/resorts/${id}`, body);

export const deleteResort = (id: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/resorts/${id}`);
