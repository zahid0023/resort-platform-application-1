import { api } from "./api";

export type IconType = "LUCIDE" | "IMAGE" | "SVG" | "EXTERNAL";

export interface FacilityLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface FacilitySummary {
  id: number;
  facility_group_id: number;
  code: string;
  sort_order?: number;
  icon_type: IconType;
  icon_value: string;
  icon_meta?: Record<string, unknown>;
  locales: FacilityLocale[];
}

export interface Facility {
  id: number;
  facility_group_id: number;
  code: string;
  sort_order?: number;
  icon_type: IconType;
  icon_value: string;
  icon_meta?: Record<string, unknown>;
  locales: FacilityLocale[];
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

export interface CreateFacilityLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateFacilityRequest {
  code: string;
  sort_order?: number;
  icon_type: IconType;
  icon_value?: string;
  icon_meta?: Record<string, unknown>;
  locales?: CreateFacilityLocaleRequest[];
}

export interface UpdateFacilityRequest {
  sort_order?: number;
  icon_type: IconType;
  icon_value?: string;
  icon_meta?: Record<string, unknown>;
}

export interface UpdateFacilityLocaleRequest {
  name: string;
  description?: string;
  sort_order: number;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

export interface ListParams {
  page?: number;
  size?: number;
  sort_by?: "id" | "code" | "sort_order" | "created_at";
  sort_dir?: "ASC" | "DESC";
}

export const listFacilities = (facilityGroupId: number, params: ListParams = {}): Promise<FacilityListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  return api.get<FacilityListResponse>(`/facility-groups/${facilityGroupId}/facilities?${query.toString()}`);
};

export const getFacility = (facilityGroupId: number, id: number): Promise<{ data: Facility }> =>
  api.get<{ data: Facility }>(`/facility-groups/${facilityGroupId}/facilities/${id}`);

export const createFacility = (facilityGroupId: number, body: CreateFacilityRequest): Promise<MutationResponse> =>
  api.post<MutationResponse>(`/facility-groups/${facilityGroupId}/facilities`, body);

export const updateFacility = (facilityGroupId: number, id: number, body: UpdateFacilityRequest): Promise<MutationResponse> =>
  api.put<MutationResponse>(`/facility-groups/${facilityGroupId}/facilities/${id}`, body);

export const deleteFacility = (facilityGroupId: number, id: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/facility-groups/${facilityGroupId}/facilities/${id}`);

export const getIconTypes = (facilityGroupId: number): Promise<IconType[]> =>
  api.get<IconType[]>(`/facility-groups/${facilityGroupId}/facilities/icon-types`);

export const addFacilityLocale = (facilityGroupId: number, facilityId: number, body: CreateFacilityLocaleRequest): Promise<MutationResponse> =>
  api.post<MutationResponse>(`/facility-groups/${facilityGroupId}/facilities/${facilityId}/locales`, body);

export const updateFacilityLocale = (facilityGroupId: number, facilityId: number, localeId: number, body: UpdateFacilityLocaleRequest): Promise<MutationResponse> =>
  api.put<MutationResponse>(`/facility-groups/${facilityGroupId}/facilities/${facilityId}/locales/${localeId}`, body);

export const removeFacilityLocale = (facilityGroupId: number, facilityId: number, localeId: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/facility-groups/${facilityGroupId}/facilities/${facilityId}/locales/${localeId}`);
