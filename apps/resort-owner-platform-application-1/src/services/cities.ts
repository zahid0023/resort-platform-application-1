import { api } from "./api";
import type { Locale } from "./locales";
import type { CountryLocale } from "./countries";

export interface CityLocale {
  id: number;
  locale: Locale;
  name: string;
  description?: string;
  sort_order: number;
}

// Minimal embedded parent summary — the country's own single Accept-Language-matched translation.
export interface CityCountry {
  id: number;
  code: string;
  iso3_code: string;
  phone_code: string;
  sort_order: number;
  locale: CountryLocale | null;
}

export interface City {
  id: number;
  country: CityCountry;
  code: string;
  sort_order: number;
  /** The single translation matching Accept-Language (falls back to en, then null) — on GET /{id} and list alike. */
  locale: CityLocale | null;
}

export interface CityListResponse {
  data: City[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

interface ListParams {
  page?: number;
  size?: number;
  // sortBy=id throws 400 — it's only valid as the implicit default when sortBy is omitted entirely.
  sort_by?: "createdAt" | "sortOrder" | "code" | "name";
  sort_dir?: "ASC" | "DESC";
  code?: string;
  countryId?: number;
  name?: string;
}

export const citiesService = {
  list(params: ListParams = {}): Promise<CityListResponse> {
    const q = new URLSearchParams();
    if (params.page !== undefined) q.set("page", String(params.page));
    if (params.size !== undefined) q.set("size", String(params.size));
    // Query params bind onto the Java field names via Spring's DataBinder — camelCase, not the
    // snake_case used in JSON request/response bodies.
    if (params.sort_by) q.set("sortBy", params.sort_by);
    if (params.sort_dir) q.set("sortDir", params.sort_dir);
    if (params.code) q.set("code", params.code);
    if (params.countryId != null) q.set("countryId", String(params.countryId));
    if (params.name) q.set("name", params.name);
    return api.get<CityListResponse>(`/cities?${q}`);
  },
};

export interface CitySummary {
  id: number;
  name: string;
  country_id: number;
}

export async function listCities(
  params: ListParams = {},
): Promise<{ data: CitySummary[] }> {
  const {
    page = 0,
    size = 50,
    sort_by,
    sort_dir = "ASC",
    code,
    countryId,
    name,
  } = params;
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
    sortDir: sort_dir,
  });
  if (sort_by) query.set("sortBy", sort_by);
  if (code) query.set("code", code);
  if (countryId != null) query.set("countryId", String(countryId));
  if (name) query.set("name", name);
  const res = await api.get<CityListResponse>(`/cities?${query}`);
  return {
    data: res.data.map((c) => ({
      id: c.id,
      name: c.locale?.name ?? c.code ?? String(c.id),
      country_id: c.country.id,
    })),
  };
}
