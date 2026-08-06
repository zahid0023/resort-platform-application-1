import { api } from "./api";
import type { Locale, LocaleCount } from "./locales";
import type { FacilityGroup } from "./facility-groups";

export interface FacilityScopeLocale {
  id: number;
  locale: Locale;
  name: string;
  description?: string;
  sort_order: number;
}

export interface FacilityScope {
  id: number;
  code: string;
  sort_order: number;
  /** The single translation matching Accept-Language (falls back to en, then null) — on GET /{id} and list alike. */
  locale: FacilityScopeLocale | null;
}

export interface FacilityScopeListResponse {
  data: FacilityScope[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface FacilityScopeLocaleListResponse {
  data: FacilityScopeLocale[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CreateFacilityScopeLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

// The initial translation is always resolved to the "en" locale server-side —
// there's no locale_id here, and only a single locale entry is accepted at creation.
export interface CreateFacilityScopeRequest {
  code: string;
  sort_order: number;
  locale: {
    name: string;
    description: string;
    sort_order: number;
  };
}

export interface UpdateFacilityScopeRequest {
  sort_order: number;
}

export interface UpdateFacilityScopeLocaleRequest {
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
  // sortBy=id throws 400 — it's only valid as the implicit default when sortBy is omitted entirely.
  sort_by?: "createdAt" | "code" | "sortOrder";
  sort_dir?: "ASC" | "DESC";
  code?: string;
  name?: string;
}

export interface ListLocalesParams {
  page?: number;
  size?: number;
  localeCode?: string;
}

export interface FacilityGroupScopeAssignment {
  id: number;
  facility_group: FacilityGroup;
}

export interface FacilityGroupScopeAssignmentListResponse {
  data: FacilityGroupScopeAssignment[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  sortable_fields?: string[] | null;
  searchable_fields?: string[] | null;
}

export interface ListGroupAssignmentsParams {
  page?: number;
  size?: number;
}

export const facilityScopesService = {
  async list(params: ListParams = {}): Promise<FacilityScopeListResponse> {
    const { page = 0, size = 10, sort_by, sort_dir = "ASC", code, name } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sortDir: sort_dir,
    });
    if (sort_by) query.set("sortBy", sort_by);
    if (code) query.set("code", code);
    if (name) query.set("name", name);
    return api.get<FacilityScopeListResponse>(`/facility-scopes?${query}`);
  },

  async get(id: number): Promise<{ data: FacilityScope }> {
    return api.get<{ data: FacilityScope }>(`/facility-scopes/${id}`);
  },

  async listLocales(facilityScopeId: number, params: ListLocalesParams = {}): Promise<FacilityScopeLocaleListResponse> {
    const { page = 0, size = 10, localeCode } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (localeCode) query.set("localeCode", localeCode);
    return api.get<FacilityScopeLocaleListResponse>(`/facility-scopes/${facilityScopeId}/locales?${query}`);
  },

  // `codes` here is the authoritative, complete set of locale codes this facility scope already has
  // a translation for — unlike listLocales, which is paginated (size 10) and can miss codes past the
  // first page. Compare against `localesService.count()`'s codes to know what's still addable.
  async countLocales(facilityScopeId: number): Promise<LocaleCount> {
    return api.get<LocaleCount>(`/facility-scopes/${facilityScopeId}/locales/count`);
  },

  async create(body: CreateFacilityScopeRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/facility-scopes", body);
  },

  async update(id: number, body: UpdateFacilityScopeRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/facility-scopes/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/facility-scopes/${id}`);
  },

  async addLocale(facilityScopeId: number, body: CreateFacilityScopeLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/facility-scopes/${facilityScopeId}/locales`, body);
  },

  async updateLocale(facilityScopeId: number, localeId: number, body: UpdateFacilityScopeLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/facility-scopes/${facilityScopeId}/locales/${localeId}`, body);
  },

  async removeLocale(facilityScopeId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/facility-scopes/${facilityScopeId}/locales/${localeId}`);
  },

  async listGroupAssignments(facilityScopeId: number, params: ListGroupAssignmentsParams = {}): Promise<FacilityGroupScopeAssignmentListResponse> {
    const { page = 0, size = 10 } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    return api.get<FacilityGroupScopeAssignmentListResponse>(`/facility-scopes/${facilityScopeId}/group-assignments?${query}`);
  },

  async assignGroup(facilityScopeId: number, facilityGroupId: number): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/facility-scopes/${facilityScopeId}/group-assignments`, { facility_group_id: facilityGroupId });
  },

  async unassignGroup(facilityScopeId: number, assignmentId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/facility-scopes/${facilityScopeId}/group-assignments/${assignmentId}`);
  },
};
