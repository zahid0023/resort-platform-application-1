import { api } from "./api";

export interface ResortFacilityGroupSummary {
  id: number;
  resort_id: number;
  facility_group_id: number;
  name: string;
  description: string;
  sort_order: number;
}

export interface ResortFacilityGroupListResponse {
  data: ResortFacilityGroupSummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateResortFacilityGroupRequest {
  facility_group_id: number;
  name: string;
  description: string;
  sort_order: number;
}

export interface UpdateResortFacilityGroupRequest {
  name?: string;
  description?: string;
  sort_order?: number;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

export interface ListParams {
  page?: number;
  size?: number;
  sort_by?: "id" | "name" | "sortOrder";
  sort_dir?: "ASC" | "DESC";
}

const base = (resortId: number | string) =>
  `/resorts/${resortId}/resort-facility-groups`;

export const listResortFacilityGroups = (
  resortId: number | string,
  params: ListParams = {}
): Promise<ResortFacilityGroupListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  return api.get<ResortFacilityGroupListResponse>(`${base(resortId)}?${query.toString()}`);
};

export const getResortFacilityGroup = (
  resortId: number | string,
  id: number
): Promise<{ data: ResortFacilityGroupSummary }> =>
  api.get<{ data: ResortFacilityGroupSummary }>(`${base(resortId)}/${id}`);

export const createResortFacilityGroup = (
  resortId: number | string,
  body: CreateResortFacilityGroupRequest
): Promise<MutationResponse> =>
  api.post<MutationResponse>(base(resortId), body);

export const updateResortFacilityGroup = (
  resortId: number | string,
  id: number,
  body: UpdateResortFacilityGroupRequest
): Promise<MutationResponse> =>
  api.put<MutationResponse>(`${base(resortId)}/${id}`, body);

export const deleteResortFacilityGroup = (
  resortId: number | string,
  id: number
): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`${base(resortId)}/${id}`);
