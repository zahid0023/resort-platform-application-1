import { api } from "./api";

export interface RoomPricePeriodSummary {
  id: number;
  room_id: number;
  start_date: string;
  end_date: string;
  price: number;
  priority: number;
  price_type_id: number;
  price_type_code: string;
  price_type_name: string;
}

export interface RoomPricePeriodListResponse {
  data: RoomPricePeriodSummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateRoomPricePeriodRequest {
  start_date: string;
  end_date: string;
  price: number;
  priority?: number;
  price_type_id: number;
}

export interface UpdateRoomPricePeriodRequest {
  start_date?: string;
  end_date?: string;
  price?: number;
  priority?: number;
  price_type_id?: number;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

export interface ListParams {
  page?: number;
  size?: number;
  sort_by?: "id" | "startDate" | "endDate" | "price" | "priority";
  sort_dir?: "ASC" | "DESC";
}

const base = (resortId: number | string, categoryId: number | string, roomId: number | string) =>
  `/resorts/${resortId}/resort-room-categories/${categoryId}/rooms/${roomId}/room-price-periods`;

export const listRoomPricePeriods = (
  resortId: number | string,
  categoryId: number | string,
  roomId: number | string,
  params: ListParams = {}
): Promise<RoomPricePeriodListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  return api.get<RoomPricePeriodListResponse>(`${base(resortId, categoryId, roomId)}?${query.toString()}`);
};

export const getRoomPricePeriod = (
  resortId: number | string,
  categoryId: number | string,
  roomId: number | string,
  id: number
): Promise<{ data: RoomPricePeriodSummary }> =>
  api.get<{ data: RoomPricePeriodSummary }>(`${base(resortId, categoryId, roomId)}/${id}`);

export const createRoomPricePeriod = (
  resortId: number | string,
  categoryId: number | string,
  roomId: number | string,
  body: CreateRoomPricePeriodRequest
): Promise<MutationResponse> =>
  api.post<MutationResponse>(base(resortId, categoryId, roomId), body);

export const updateRoomPricePeriod = (
  resortId: number | string,
  categoryId: number | string,
  roomId: number | string,
  id: number,
  body: UpdateRoomPricePeriodRequest
): Promise<MutationResponse> =>
  api.put<MutationResponse>(`${base(resortId, categoryId, roomId)}/${id}`, body);

export const deleteRoomPricePeriod = (
  resortId: number | string,
  categoryId: number | string,
  roomId: number | string,
  id: number
): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`${base(resortId, categoryId, roomId)}/${id}`);
