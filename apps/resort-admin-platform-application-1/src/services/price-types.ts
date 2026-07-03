import { api } from "./api";

export interface PriceTypeLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
  purpose?: string;
  usage_example?: string;
}

export interface PriceType {
  id: number;
  code: string;
  sort_order: number;
  locales: PriceTypeLocale[];
}

export interface PriceTypeListResponse {
  data: PriceType[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreatePriceTypeLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
  purpose?: string;
  usage_example?: string;
}

export interface CreatePriceTypeRequest {
  code: string;
  sort_order: number;
  locales?: CreatePriceTypeLocaleRequest[];
}

export interface UpdatePriceTypeRequest {
  sort_order: number;
}

export interface UpdatePriceTypeLocaleRequest {
  name: string;
  description?: string;
  sort_order: number;
  purpose?: string;
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

export const priceTypesService = {
  async list(params: ListParams = {}): Promise<PriceTypeListResponse> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC", code } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort_by,
      sort_dir,
    });
    if (code) query.set("code", code);
    return api.get<PriceTypeListResponse>(`/price-types?${query}`);
  },

  async get(id: number): Promise<{ price_type: PriceType }> {
    return api.get<{ price_type: PriceType }>(`/price-types/${id}`);
  },

  async create(body: CreatePriceTypeRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/price-types", body);
  },

  async update(id: number, body: UpdatePriceTypeRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/price-types/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/price-types/${id}`);
  },

  async addLocale(priceTypeId: number, body: CreatePriceTypeLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/price-types/${priceTypeId}/locales`, body);
  },

  async updateLocale(priceTypeId: number, localeId: number, body: UpdatePriceTypeLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/price-types/${priceTypeId}/locales/${localeId}`, body);
  },

  async removeLocale(priceTypeId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/price-types/${priceTypeId}/locales/${localeId}`);
  },
};
