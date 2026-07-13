import { api } from "./api";

export interface ResortBasicInfoSummary {
  id: number;
  resort_id: number;
  code: string;
  sort_order: number;
  estd: number;
  country_id: number;
  city_id: number;
  logo_url?: string;
  lat?: number;
  lon?: number;
  locales?: {
    locale_id: number;
    name: string;
    tagline: string;
    short_description?: string;
    address?: string;
  }[];
}

export interface ResortSummary {
  id: number;
  code: string;
  resort_basic_info?: ResortBasicInfoSummary;
}

export interface ResortListResponse {
  data: ResortSummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

export interface ListParams {
  page?: number;
  size?: number;
  sort_by?: string;
  sort_dir?: "ASC" | "DESC";
  code?: string;
}

export interface CreateResortBasicInfoLocale {
  locale_id: number;
  sort_order: number;
  name: string;
  tagline: string;
  short_description?: string;
  address?: string;
}

export interface CreateResortBasicInfo {
  code: string;
  sort_order: number;
  estd: number;
  country_id: number;
  city_id: number;
  logo_url?: string;
  lat?: number;
  lon?: number;
  locales?: CreateResortBasicInfoLocale[];
}

export interface CreateResortContact {
  contact_type_id: number;
  communication_channel_id: number;
  contact_value: string;
  is_primary: boolean;
  sort_order: number;
}

export interface CreateResortRequest {
  code: string;
  basic_info?: CreateResortBasicInfo;
  contacts?: CreateResortContact[];
}

function buildQuery(params: ListParams): URLSearchParams {
  const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC", code } = params;
  const q = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
  if (code) q.set("code", code);
  return q;
}

/** Resort-user endpoint: only resorts the current user has access to. */
export function listResorts(params: ListParams = {}): Promise<ResortListResponse> {
  return api.get<ResortListResponse>(`/resorts/my-resorts?${buildQuery(params)}`);
}

/** Admin endpoint: all resorts across the platform. */
export function listAllResorts(params: ListParams = {}): Promise<ResortListResponse> {
  return api.get<ResortListResponse>(`/resorts?${buildQuery(params)}`);
}

export function getResort(id: number): Promise<{ data: ResortSummary }> {
  return api.get<{ data: ResortSummary }>(`/resorts/${id}`);
}

export function createResort(body: CreateResortRequest): Promise<MutationResponse> {
  return api.post<MutationResponse>("/resorts", body);
}

export function deleteResort(id: number): Promise<MutationResponse> {
  return api.delete<MutationResponse>(`/resorts/${id}`);
}
