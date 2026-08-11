import { api } from "./api";
import type { Locale, LocaleCount } from "./locales";

export interface CommunicationChannelLocale {
  id: number;
  locale: Locale;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CommunicationChannel {
  id: number;
  code: string;
  sort_order: number;
  is_url: boolean;
  is_phone: boolean;
  is_email: boolean;
  is_clickable: boolean;
  /** The single translation matching Accept-Language (falls back to en, then null) — on GET /{id} and list alike. */
  locale: CommunicationChannelLocale | null;
}

export interface CommunicationChannelListResponse {
  data: CommunicationChannel[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CommunicationChannelLocaleListResponse {
  data: CommunicationChannelLocale[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CreateCommunicationChannelLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

// The initial translation is always resolved to the "en" locale server-side —
// there's no locale_id here, and only a single locale entry is accepted at creation.
export interface CreateCommunicationChannelRequest {
  code: string;
  sort_order: number;
  is_url: boolean;
  is_phone: boolean;
  is_email: boolean;
  is_clickable: boolean;
  locale: {
    name: string;
    description: string;
    sort_order: number;
  };
}

export interface UpdateCommunicationChannelRequest {
  sort_order: number;
  is_url: boolean;
  is_phone: boolean;
  is_email: boolean;
  is_clickable: boolean;
}

export interface UpdateCommunicationChannelLocaleRequest {
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

export const communicationChannelsService = {
  async list(params: ListParams = {}): Promise<CommunicationChannelListResponse> {
    const { page = 0, size = 10, sort_by, sort_dir = "ASC", code, name } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sortDir: sort_dir,
    });
    if (sort_by) query.set("sortBy", sort_by);
    if (code) query.set("code", code);
    if (name) query.set("name", name);
    return api.get<CommunicationChannelListResponse>(`/communication-channels?${query}`);
  },

  async get(id: number): Promise<{ data: CommunicationChannel }> {
    return api.get<{ data: CommunicationChannel }>(`/communication-channels/${id}`);
  },

  async listLocales(channelId: number, params: ListLocalesParams = {}): Promise<CommunicationChannelLocaleListResponse> {
    const { page = 0, size = 10, localeCode } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (localeCode) query.set("localeCode", localeCode);
    return api.get<CommunicationChannelLocaleListResponse>(`/communication-channels/${channelId}/locales?${query}`);
  },

  // `codes` here is the authoritative, complete set of locale codes this channel already has a
  // translation for — unlike listLocales, which is paginated (size 10) and can miss codes past the
  // first page. Compare against `localesService.count()`'s codes to know what's still addable.
  async countLocales(channelId: number): Promise<LocaleCount> {
    return api.get<LocaleCount>(`/communication-channels/${channelId}/locales/count`);
  },

  async create(body: CreateCommunicationChannelRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/communication-channels", body);
  },

  async update(id: number, body: UpdateCommunicationChannelRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/communication-channels/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/communication-channels/${id}`);
  },

  async addLocale(channelId: number, body: CreateCommunicationChannelLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/communication-channels/${channelId}/locales`, body);
  },

  async updateLocale(channelId: number, localeId: number, body: UpdateCommunicationChannelLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/communication-channels/${channelId}/locales/${localeId}`, body);
  },

  async removeLocale(channelId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/communication-channels/${channelId}/locales/${localeId}`);
  },
};
