import { api } from "./api";

export interface CommunicationChannelLocale {
  id: number;
  locale_id: number;
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
  locales: CommunicationChannelLocale[];
}

export interface CommunicationChannelListResponse {
  data: CommunicationChannel[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateCommunicationChannelLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CreateCommunicationChannelRequest {
  code: string;
  sort_order: number;
  is_url: boolean;
  is_phone: boolean;
  is_email: boolean;
  is_clickable: boolean;
  locales?: CreateCommunicationChannelLocaleRequest[];
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
  sort_by?: string;
  sort_dir?: "ASC" | "DESC";
  code?: string;
}

export const communicationChannelsService = {
  async list(params: ListParams = {}): Promise<CommunicationChannelListResponse> {
    const { page = 0, size = 10, sort_by = "id", sort_dir = "ASC", code } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size), sort_by, sort_dir });
    if (code) query.set("code", code);
    return api.get<CommunicationChannelListResponse>(`/communication-channels?${query}`);
  },

  async get(id: number): Promise<{ data: CommunicationChannel }> {
    return api.get<{ data: CommunicationChannel }>(`/communication-channels/${id}`);
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
