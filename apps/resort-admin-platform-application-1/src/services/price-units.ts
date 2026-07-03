import { api } from "./api";

export interface PriceUnitLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
  calculation_method?: string;
  usage_example?: string;
}

export interface PriceUnit {
  id: number;
  code: string;
  sort_order: number;
  locales: PriceUnitLocale[];
}

export interface PriceUnitListResponse {
  data: PriceUnit[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreatePriceUnitLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
  calculation_method?: string;
  usage_example?: string;
}

export interface CreatePriceUnitRequest {
  code: string;
  sort_order: number;
  locales?: CreatePriceUnitLocaleRequest[];
}

export interface UpdatePriceUnitRequest {
  sort_order: number;
}

export interface UpdatePriceUnitLocaleRequest {
  name: string;
  description?: string;
  sort_order: number;
  calculation_method?: string;
  usage_example?: string;
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

export const priceUnitsService = {
  async list(params: ListParams = {}): Promise<PriceUnitListResponse> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC", code } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort_by,
      sort_dir,
    });
    if (code) query.set("code", code);
    return api.get<PriceUnitListResponse>(`/price-units?${query}`);
  },

  async get(id: number): Promise<{ price_unit: PriceUnit }> {
    return api.get<{ price_unit: PriceUnit }>(`/price-units/${id}`);
  },

  async create(body: CreatePriceUnitRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/price-units", body);
  },

  async update(id: number, body: UpdatePriceUnitRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/price-units/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/price-units/${id}`);
  },

  async addLocale(priceUnitId: number, body: CreatePriceUnitLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/price-units/${priceUnitId}/locales`, body);
  },

  async updateLocale(priceUnitId: number, localeId: number, body: UpdatePriceUnitLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/price-units/${priceUnitId}/locales/${localeId}`, body);
  },

  async removeLocale(priceUnitId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/price-units/${priceUnitId}/locales/${localeId}`);
  },
};
