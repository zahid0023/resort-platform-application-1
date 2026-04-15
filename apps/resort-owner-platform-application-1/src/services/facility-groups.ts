import { api } from "./api";

export interface FacilityGroupSummary {
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

export const listFacilityGroups = (params: { page?: number; size?: number } = {}): Promise<FacilityGroupListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  query.set("sort_by", "sort_order");
  query.set("sort_dir", "ASC");
  return api.get<FacilityGroupListResponse>(`/facility-groups?${query.toString()}`);
};
