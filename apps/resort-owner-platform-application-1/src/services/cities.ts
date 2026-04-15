import { api } from "./api";

export interface CitySummary {
  id: number;
  name: string;
  country_id: number;
}

export interface City {
  id: number;
  name: string;
  country_id: number;
}

export interface CityListResponse {
  data: CitySummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateCityRequest {
  name: string;
  country_id: number;
}

export interface UpdateCityRequest {
  name?: string;
  country_id?: number;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

export interface ListParams {
  page?: number;
  size?: number;
  sort_by?: "id" | "name";
  sort_dir?: "ASC" | "DESC";
}

export const listCities = (params: ListParams = {}): Promise<CityListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  return api.get<CityListResponse>(`/cities?${query.toString()}`);
};

export const getCity = (id: number): Promise<{ data: City }> =>
  api.get<{ data: City }>(`/cities/${id}`);

export const createCity = (body: CreateCityRequest): Promise<MutationResponse> =>
  api.post<MutationResponse>("/cities", body);

export const updateCity = (id: number, body: UpdateCityRequest): Promise<MutationResponse> =>
  api.put<MutationResponse>(`/cities/${id}`, body);

export const deleteCity = (id: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/cities/${id}`);
