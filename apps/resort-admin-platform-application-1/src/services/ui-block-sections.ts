import { api } from "./api";

export interface UiBlockSectionLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface UiBlockSection {
  id: number;
  code: string;
  sort_order: number;
  locales: UiBlockSectionLocale[];
}

export interface UiBlockSectionListResponse {
  data: UiBlockSection[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateUiBlockSectionLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateUiBlockSectionRequest {
  code: string;
  sort_order: number;
  locales?: CreateUiBlockSectionLocaleRequest[];
}

export interface UpdateUiBlockSectionRequest {
  sort_order: number;
}

export interface UpdateUiBlockSectionLocaleRequest {
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

export const uiBlockSectionsService = {
  async list(params: ListParams = {}): Promise<UiBlockSectionListResponse> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC", code } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort_by,
      sort_dir,
    });
    if (code) query.set("code", code);
    return api.get<UiBlockSectionListResponse>(`/ui-block-sections?${query}`);
  },

  async get(id: number): Promise<{ ui_block_section: UiBlockSection }> {
    return api.get<{ ui_block_section: UiBlockSection }>(`/ui-block-sections/${id}`);
  },

  async create(body: CreateUiBlockSectionRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/ui-block-sections", body);
  },

  async update(id: number, body: UpdateUiBlockSectionRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/ui-block-sections/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/ui-block-sections/${id}`);
  },

  async addLocale(sectionId: number, body: CreateUiBlockSectionLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/ui-block-sections/${sectionId}/locales`, body);
  },

  async updateLocale(sectionId: number, localeId: number, body: UpdateUiBlockSectionLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/ui-block-sections/${sectionId}/locales/${localeId}`, body);
  },

  async removeLocale(sectionId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/ui-block-sections/${sectionId}/locales/${localeId}`);
  },
};
