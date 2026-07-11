import { api } from "./api";

export interface ContactTypeLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface ContactType {
  id: number;
  code: string;
  sort_order: number;
  locales: ContactTypeLocale[];
}

export interface ContactTypeListResponse {
  data: ContactType[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateContactTypeLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateContactTypeRequest {
  code: string;
  sort_order: number;
  locales?: CreateContactTypeLocaleRequest[];
}

export interface UpdateContactTypeRequest {
  sort_order: number;
}

export interface UpdateContactTypeLocaleRequest {
  name: string;
  description?: string;
  sort_order: number;
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

export const contactTypesService = {
  async list(params: ListParams = {}): Promise<ContactTypeListResponse> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC", code } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    if (code) query.set("code", code);
    return api.get<ContactTypeListResponse>(`/contact-types?${query}`);
  },

  async get(id: number): Promise<{ contact_type: ContactType }> {
    return api.get<{ contact_type: ContactType }>(`/contact-types/${id}`);
  },

  async create(body: CreateContactTypeRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/contact-types", body);
  },

  async update(id: number, body: UpdateContactTypeRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/contact-types/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/contact-types/${id}`);
  },

  async addLocale(contactTypeId: number, body: CreateContactTypeLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/contact-types/${contactTypeId}/locales`, body);
  },

  async updateLocale(contactTypeId: number, localeId: number, body: UpdateContactTypeLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/contact-types/${contactTypeId}/locales/${localeId}`, body);
  },

  async removeLocale(contactTypeId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/contact-types/${contactTypeId}/locales/${localeId}`);
  },
};
