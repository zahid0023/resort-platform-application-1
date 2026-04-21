import { api, getToken } from "./api";
import type { ImageHostingProvider } from "./resort-image-storage-configs";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface ResortSummary {
  id: number;
  uuid: string;
  name: string;
  description: string;
  address: string | null;
  country_id: number;
  city_id: number | null;
  contact_email: string | null;
  contact_phone: string | null;
}

export interface Resort {
  id: number;
  uuid: string;
  name: string;
  description: string;
  address: string | null;
  country_id: number;
  city_id: number | null;
  contact_email: string | null;
  contact_phone: string | null;
}

export interface ResortListResponse {
  data: ResortSummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ListParams {
  page?: number;
  size?: number;
  sort_by?: "id" | "name";
  sort_dir?: "ASC" | "DESC";
}

export interface CreateResortRequest {
  name: string;
  description: string;
  address?: string;
  country_id: number;
  city_id?: number;
  contact_email?: string;
  contact_phone?: string;
  storage_config: {
    provider: ImageHostingProvider;
    config: Record<string, string>;
  };
  images: Array<{ file: File; caption?: string; is_default: boolean; sort_order: number }>;
}

export interface UpdateResortRequest {
  name?: string;
  description?: string;
  address?: string;
  country_id?: number;
  city_id?: number;
  contact_email?: string;
  contact_phone?: string;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

export const createResort = async (req: CreateResortRequest): Promise<MutationResponse> => {
  const token = getToken();
  const form = new FormData();

  const data = {
    name: req.name,
    description: req.description,
    country_id: req.country_id,
    ...(req.city_id !== undefined ? { city_id: req.city_id } : {}),
    ...(req.address ? { address: req.address } : {}),
    ...(req.contact_email ? { contact_email: req.contact_email } : {}),
    ...(req.contact_phone ? { contact_phone: req.contact_phone } : {}),
    config_request: {
      provider: req.storage_config.provider,
      config: req.storage_config.config,
    },
    images: req.images.map(({ file, caption, is_default, sort_order }) => ({
      client_image_id: file.name,
      ...(caption ? { caption } : {}),
      is_default,
      sort_order,
    })),
  };

  form.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));

  req.images.forEach(({ file }) => {
    form.append("images", file, file.name);
  });

  const res = await fetch(`${BASE_URL}/resorts`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = res.statusText;
    try {
      const json = JSON.parse(text);
      message = json.message || json.error || text || res.statusText;
    } catch {
      message = text || res.statusText;
    }
    throw new Error(message || `Request failed: ${res.status}`);
  }

  return res.json();
};

export const listResorts = (params: ListParams = {}): Promise<ResortListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  return api.get<ResortListResponse>(`/resorts?${query.toString()}`);
};

export const getResort = (id: number): Promise<{ data: Resort }> =>
  api.get<{ data: Resort }>(`/resorts/${id}`);

export const updateResort = (id: number, body: UpdateResortRequest): Promise<Resort> =>
  api.put<Resort>(`/resorts/${id}`, body);

export const deleteResort = (id: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/resorts/${id}`);
