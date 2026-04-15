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

export interface FacilityListResponse {
  data: FacilitySummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export const listFacilities = (params: { page?: number; size?: number } = {}): Promise<FacilityListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  query.set("sort_by", "name");
  query.set("sort_dir", "ASC");
  return api.get<FacilityListResponse>(`/facilities?${query.toString()}`);
};
