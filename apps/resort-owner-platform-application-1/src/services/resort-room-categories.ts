import { api } from "./api";

export interface ResortRoomCategorySummary {
  id: number;
  resort_id: number;
  room_category_id: number;
  name: string;
  description: string;
  sort_order: number;
}

export interface ResortRoomCategoryListResponse {
  data: ResortRoomCategorySummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateResortRoomCategoryRequest {
  room_category_id: number;
  name?: string;
  description?: string;
  sort_order?: number;
}

export interface UpdateResortRoomCategoryRequest {
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
  sort_by?: "id" | "name" | "sortOrder";
  sort_dir?: "ASC" | "DESC";
}

const base = (resortId: number | string) =>
  `/resorts/${resortId}/resort-room-categories`;

export const listResortRoomCategories = (
  resortId: number | string,
  params: ListParams = {}
): Promise<ResortRoomCategoryListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  return api.get<ResortRoomCategoryListResponse>(`${base(resortId)}?${query.toString()}`);
};

export const getResortRoomCategory = (
  resortId: number | string,
  id: number
): Promise<{ data: ResortRoomCategorySummary }> =>
  api.get<{ data: ResortRoomCategorySummary }>(`${base(resortId)}/${id}`);

export const createResortRoomCategory = (
  resortId: number | string,
  body: CreateResortRoomCategoryRequest
): Promise<MutationResponse> =>
  api.post<MutationResponse>(base(resortId), body);

export const updateResortRoomCategory = (
  resortId: number | string,
  id: number,
  body: UpdateResortRoomCategoryRequest
): Promise<MutationResponse> =>
  api.put<MutationResponse>(`${base(resortId)}/${id}`, body);

export const deleteResortRoomCategory = (
  resortId: number | string,
  id: number
): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`${base(resortId)}/${id}`);
