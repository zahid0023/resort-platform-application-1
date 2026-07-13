import { api } from "./api";

export type ImageHostingProvider = "S3" | "CLOUDINARY";

export interface ProviderField {
  key: string;
  label: string;
  secret?: boolean;
}

export const PROVIDER_FIELDS: Record<ImageHostingProvider, ProviderField[]> = {
  S3: [
    { key: "bucket", label: "Bucket Name" },
    { key: "region", label: "AWS Region" },
    { key: "access_key", label: "Access Key ID" },
    { key: "secret_key", label: "Secret Access Key", secret: true },
  ],
  CLOUDINARY: [
    { key: "cloud_name", label: "Cloud Name" },
    { key: "api_key", label: "API Key" },
    { key: "api_secret", label: "API Secret", secret: true },
  ],
};

export interface ResortImageHostingConfig {
  id: number;
  name: string;
  provider: ImageHostingProvider;
  config: Record<string, string>;
}

export interface ResortImageHostingConfigListResponse {
  data: ResortImageHostingConfig[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

export interface CreateResortImageHostingConfigRequest {
  name: string;
  provider: ImageHostingProvider;
  config: Record<string, string>;
}

export interface ListParams {
  page?: number;
  size?: number;
  sort_by?: string;
  sort_dir?: "ASC" | "DESC";
}

export const resortImageHostingConfigsService = {
  async list(resortId: number, params: ListParams = {}): Promise<ResortImageHostingConfigListResponse> {
    const { page = 0, size = 50, sort_by = "id", sort_dir = "ASC" } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort_by,
      sort_dir,
    });
    return api.get<ResortImageHostingConfigListResponse>(
      `/resorts/${resortId}/resort-image-hosting-configs?${query}`,
    );
  },

  async get(resortId: number, id: number): Promise<{ resort_image_hosting_config: ResortImageHostingConfig }> {
    return api.get(`/resorts/${resortId}/resort-image-hosting-configs/${id}`);
  },

  async create(resortId: number, body: CreateResortImageHostingConfigRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/resorts/${resortId}/resort-image-hosting-configs`, body);
  },

  async update(resortId: number, id: number, name: string): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/resorts/${resortId}/resort-image-hosting-configs/${id}`, { name });
  },

  async remove(resortId: number, id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/resorts/${resortId}/resort-image-hosting-configs/${id}`);
  },
};
