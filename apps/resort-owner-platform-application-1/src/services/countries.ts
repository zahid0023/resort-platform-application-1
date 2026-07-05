import { api } from "./api";

interface CountryLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

interface Country {
  id: number;
  code: string;
  iso3_code?: string;
  phone_code?: string;
  sort_order: number;
  locales: CountryLocale[];
}

interface CountryListResponse {
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
  sort_by?: string;
  sort_dir?: "ASC" | "DESC";
  code?: string;
  iso3Code?: string;
  phoneCode?: string;
}

export async function listCountries(
  params: ListParams = {},
): Promise<{ data: CountrySummary[] }> {
  const {
    page = 0,
    size = 50,
    sort_by = "sortOrder",
    sort_dir = "ASC",
    code,
    iso3Code,
    phoneCode,
  } = params;
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort_by,
    sort_dir,
  });
  if (code) query.set("code", code);
  if (iso3Code) query.set("iso3Code", iso3Code);
  if (phoneCode) query.set("phoneCode", phoneCode);
  const res = await api.get<CountryListResponse>(`/countries?${query}`);
  return {
    data: res.data.map((c) => ({
      id: c.id,
      name: c.locales[0]?.name ?? c.code,
    })),
  };
}
