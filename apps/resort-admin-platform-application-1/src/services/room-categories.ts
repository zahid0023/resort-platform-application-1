import { api } from "./api";

export interface RoomCategorySummary {
  id: number;
  code: string;
  name: string;
  description: string;
  sort_order: number;
}

export interface RoomCategory {
  id: number;
  code: string;
  name: string;
  description: string;
  sort_order: number;
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

export interface CreateRoomCategoryRequest {
  code: string;
  name: string;
  description: string;
  sort_order?: number;
}

export interface UpdateRoomCategoryRequest {
  code?: string;
  name?: string;
  description?: string;
  sort_order?: number;
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

export const listRoomCategories = (params: ListParams = {}): Promise<RoomCategoryListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  return api.get<RoomCategoryListResponse>(`/room-categories?${query.toString()}`);
};

export const getRoomCategory = (id: number): Promise<{ data: RoomCategory }> =>
  api.get<{ data: RoomCategory }>(`/room-categories/${id}`);

export const createRoomCategory = (body: CreateRoomCategoryRequest): Promise<MutationResponse> =>
  api.post<MutationResponse>("/room-categories", body);

export const updateRoomCategory = (id: number, body: UpdateRoomCategoryRequest): Promise<{ data: RoomCategory }> =>
  api.put<{ data: RoomCategory }>(`/room-categories/${id}`, body);

export const deleteRoomCategory = (id: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/room-categories/${id}`);
