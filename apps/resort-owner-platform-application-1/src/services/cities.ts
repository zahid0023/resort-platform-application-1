import { api } from "./api";

export interface CityLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface City {
  id: number;
  country_id: number;
  code?: string;
  sort_order: number;
  locales: CityLocale[];
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

export const citiesService = {
  list(params: {
    page?: number;
    size?: number;
    sort_by?: string;
    sort_dir?: "ASC" | "DESC";
    code?: string;
    countryId?: number;
  } = {}): Promise<CityListResponse> {
    const q = new URLSearchParams();
    if (params.page !== undefined) q.set("page", String(params.page));
    if (params.size !== undefined) q.set("size", String(params.size));
    if (params.sort_by) q.set("sort_by", params.sort_by);
    if (params.sort_dir) q.set("sort_dir", params.sort_dir);
    if (params.code) q.set("code", params.code);
    if (params.countryId) q.set("countryId", String(params.countryId));
    return api.get<CityListResponse>(`/cities?${q}`);
  },
};

export interface CitySummary {
  id: number;
  name: string;
  country_id: number;
}

interface ListParams {
  page?: number;
  size?: number;
  sort_by?: string;
  sort_dir?: "ASC" | "DESC";
  code?: string;
  countryId?: number;
}

export async function listCities(
  params: ListParams = {},
): Promise<{ data: CitySummary[] }> {
  const {
    page = 0,
    size = 50,
    sort_by = "sortOrder",
    sort_dir = "ASC",
    code,
    countryId,
  } = params;
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort_by,
    sort_dir,
  });
  if (code) query.set("code", code);
  if (countryId) query.set("countryId", String(countryId));
  const res = await api.get<CityListResponse>(`/cities?${query}`);
  return {
    data: res.data.map((c) => ({
      id: c.id,
      name: c.locales[0]?.name ?? c.code ?? String(c.id),
      country_id: c.country_id,
    })),
  };
}
