import { api } from "./api";
import type { Locale } from "./locales";

export interface CountryLocale {
  id: number;
  locale: Locale;
  name: string;
  description?: string;
  sort_order: number;
}

export interface Country {
  id: number;
  code: string;
  iso3_code: string;
  phone_code: string;
  /** URL of the uploaded flag image, or "" if none has been uploaded. */
  flag_url: string;
  sort_order: number;
  /** The single translation matching Accept-Language (falls back to en, then null) — on GET /{id} and list alike. */
  locale: CountryLocale | null;
}

export interface CountryListResponse {
  data: Country[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CountrySummary {
  id: number;
  name: string;
}

interface ListParams {
  page?: number;
  size?: number;
  // sortBy=id throws 400 — it's only valid as the implicit default when sortBy is omitted entirely.
  sort_by?: "createdAt" | "code" | "iso3Code" | "phoneCode" | "name";
  sort_dir?: "ASC" | "DESC";
  // `code` is accepted by the backend but not currently wired into search predicates — omit it as a filter.
  iso3Code?: string;
  phoneCode?: string;
  name?: string;
}

export const countriesService = {
  list(params: ListParams = {}): Promise<CountryListResponse> {
    const q = new URLSearchParams();
    if (params.page !== undefined) q.set("page", String(params.page));
    if (params.size !== undefined) q.set("size", String(params.size));
    // Query params bind onto the Java field names via Spring's DataBinder — camelCase, not the
    // snake_case used in JSON request/response bodies.
    if (params.sort_by) q.set("sortBy", params.sort_by);
    if (params.sort_dir) q.set("sortDir", params.sort_dir);
    if (params.iso3Code) q.set("iso3Code", params.iso3Code);
    if (params.phoneCode) q.set("phoneCode", params.phoneCode);
    if (params.name) q.set("name", params.name);
    return api.get<CountryListResponse>(`/countries?${q}`);
  },
};

export async function listCountries(
  params: ListParams = {},
): Promise<{ data: CountrySummary[] }> {
  const {
    page = 0,
    size = 50,
    sort_by,
    sort_dir = "ASC",
    iso3Code,
    phoneCode,
    name,
  } = params;
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
    sortDir: sort_dir,
  });
  if (sort_by) query.set("sortBy", sort_by);
  if (iso3Code) query.set("iso3Code", iso3Code);
  if (phoneCode) query.set("phoneCode", phoneCode);
  if (name) query.set("name", name);
  const res = await api.get<CountryListResponse>(`/countries?${query}`);
  return {
    data: res.data.map((c) => ({
      id: c.id,
      name: c.locale?.name ?? c.code,
    })),
  };
}
