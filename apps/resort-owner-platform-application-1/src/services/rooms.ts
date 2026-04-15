import { api } from "./api";

export interface RoomSummary {
  id: number;
  resort_room_category_id: number;
  name: string;
  description: string;
  room_number: string;
  floor: number;
  max_adults: number;
  max_children: number;
  max_occupancy: number;
  base_price: string;
}

export interface RoomListResponse {
  data: RoomSummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateRoomRequest {
  name: string;
  description?: string;
  room_number?: string;
  floor?: number;
  max_adults: number;
  max_children?: number;
  base_price: string;
}

export interface UpdateRoomRequest {
  name?: string;
  description?: string;
  room_number?: string;
  floor?: number;
  max_adults?: number;
  max_children?: number;
  base_price?: string;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

export interface ListParams {
  page?: number;
  size?: number;
  sort_by?: "id" | "name" | "roomNumber" | "floor" | "basePrice";
  sort_dir?: "ASC" | "DESC";
}

const base = (resortId: number | string, categoryId: number | string) =>
  `/resorts/${resortId}/resort-room-categories/${categoryId}/rooms`;

export const listRooms = (
  resortId: number | string,
  categoryId: number | string,
  params: ListParams = {}
): Promise<RoomListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  return api.get<RoomListResponse>(`${base(resortId, categoryId)}?${query.toString()}`);
};

export const getRoom = (
  resortId: number | string,
  categoryId: number | string,
  id: number
): Promise<{ data: RoomSummary }> =>
  api.get<{ data: RoomSummary }>(`${base(resortId, categoryId)}/${id}`);

export const createRoom = (
  resortId: number | string,
  categoryId: number | string,
  body: CreateRoomRequest
): Promise<MutationResponse> =>
  api.post<MutationResponse>(base(resortId, categoryId), body);

export const updateRoom = (
  resortId: number | string,
  categoryId: number | string,
  id: number,
  body: UpdateRoomRequest
): Promise<MutationResponse> =>
  api.put<MutationResponse>(`${base(resortId, categoryId)}/${id}`, body);

export const deleteRoom = (
  resortId: number | string,
  categoryId: number | string,
  id: number
): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`${base(resortId, categoryId)}/${id}`);
