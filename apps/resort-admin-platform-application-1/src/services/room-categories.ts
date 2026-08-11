import { api } from "./api";
import type { Locale, LocaleCount } from "./locales";

export interface RoomCategoryLocale {
  id: number;
  locale: Locale;
  name: string;
  description?: string;
  sort_order: number;
}

export interface RoomCategory {
  id: number;
  code: string;
  sort_order: number;
  /** The single translation matching Accept-Language (falls back to en, then null) — on GET /{id} and list alike. */
  locale: RoomCategoryLocale | null;
}

export interface RoomCategoryListResponse {
  data: RoomCategory[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface RoomCategoryLocaleListResponse {
  data: RoomCategoryLocale[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CreateRoomCategoryLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

// The initial translation is always resolved to the "en" locale server-side —
// there's no locale_id here, and only a single locale entry is accepted at creation.
export interface CreateRoomCategoryRequest {
  code: string;
  sort_order: number;
  locale: {
    name: string;
    description: string;
    sort_order: number;
  };
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
  // sortBy=id throws 400 — it's only valid as the implicit default when sortBy is omitted entirely.
  sort_by?: "createdAt" | "code" | "name";
  sort_dir?: "ASC" | "DESC";
  code?: string;
  name?: string;
}

export interface ListLocalesParams {
  page?: number;
  size?: number;
  localeCode?: string;
}

export const roomCategoriesService = {
  async list(params: ListParams = {}): Promise<RoomCategoryListResponse> {
    const { page = 0, size = 10, sort_by, sort_dir = "ASC", code, name } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sortDir: sort_dir,
    });
    if (sort_by) query.set("sortBy", sort_by);
    if (code) query.set("code", code);
    if (name) query.set("name", name);
    return api.get<RoomCategoryListResponse>(`/room-categories?${query}`);
  },

  async get(id: number): Promise<{ data: RoomCategory }> {
    return api.get<{ data: RoomCategory }>(`/room-categories/${id}`);
  },

  async listLocales(roomCategoryId: number, params: ListLocalesParams = {}): Promise<RoomCategoryLocaleListResponse> {
    const { page = 0, size = 10, localeCode } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (localeCode) query.set("localeCode", localeCode);
    return api.get<RoomCategoryLocaleListResponse>(`/room-categories/${roomCategoryId}/locales?${query}`);
  },

  // `codes` here is the authoritative, complete set of locale codes this room category already has a
  // translation for — unlike listLocales, which is paginated (size 10) and can miss codes past the
  // first page. Compare against `localesService.count()`'s codes to know what's still addable.
  async countLocales(roomCategoryId: number): Promise<LocaleCount> {
    return api.get<LocaleCount>(`/room-categories/${roomCategoryId}/locales/count`);
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
