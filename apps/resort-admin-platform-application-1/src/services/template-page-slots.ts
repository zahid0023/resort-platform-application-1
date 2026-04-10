import { api } from "./api";

export interface TemplatePageSlotSummary {
  id: number;
  template_page_id: number;
  ui_block_category_id: number;
  slot_name: string;
  is_required: boolean;
  slot_order: number;
}

export interface TemplatePageSlotVariant {
  id: number;
  template_page_slot_id: number;
  ui_block_definition_id: number;
  display_order: number;
  is_default: boolean;
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

export interface TemplatePageSlotListResponse {
  data: TemplatePageSlotSummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateTemplatePageSlotRequest {
  ui_block_category_id: number;
  slot_name: string;
  is_required?: boolean;
  slot_order: number;
}

export interface UpdateTemplatePageSlotRequest {
  ui_block_category_id?: number;
  slot_name?: string;
  is_required?: boolean;
  slot_order?: number;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

export interface ListParams {
  page?: number;
  size?: number;
  sort_by?: "id" | "slotName" | "slotOrder";
  sort_dir?: "ASC" | "DESC";
}

export const listTemplatePageSlots = (
  templateId: number,
  pageId: number,
  params: ListParams = {}
): Promise<TemplatePageSlotListResponse> => {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_dir) query.set("sort_dir", params.sort_dir);
  return api.get<TemplatePageSlotListResponse>(
    `/templates/${templateId}/template-pages/${pageId}/template-page-slots?${query.toString()}`
  );
};

export const getTemplatePageSlot = (
  templateId: number,
  pageId: number,
  id: number
): Promise<{ data: TemplatePageSlot }> =>
  api.get<{ data: TemplatePageSlot }>(
    `/templates/${templateId}/template-pages/${pageId}/template-page-slots/${id}`
  );

export const createTemplatePageSlot = (
  templateId: number,
  pageId: number,
  body: CreateTemplatePageSlotRequest
): Promise<MutationResponse> =>
  api.post<MutationResponse>(
    `/templates/${templateId}/template-pages/${pageId}/template-page-slots`,
    body
  );

export const updateTemplatePageSlot = (
  templateId: number,
  pageId: number,
  id: number,
  body: UpdateTemplatePageSlotRequest
): Promise<MutationResponse> =>
  api.put<MutationResponse>(
    `/templates/${templateId}/template-pages/${pageId}/template-page-slots/${id}`,
    body
  );

export const deleteTemplatePageSlot = (
  templateId: number,
  pageId: number,
  id: number
): Promise<MutationResponse> =>
  api.delete<MutationResponse>(
    `/templates/${templateId}/template-pages/${pageId}/template-page-slots/${id}`
  );
