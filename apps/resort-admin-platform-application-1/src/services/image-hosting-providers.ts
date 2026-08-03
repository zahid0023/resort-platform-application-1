import { api } from "./api";

export interface ImageHostingProviderConfigField {
  id: number;
  key: string;
  label: string;
  field_type: string;
  placeholder: string;
  default_value: string;
  is_required: boolean;
  sort_order: number;
}

export interface ImageHostingProvider {
  id: number;
  code: string;
  name: string;
  description: string;
  sort_order: number;
}

export interface ImageHostingProviderConfig {
  id: number;
  name: string;
  config: Record<string, unknown>;
}

export interface ImageHostingProviderListResponse {
  data: ImageHostingProvider[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CreateConfigFieldRequest {
  key: string;
  label: string;
  field_type: string;
  placeholder: string;
  default_value: string;
  is_required: boolean;
  sort_order: number;
}

// The initial config fields are submitted in this same request — there is no separate
// "create empty provider, add fields later" path. Must contain at least one entry with
// no duplicate `key` within the list.
export interface CreateImageHostingProviderRequest {
  code: string;
  name: string;
  description: string;
  sort_order: number;
  config_fields: CreateConfigFieldRequest[];
}

export interface UpdateImageHostingProviderRequest {
  name: string;
  description: string;
  sort_order: number;
}

export interface UpdateConfigFieldRequest {
  label: string;
  field_type: string;
  placeholder: string;
  default_value: string;
  is_required: boolean;
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
  // Unlike Countries/Cities, only code/name are sortable here — no createdAt or sortOrder option.
  sort_by?: "code" | "name";
  sort_dir?: "ASC" | "DESC";
  code?: string;
  name?: string;
}

export interface ImageHostingProviderConfigListResponse {
  data: ImageHostingProviderConfig[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CreateConfigRequest {
  name: string;
  config: Record<string, unknown>;
}

export interface UpdateConfigRequest {
  name: string;
  config: Record<string, unknown>;
}

export interface ListConfigsParams {
  page?: number;
  size?: number;
  // sortBy=id throws 400 — implicit-default only. Only "name" is a selectable sort field.
  sort_by?: "name";
  sort_dir?: "ASC" | "DESC";
  name?: string;
}

export const imageHostingProvidersService = {
  async list(params: ListParams = {}): Promise<ImageHostingProviderListResponse> {
    const { page = 0, size = 10, sort_by, sort_dir = "ASC", code, name } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sortDir: sort_dir,
    });
    if (sort_by) query.set("sortBy", sort_by);
    if (code) query.set("code", code);
    if (name) query.set("name", name);
    return api.get<ImageHostingProviderListResponse>(`/image-hosting-providers?${query}`);
  },

  async get(id: number): Promise<{ data: ImageHostingProvider }> {
    return api.get<{ data: ImageHostingProvider }>(`/image-hosting-providers/${id}`);
  },

  async create(body: CreateImageHostingProviderRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/image-hosting-providers", body);
  },

  async update(id: number, body: UpdateImageHostingProviderRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/image-hosting-providers/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/image-hosting-providers/${id}`);
  },

  // Not paginated — a plain array, no `data` envelope.
  async listConfigFields(providerId: number): Promise<ImageHostingProviderConfigField[]> {
    return api.get<ImageHostingProviderConfigField[]>(`/image-hosting-providers/${providerId}/config-fields`);
  },

  async addConfigField(providerId: number, body: CreateConfigFieldRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/image-hosting-providers/${providerId}/config-fields`, body);
  },

  async updateConfigField(providerId: number, id: number, body: UpdateConfigFieldRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/image-hosting-providers/${providerId}/config-fields/${id}`, body);
  },

  async removeConfigField(providerId: number, id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/image-hosting-providers/${providerId}/config-fields/${id}`);
  },

  // Configs — actual configured instances of a provider (e.g. "Cloudinary Marketing"), distinct
  // from config fields (which describe the schema). Paginated, unlike config-fields.
  async listConfigs(providerId: number, params: ListConfigsParams = {}): Promise<ImageHostingProviderConfigListResponse> {
    const { page = 0, size = 10, sort_by, sort_dir = "ASC", name } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sortDir: sort_dir,
    });
    if (sort_by) query.set("sortBy", sort_by);
    if (name) query.set("name", name);
    return api.get<ImageHostingProviderConfigListResponse>(`/image-hosting-providers/${providerId}/configs?${query}`);
  },

  async createConfig(providerId: number, body: CreateConfigRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/image-hosting-providers/${providerId}/configs`, body);
  },

  async updateConfig(providerId: number, id: number, body: UpdateConfigRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/image-hosting-providers/${providerId}/configs/${id}`, body);
  },

  async removeConfig(providerId: number, id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/image-hosting-providers/${providerId}/configs/${id}`);
  },
};
