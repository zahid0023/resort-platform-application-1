import { api } from "./api";

export interface RoomCategoryLocale {
  id: number;
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface RoomCategorySummary {
  id: number;
  code: string;
  sort_order: number;
  locales: RoomCategoryLocale[];
}

export interface RoomCategory {
  id: number;
  code: string;
  sort_order: number;
  locales: RoomCategoryLocale[];
}

export interface RoomCategoryListResponse {
  data: RoomCategorySummary[];
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
  sort_by?: "id" | "code" | "sortOrder" | "createdAt";
  sort_dir?: "ASC" | "DESC";
}

export const listRoomCategories = (params: ListParams = {}): Promise<RoomCategoryListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  return api.get<RoomCategoryListResponse>(`/room-categories?${query.toString()}`);
};

export const getRoomCategory = (id: number): Promise<{ room_category: RoomCategory }> =>
  api.get<{ room_category: RoomCategory }>(`/room-categories/${id}`);

export const createRoomCategory = (body: CreateRoomCategoryRequest): Promise<MutationResponse> =>
  api.post<MutationResponse>("/room-categories", body);

export const updateRoomCategory = (id: number, body: UpdateRoomCategoryRequest): Promise<MutationResponse> =>
  api.put<MutationResponse>(`/room-categories/${id}`, body);

export const deleteRoomCategory = (id: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/room-categories/${id}`);

export const addRoomCategoryLocale = (categoryId: number, body: CreateRoomCategoryLocaleRequest): Promise<MutationResponse> =>
  api.post<MutationResponse>(`/room-categories/${categoryId}/locales`, body);

export const updateRoomCategoryLocale = (categoryId: number, localeId: number, body: UpdateRoomCategoryLocaleRequest): Promise<MutationResponse> =>
  api.put<MutationResponse>(`/room-categories/${categoryId}/locales/${localeId}`, body);

export const removeRoomCategoryLocale = (categoryId: number, localeId: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/room-categories/${categoryId}/locales/${localeId}`);
