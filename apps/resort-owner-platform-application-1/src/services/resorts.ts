import { api } from "./api";
import type { Locale } from "./locales";
import type { Country } from "./countries";
import type { City } from "./cities";

export interface ResortBasicInfoLocale {
  id: number;
  locale: Locale;
  sort_order: number;
  name: string;
  tagline: string;
  short_description?: string;
}

export interface ResortBasicInfo {
  id: number;
  estd: number;
  logo_url?: string;
  /** The single translation matching Accept-Language (falls back to en, then null). */
  locale: ResortBasicInfoLocale | null;
}

export interface ResortAddressLocale {
  id: number;
  locale: Locale;
  address: string;
  sort_order: number;
}

export interface ResortAddress {
  id: number;
  country: Country;
  city: City;
  postal_code?: string;
  lat?: number;
  lon?: number;
  /** The single translation matching Accept-Language (falls back to en, then null). */
  locale: ResortAddressLocale | null;
}

export interface ResortSummary {
  id: number;
  code: string;
}

/** Full resort shape returned by `GET /resorts/{id}` — list endpoints only ever return `ResortSummary`. */
export interface Resort extends ResortSummary {
  basic_info: ResortBasicInfo;
  address: ResortAddress;
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
  // sortBy=id throws 400 — it's only valid as the implicit default when sortBy is omitted entirely.
  sort_by?: "createdAt" | "code";
  sort_dir?: "ASC" | "DESC";
  code?: string;
}

// No `locale_id` — basic info / address are always created in `en`, resolved server-side.
// Additional languages are added afterward via their locale sub-resource endpoints.
export interface CreateResortBasicInfoLocale {
  sort_order: number;
  name: string;
  tagline: string;
  short_description?: string;
}

export interface CreateResortBasicInfo {
  estd: number;
  logo_url?: string;
  locale: CreateResortBasicInfoLocale;
}

export interface CreateResortAddressLocale {
  address: string;
  sort_order: number;
}

export interface CreateResortAddress {
  country_id: number;
  city_id: number;
  postal_code?: string;
  lat?: number;
  lon?: number;
  locale: CreateResortAddressLocale;
}

export interface CreateResortRequest {
  code: string;
  basic_info: CreateResortBasicInfo;
  address: CreateResortAddress;
}

function buildQuery(params: ListParams): URLSearchParams {
  const { page = 0, size = 10, sort_by, sort_dir, code } = params;
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  // Query params bind onto the Java field names via Spring's DataBinder — camelCase, not the
  // snake_case used in JSON request/response bodies.
  if (sort_by) q.set("sortBy", sort_by);
  if (sort_dir) q.set("sortDir", sort_dir);
  if (code) q.set("code", code);
  return q;
}

/** Resort-user endpoint: only resorts the current user has access to. No `code` filter — pagination/sorting only. */
export function listResorts(params: Omit<ListParams, "code"> = {}): Promise<ResortListResponse> {
  return api.get<ResortListResponse>(`/resorts/my-resorts?${buildQuery(params)}`);
}

/** Admin endpoint: all resorts across the platform. */
export function listAllResorts(params: ListParams = {}): Promise<ResortListResponse> {
  return api.get<ResortListResponse>(`/resorts?${buildQuery(params)}`);
}

export function getResort(id: number): Promise<{ data: Resort }> {
  return api.get<{ data: Resort }>(`/resorts/${id}`);
}

export function createResort(body: CreateResortRequest): Promise<MutationResponse> {
  return api.post<MutationResponse>("/resorts", body);
}

export function deleteResort(id: number): Promise<MutationResponse> {
  return api.delete<MutationResponse>(`/resorts/${id}`);
}
