import { api } from "./api";

export interface PriceTypeSummary {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface PriceType {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface PriceTypeListResponse {
  data: PriceTypeSummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreatePriceTypeRequest {
  code: string;
  name: string;
  description: string;
}

export interface UpdatePriceTypeRequest {
  code?: string;
  name?: string;
  description?: string;
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

export const listPriceTypes = (params: ListParams = {}): Promise<PriceTypeListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  return api.get<PriceTypeListResponse>(`/price-types?${query.toString()}`);
};

export const getPriceType = (id: number): Promise<{ data: PriceType }> =>
  api.get<{ data: PriceType }>(`/price-types/${id}`);

export const createPriceType = (body: CreatePriceTypeRequest): Promise<MutationResponse> =>
  api.post<MutationResponse>("/price-types", body);

export const updatePriceType = (id: number, body: UpdatePriceTypeRequest): Promise<MutationResponse> =>
  api.put<MutationResponse>(`/price-types/${id}`, body);

export const deletePriceType = (id: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/price-types/${id}`);
