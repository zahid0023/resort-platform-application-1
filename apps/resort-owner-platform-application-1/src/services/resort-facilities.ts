import { api } from "./api";

export interface ResortFacilitySummary {
  id: number;
  resort_facility_group_id: number;
  facility_id: number;
  name: string;
  icon: string;
  value: string;
}

export interface ResortFacility {
  id: number;
  resort_facility_group_id: number;
  facility_id: number;
  name: string;
  description: string;
  icon: string;
  value: string;
}

export interface ResortFacilityListResponse {
  data: ResortFacilitySummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateResortFacilityRequest {
  facility_id: number;
  name?: string;
  description?: string;
  icon?: string;
  value?: string;
}

export interface BulkCreateResortFacilitiesRequest {
  facilities: CreateResortFacilityRequest[];
}

export interface UpdateResortFacilityRequest {
  name?: string;
  description?: string;
  icon?: string;
  value?: string;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

const base = (resortId: string | number, groupId: string | number) =>
  `/resorts/${resortId}/resort-facility-groups/${groupId}/resort-facilities`;

export const listResortFacilities = (
  resortId: string | number,
  groupId: string | number,
  params: { page?: number; size?: number; sort_by?: "id" | "name"; sort_dir?: "ASC" | "DESC" } = {}
): Promise<ResortFacilityListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  return api.get<ResortFacilityListResponse>(`${base(resortId, groupId)}?${query.toString()}`);
};

export const getResortFacility = (
  resortId: string | number,
  groupId: string | number,
  id: number
): Promise<{ data: ResortFacility }> =>
  api.get<{ data: ResortFacility }>(`${base(resortId, groupId)}/${id}`);

export const bulkCreateResortFacilities = (
  resortId: string | number,
  groupId: string | number,
  body: BulkCreateResortFacilitiesRequest
): Promise<MutationResponse> =>
  api.post<MutationResponse>(`${base(resortId, groupId)}/bulk`, body);

export const updateResortFacility = (
  resortId: string | number,
  groupId: string | number,
  id: number,
  body: UpdateResortFacilityRequest
): Promise<MutationResponse> =>
  api.put<MutationResponse>(`${base(resortId, groupId)}/${id}`, body);

export const deleteResortFacility = (
  resortId: string | number,
  groupId: string | number,
  id: number
): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`${base(resortId, groupId)}/${id}`);
