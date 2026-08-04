import { api } from "./api";

export interface Locale {
  id: number;
  code: string;
  name: string;
  sort_order: number;
}

export interface CreateLocaleRequest {
  code: string;
  name: string;
  sort_order: number;
}

// `code` is set at creation and immutable — the update endpoint only accepts name/sort_order.
export interface UpdateLocaleRequest {
  name: string;
  sort_order: number;
}

export interface LocaleListResponse {
  data: Locale[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  sortable_fields?: string[];
  searchable_fields?: string[];
}

export interface LocaleMutationResponse {
  success: boolean;
  id: number;
}

export interface LocaleCount {
  count: number;
  codes: string[];
}

export interface ListLocalesParams {
  page?: number;
  size?: number;
  // sortBy=id throws 400 — it's only valid as the implicit default when sortBy is omitted entirely.
  sort_by?: "createdAt" | "sortOrder" | "code" | "name";
  sort_dir?: "ASC" | "DESC";
  code?: string;
  name?: string;
}

export const localesService = {
  async list(params: ListLocalesParams = {}): Promise<LocaleListResponse> {
    const { page = 0, size = 10, sort_by, sort_dir, code, name } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    // Query params bind onto the Java field names via Spring's DataBinder — camelCase, not the
    // snake_case used in JSON request/response bodies.
    if (sort_by) query.set("sortBy", sort_by);
    if (sort_dir) query.set("sortDir", sort_dir);
    if (code) query.set("code", code);
    if (name) query.set("name", name);
    return api.get<LocaleListResponse>(`/locales?${query}`);
  },

  async get(id: number): Promise<{ data: Locale }> {
    return api.get<{ data: Locale }>(`/locales/${id}`);
  },

  async count(): Promise<LocaleCount> {
    return api.get<LocaleCount>("/locales/count");
  },

  async create(body: CreateLocaleRequest): Promise<LocaleMutationResponse> {
    return api.post<LocaleMutationResponse>("/locales", body);
  },

  async update(id: number, body: UpdateLocaleRequest): Promise<LocaleMutationResponse> {
    return api.put<LocaleMutationResponse>(`/locales/${id}`, body);
  },

  async remove(id: number): Promise<LocaleMutationResponse> {
    return api.delete<LocaleMutationResponse>(`/locales/${id}`);
  },
};
