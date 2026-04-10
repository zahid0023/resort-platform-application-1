import { api } from "./api";

export interface TemplatePageSummary {
  id: number;
  template_id: number;
  page_type_id: number;
  page_name: string;
  page_slug: string;
  page_order: number;
}

export interface TemplatePageSlotVariant {
  id: number;
  template_page_slot_id: number;
  [key: string]: unknown;
}

export interface TemplatePageSlot {
  id: number;
  template_page_id: number;
  ui_block_category_id: number;
  slot_name: string;
  is_required: boolean;
  slot_order: number;
  template_page_slot_variants: TemplatePageSlotVariant[];
}

export interface TemplatePage {
  id: number;
  template_id: number;
  page_type_id: number;
  page_name: string;
  page_slug: string;
  page_order: number;
  template_page_slots: TemplatePageSlot[];
}

export interface TemplatePageListResponse {
  data: TemplatePageSummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateTemplatePageRequest {
  page_type_id: number;
  page_name: string;
  page_slug: string;
  page_order: number;
}

export interface UpdateTemplatePageRequest {
  page_type_id?: number;
  page_name?: string;
  page_slug?: string;
  page_order?: number;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

export interface ListParams {
  page?: number;
  size?: number;
  sort_by?: "id" | "pageName" | "pageSlug" | "pageOrder";
  sort_dir?: "ASC" | "DESC";
}

export const listTemplatePages = (templateId: number, params: ListParams = {}): Promise<TemplatePageListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  return api.get<TemplatePageListResponse>(`/templates/${templateId}/template-pages?${query.toString()}`);
};

export const getTemplatePage = (templateId: number, id: number): Promise<{ data: TemplatePage }> =>
  api.get<{ data: TemplatePage }>(`/templates/${templateId}/template-pages/${id}`);

export const createTemplatePage = (templateId: number, body: CreateTemplatePageRequest): Promise<MutationResponse> =>
  api.post<MutationResponse>(`/templates/${templateId}/template-pages`, body);

export const updateTemplatePage = (templateId: number, id: number, body: UpdateTemplatePageRequest): Promise<{ data: TemplatePage }> =>
  api.put<{ data: TemplatePage }>(`/templates/${templateId}/template-pages/${id}`, body);

export const deleteTemplatePage = (templateId: number, id: number): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`/templates/${templateId}/template-pages/${id}`);
