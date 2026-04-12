import { api } from "./api";

export interface CountrySummary {
  id: number;
  code: string;
  name: string;
}

export interface Country {
  id: number;
  code: string;
  name: string;
}

export interface CountryListResponse {
  data: CountrySummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateCountryRequest {
  code?: string;
  name?: string;
}

export interface UpdateCountryRequest {
  code?: string;
  name?: string;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

export interface ListParams {
  page?: number;
  size?: number;
  sort_by?: "id" | "code" | "name";
  sort_dir?: "ASC" | "DESC";
}

export const listCountries = (params: ListParams = {}): Promise<CountryListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  return api.get<CountryListResponse>(`/countries?${query.toString()}`);
};

export const getCountry = (id: number) =>
  api.get<{ data: Country }>(`/countries/${id}`);

export const createCountry = (body: CreateCountryRequest) =>
  api.post<MutationResponse>("/countries", body);

export const updateCountry = (id: number, body: UpdateCountryRequest) =>
  api.put<MutationResponse>(`/countries/${id}`, body);

export const deleteCountry = (id: number) =>
  api.delete<MutationResponse>(`/countries/${id}`);
