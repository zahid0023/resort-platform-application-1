import { api } from "./api";
import type { Locale, LocaleCount } from "./locales";
import type { FacilityScope } from "./facility-scopes";

export type IconType = "LUCIDE" | "IMAGE" | "SVG" | "EXTERNAL";

export interface FacilityGroupLocale {
  id: number;
  locale: Locale;
  name: string;
  description?: string;
  sort_order: number;
}

export interface FacilityGroupSummary {
  id: number;
  code: string;
  sort_order: number;
  icon_type: IconType;
  icon_value: string;
  icon_meta?: Record<string, unknown>;
  /** The single translation matching Accept-Language (falls back to en, then null) — on GET /{id} and list alike. */
  locale: FacilityGroupLocale | null;
  /** Facility scopes currently assigned to this group — embedded directly on GET /{id} and list alike. */
  facility_scopes: FacilityScope[];
}

export interface FacilityGroup {
  id: number;
  code: string;
  sort_order: number;
  icon_type: IconType;
  icon_value: string;
  icon_meta?: Record<string, unknown>;
  /** The single translation matching Accept-Language (falls back to en, then null) — on GET /{id} and list alike. */
  locale: FacilityGroupLocale | null;
  /** Facility scopes currently assigned to this group — embedded directly on GET /{id} and list alike. */
  facility_scopes: FacilityScope[];
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

export interface FacilityGroupLocaleListResponse {
  data: FacilityGroupLocale[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CreateFacilityGroupLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

// The initial translation is always resolved to the "en" locale server-side —
// there's no locale_id here, and only a single locale entry is accepted at creation.
export interface CreateFacilityGroupRequest {
  code: string;
  facility_scope_ids: number[];
  sort_order?: number;
  icon_type: IconType;
  icon_value?: string;
  icon_meta?: Record<string, unknown>;
  locale: {
    name: string;
    description: string;
    sort_order: number;
  };
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

export interface ListLocalesParams {
  page?: number;
  size?: number;
  localeCode?: string;
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

export const listFacilityGroupLocales = (groupId: number, params: ListLocalesParams = {}): Promise<FacilityGroupLocaleListResponse> => {
  const { page = 0, size = 10, localeCode } = params;
  const query = new URLSearchParams({ page: String(page), size: String(size) });
  if (localeCode) query.set("localeCode", localeCode);
  return api.get<FacilityGroupLocaleListResponse>(`/facility-groups/${groupId}/locales?${query}`);
};

// `codes` here is the authoritative, complete set of locale codes this facility group already has
// a translation for — unlike listFacilityGroupLocales, which is paginated (size 10) and can miss
// codes past the first page. Compare against `localesService.count()`'s codes to know what's still
// addable.
export const countFacilityGroupLocales = (groupId: number): Promise<LocaleCount> =>
  api.get<LocaleCount>(`/facility-groups/${groupId}/locales/count`);

export const addFacilityGroupLocale = (groupId: number, body: CreateFacilityGroupLocaleRequest): Promise<MutationResponse> =>
  api.post<MutationResponse>(`/facility-groups/${groupId}/locales`, body);

export const updateFacilityGroupLocale = (groupId: number, localeId: number, body: UpdateFacilityGroupLocaleRequest): Promise<MutationResponse> =>
  api.put<MutationResponse>(`/facility-groups/${groupId}/locales/${localeId}`, body);

export const removeFacilityGroupLocale = (groupId: number, localeId: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/facility-groups/${groupId}/locales/${localeId}`);
