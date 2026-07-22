import { api } from "./api";

export type IconType = "LUCIDE" | "IMAGE" | "SVG" | "EXTERNAL";

export interface FacilityGroupLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface ScopeAssignmentLocale {
  id: number;
  locale_id: number;
  name: string;
  sort_order: number;
}

export interface ScopeAssignment {
  facility_scope_id: number;
  code: string;
  sort_order: number;
  locales: ScopeAssignmentLocale[];
}

export interface FacilityGroupSummary {
  id: number;
  code: string;
  sort_order: number;
  icon_type: IconType;
  icon_value: string;
  icon_meta?: Record<string, unknown>;
  locales: FacilityGroupLocale[];
}

export interface FacilityGroup {
  id: number;
  code: string;
  sort_order: number;
  icon_type: IconType;
  icon_value: string;
  icon_meta?: Record<string, unknown>;
  locales: FacilityGroupLocale[];
  scope_assignments?: ScopeAssignment[];
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

export interface CreateFacilityGroupLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateFacilityGroupRequest {
  code: string;
  sort_order?: number;
  icon_type: IconType;
  icon_value?: string;
  icon_meta?: Record<string, unknown>;
  scope_ids: number[];
  locales?: CreateFacilityGroupLocaleRequest[];
}

export interface UpdateFacilityGroupRequest {
  sort_order?: number;
  icon_type: IconType;
  icon_value?: string;
  icon_meta?: Record<string, unknown>;
}

export interface UpdateFacilityGroupLocaleRequest {
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
  sort_by?: "id" | "code" | "sortOrder" | "createdAt";
  sort_dir?: "ASC" | "DESC";
  code?: string;
  scope_code?: "RESORT" | "ROOM_CATEGORY" | "ROOM";
}

export const listFacilityGroups = (params: ListParams = {}): Promise<FacilityGroupListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  if (params.code) query.set("code", params.code);
  if (params.scope_code) query.set("scope-code", params.scope_code);
  return api.get<FacilityGroupListResponse>(`/facility-groups?${query.toString()}`);
};

export const getFacilityGroup = (id: number): Promise<{ data: FacilityGroup }> =>
  api.get<{ data: FacilityGroup }>(`/facility-groups/${id}`);

export const createFacilityGroup = (body: CreateFacilityGroupRequest): Promise<MutationResponse> =>
  api.post<MutationResponse>("/facility-groups", body);

export const updateFacilityGroup = (id: number, body: UpdateFacilityGroupRequest): Promise<MutationResponse> =>
  api.put<MutationResponse>(`/facility-groups/${id}`, body);

export const deleteFacilityGroup = (id: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/facility-groups/${id}`);

export const getIconTypes = (): Promise<IconType[]> =>
  api.get<IconType[]>("/facility-groups/icon-types");

export const addFacilityGroupLocale = (groupId: number, body: CreateFacilityGroupLocaleRequest): Promise<MutationResponse> =>
  api.post<MutationResponse>(`/facility-groups/${groupId}/locales`, body);

export const updateFacilityGroupLocale = (groupId: number, localeId: number, body: UpdateFacilityGroupLocaleRequest): Promise<MutationResponse> =>
  api.put<MutationResponse>(`/facility-groups/${groupId}/locales/${localeId}`, body);

export const removeFacilityGroupLocale = (groupId: number, localeId: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/facility-groups/${groupId}/locales/${localeId}`);

export const assignScope = (groupId: number, facilityScopeId: number): Promise<MutationResponse> =>
  api.post<MutationResponse>(`/facility-groups/${groupId}/scope-assignments`, { facility_scope_id: facilityScopeId });

export const unassignScope = (groupId: number, facilityScopeId: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/facility-groups/${groupId}/scope-assignments/${facilityScopeId}`);

export const listScopeAssignments = (groupId: number): Promise<ScopeAssignment[]> =>
  api.get<ScopeAssignment[]>(`/facility-groups/${groupId}/scope-assignments`);
