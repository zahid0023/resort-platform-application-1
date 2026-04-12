import { api } from "./api";

export interface FacilitySummary {
  id: number;
  facility_group_id: number;
  code: string;
  name: string;
  description: string;
  type: string;
  icon: string;
}

export interface Facility {
  id: number;
  facility_group_id: number;
  code: string;
  name: string;
  description: string;
  type: string;
  icon: string;
}

export interface FacilityListResponse {
  data: FacilitySummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateFacilityRequest {
  facility_group_id: number;
  code: string;
  name: string;
  description?: string;
  type: string;
  icon?: string;
}

export interface UpdateFacilityRequest {
  facility_group_id?: number;
  code?: string;
  name?: string;
  description?: string;
  type?: string;
  icon?: string;
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

export const listFacilities = (params: ListParams = {}): Promise<FacilityListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  return api.get<FacilityListResponse>(`/facilities?${query.toString()}`);
};

export const getFacility = (id: number): Promise<{ data: Facility }> =>
  api.get<{ data: Facility }>(`/facilities/${id}`);

export const createFacility = (body: CreateFacilityRequest): Promise<MutationResponse> =>
  api.post<MutationResponse>("/facilities", body);

export const updateFacility = (id: number, body: UpdateFacilityRequest): Promise<{ data: Facility }> =>
  api.put<{ data: Facility }>(`/facilities/${id}`, body);

export const deleteFacility = (id: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/facilities/${id}`);
