import { api } from "./api";

export interface TemplateSummary {
  id: number;
  key: string;
  name: string;
  status: string;
}

export interface TemplatePage {
  id: number;
  template_id: number;
  page_type_id: number;
  page_name: string;
  page_slug: string;
  page_order: number;
  template_page_slots: unknown[];
}

export interface Template {
  id: number;
  key: string;
  name: string;
  description: string | null;
  status: string;
  template_pages: TemplatePage[] | null;
}

export interface TemplateListResponse {
  data: TemplateSummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateTemplateRequest {
  key: string;
  name: string;
  description?: string;
  status?: string;
}

export interface UpdateTemplateRequest {
  key?: string;
  name?: string;
  description?: string;
  status?: string;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

export interface ListParams {
  page?: number;
  size?: number;
  sort_by?: "id" | "key" | "name";
  sort_dir?: "ASC" | "DESC";
}

export const listTemplates = (params: ListParams = {}): Promise<TemplateListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  return api.get<TemplateListResponse>(`/templates?${query.toString()}`);
};

export const getTemplate = (id: number): Promise<{ data: Template }> =>
  api.get<{ data: Template }>(`/templates/${id}`);

export const createTemplate = (body: CreateTemplateRequest): Promise<MutationResponse> =>
  api.post<MutationResponse>("/templates", body);

export const updateTemplate = (id: number, body: UpdateTemplateRequest): Promise<{ data: Template }> =>
  api.put<{ data: Template }>(`/templates/${id}`, body);

export const deleteTemplate = (id: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/templates/${id}`);
