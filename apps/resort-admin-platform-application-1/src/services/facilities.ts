import { api } from "./api";
import type { Locale, LocaleCount } from "./locales";
import type { FacilityGroupSummary } from "./facility-groups";
import type { FacilityScope } from "./facility-scopes";

export type IconType = "LUCIDE" | "IMAGE" | "SVG" | "EXTERNAL";

export interface FacilityLocale {
  id: number;
  locale: Locale;
  name: string;
  description?: string;
  sort_order: number;
}

export interface FacilitySummary {
  id: number;
  /** Every facility group this facility belongs to — read-only here; managed afterward via
   * `POST/DELETE /facilities/{facility-id}/group-assignments` under this facility resource. */
  facility_groups: FacilityGroupSummary[];
  code: string;
  sort_order: number;
  icon_type: IconType;
  icon_value?: string;
  icon_meta?: Record<string, unknown>;
  /** The single translation matching Accept-Language (falls back to en, then null) — on GET /{id} and list alike. */
  locale: FacilityLocale | null;
  /** Every facility scope this facility is assigned to — read-only here; managed afterward via
   * `POST/DELETE /facilities/{facility-id}/scope-assignments` under this facility resource. */
  facility_scopes: FacilityScope[];
}

export interface Facility {
  id: number;
  /** Every facility group this facility belongs to — read-only here; managed afterward via
   * `POST/DELETE /facilities/{facility-id}/group-assignments` under this facility resource. */
  facility_groups: FacilityGroupSummary[];
  code: string;
  sort_order: number;
  icon_type: IconType;
  icon_value?: string;
  icon_meta?: Record<string, unknown>;
  /** The single translation matching Accept-Language (falls back to en, then null) — on GET /{id} and list alike. */
  locale: FacilityLocale | null;
  /** Every facility scope this facility is assigned to — read-only here; managed afterward via
   * `POST/DELETE /facilities/{facility-id}/scope-assignments` under this facility resource. */
  facility_scopes: FacilityScope[];
}

export interface FacilityListResponse {
  data: FacilitySummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  sortable_fields?: string[];
  searchable_fields?: string[];
}

export interface FacilityLocaleListResponse {
  data: FacilityLocale[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CreateFacilityLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

// The initial translation is always resolved to the "en" locale server-side —
// there's no locale_id here, and only a single locale entry is accepted at creation.
export interface CreateFacilityRequest {
  code: string;
  facility_group_ids: number[];
  facility_scope_ids: number[];
  sort_order: number;
  icon_type: IconType;
  icon_value?: string;
  icon_meta?: Record<string, unknown>;
  locale: {
    name: string;
    description: string;
    sort_order: number;
  };
}

export interface UpdateFacilityRequest {
  sort_order: number;
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
  // `id` is not a selectable sortBy value — it's only valid as the implicit default when sortBy
  // is omitted entirely (passing ?sortBy=id throws 400 INVALID_ARGUMENT).
  sort_by?: "createdAt" | "sortOrder" | "code" | "name";
  sort_dir?: "ASC" | "DESC";
  code?: string;
  facilityGroupId?: number;
  name?: string;
}

export interface ListLocalesParams {
  page?: number;
  size?: number;
  localeCode?: string;
}

// Query params bind onto FacilityFilterRequest's Java field names via Spring's DataBinder —
// camelCase (sortBy/sortDir), not the snake_case used in JSON request/response bodies.
export const listFacilities = (params: ListParams = {}): Promise<FacilityListResponse> => {
  const { page = 0, size = 10, sort_by, sort_dir, code, facilityGroupId, name } = params;
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (sort_by) query.set("sortBy", sort_by);
  if (sort_dir) query.set("sortDir", sort_dir);
  if (code) query.set("code", code);
  if (facilityGroupId !== undefined) query.set("facilityGroupId", String(facilityGroupId));
  if (name) query.set("name", name);
  return api.get<FacilityListResponse>(`/facilities?${query.toString()}`);
};

export const getFacility = (id: number): Promise<{ data: Facility }> =>
  api.get<{ data: Facility }>(`/facilities/${id}`);

export const createFacility = (body: CreateFacilityRequest): Promise<MutationResponse> =>
  api.post<MutationResponse>("/facilities", body);

export const updateFacility = (id: number, body: UpdateFacilityRequest): Promise<MutationResponse> =>
  api.put<MutationResponse>(`/facilities/${id}`, body);

export const deleteFacility = (id: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/facilities/${id}`);

export const listFacilityLocales = (facilityId: number, params: ListLocalesParams = {}): Promise<FacilityLocaleListResponse> => {
  const { page = 0, size = 10, localeCode } = params;
  const query = new URLSearchParams({ page: String(page), size: String(size) });
  if (localeCode) query.set("localeCode", localeCode);
  return api.get<FacilityLocaleListResponse>(`/facilities/${facilityId}/locales?${query}`);
};

// `codes` here is the authoritative, complete set of locale codes this facility already has a
// translation for — unlike listFacilityLocales, which is paginated (size 10) and can miss codes
// past the first page. Compare against `localesService.count()`'s codes to know what's still addable.
export const countFacilityLocales = (facilityId: number): Promise<LocaleCount> =>
  api.get<LocaleCount>(`/facilities/${facilityId}/locales/count`);

export const addFacilityLocale = (facilityId: number, body: CreateFacilityLocaleRequest): Promise<MutationResponse> =>
  api.post<MutationResponse>(`/facilities/${facilityId}/locales`, body);

export const updateFacilityLocale = (facilityId: number, localeId: number, body: UpdateFacilityLocaleRequest): Promise<MutationResponse> =>
  api.put<MutationResponse>(`/facilities/${facilityId}/locales/${localeId}`, body);

export const removeFacilityLocale = (facilityId: number, localeId: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/facilities/${facilityId}/locales/${localeId}`);

export const assignFacilityScope = (facilityId: number, facilityScopeId: number): Promise<MutationResponse> =>
  api.post<MutationResponse>(`/facilities/${facilityId}/scope-assignments`, { facility_scope_id: facilityScopeId });

// Identified by the facility scope's own id, not an assignment row id — a facility can have at most
// one active assignment to a given scope, so (facility-id, facility-scope-id) is always enough.
export const unassignFacilityScope = (facilityId: number, facilityScopeId: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/facilities/${facilityId}/scope-assignments/${facilityScopeId}`);

// The facility group being assigned must itself be scoped to every facility scope this facility is
// currently assigned to — violating that returns 409 CONFLICT, same as assigning a duplicate group.
export const assignFacilityGroup = (facilityId: number, facilityGroupId: number): Promise<MutationResponse> =>
  api.post<MutationResponse>(`/facilities/${facilityId}/group-assignments`, { facility_group_id: facilityGroupId });

// Identified by the facility group's own id, not an assignment row id — a facility can have at most
// one active assignment to a given group, so (facility-id, facility-group-id) is always enough.
// Unassigning a facility's only remaining group is allowed — it can end up with zero groups.
export const unassignFacilityGroup = (facilityId: number, facilityGroupId: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/facilities/${facilityId}/group-assignments/${facilityGroupId}`);
