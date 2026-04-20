import { api } from "./api";

export interface RoomCategorySummary {
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
  description?: string;
  sort_order?: number;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

export const listRoomCategories = (
  params: { page?: number; size?: number } = {}
): Promise<RoomCategoryListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  query.set("sort_by", "sort_order");
  query.set("sort_dir", "ASC");
  return api.get<RoomCategoryListResponse>(`/room-categories?${query.toString()}`);
};

export const createRoomCategory = (
  body: CreateRoomCategoryRequest
): Promise<MutationResponse> =>
  api.post<MutationResponse>("/room-categories", body);
