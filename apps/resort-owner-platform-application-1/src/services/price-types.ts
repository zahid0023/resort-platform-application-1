import { api } from "./api";

export interface PriceTypeSummary {
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

export const listPriceTypes = (params: { page?: number; size?: number } = {}): Promise<PriceTypeListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  query.set("sort_by", "name");
  query.set("sort_dir", "ASC");
  return api.get<PriceTypeListResponse>(`/price-types?${query.toString()}`);
};
