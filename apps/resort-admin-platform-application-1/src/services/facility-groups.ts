import { api } from "./api";

export interface FacilityGroupSummary {
  id: number;
  code: string;
  name: string;
  description: string;
  sort_order: number;
}

export interface FacilityGroup {
  id: number;
  code: string;
  name: string;
  description: string;
  sort_order: number;
}

export interface FacilityGroupListResponse {
  data: FacilityGroupSummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateFacilityGroupRequest {
  code: string;
  name: string;
  description?: string;
  sort_order?: number;
}

export interface UpdateFacilityGroupRequest {
  code?: string;
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
  sort_by?: "id" | "code" | "name";
  sort_dir?: "ASC" | "DESC";
}

export const listFacilityGroups = (params: ListParams = {}): Promise<FacilityGroupListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  return api.get<FacilityGroupListResponse>(`/facility-groups?${query.toString()}`);
};

export const getFacilityGroup = (id: number): Promise<{ data: FacilityGroup }> =>
  api.get<{ data: FacilityGroup }>(`/facility-groups/${id}`);

export const createFacilityGroup = (body: CreateFacilityGroupRequest): Promise<MutationResponse> =>
  api.post<MutationResponse>("/facility-groups", body);

export const updateFacilityGroup = (id: number, body: UpdateFacilityGroupRequest): Promise<{ data: FacilityGroup }> =>
  api.put<{ data: FacilityGroup }>(`/facility-groups/${id}`, body);

export const deleteFacilityGroup = (id: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/facility-groups/${id}`);
