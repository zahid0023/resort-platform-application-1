import { api } from "./api";

export interface RoomCategoryLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface RoomCategory {
  id: number;
  code: string;
  sort_order: number;
  locales: RoomCategoryLocale[];
}

export interface RoomCategoryListResponse {
  data: RoomCategory[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateRoomCategoryLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateRoomCategoryRequest {
  code: string;
  sort_order: number;
  locales?: CreateRoomCategoryLocaleRequest[];
}

export interface UpdateRoomCategoryRequest {
  sort_order: number;
}

export interface UpdateRoomCategoryLocaleRequest {
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

export const roomCategoriesService = {
  async list(params: ListParams = {}): Promise<RoomCategoryListResponse> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC", code } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort_by,
      sort_dir,
    });
    if (code) query.set("code", code);
    return api.get<RoomCategoryListResponse>(`/room-categories?${query}`);
  },

  async get(id: number): Promise<{ data: RoomCategory }> {
    return api.get<{ data: RoomCategory }>(`/room-categories/${id}`);
  },

  async create(body: CreateRoomCategoryRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/room-categories", body);
  },

  async update(id: number, body: UpdateRoomCategoryRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/room-categories/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/room-categories/${id}`);
  },

  async addLocale(roomCategoryId: number, body: CreateRoomCategoryLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/room-categories/${roomCategoryId}/locales`, body);
  },

  async updateLocale(roomCategoryId: number, localeId: number, body: UpdateRoomCategoryLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/room-categories/${roomCategoryId}/locales/${localeId}`, body);
  },

  async removeLocale(roomCategoryId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/room-categories/${roomCategoryId}/locales/${localeId}`);
  },
};
