import { api } from "./api";

export interface TemplatePageSlotVariantSummary {
  id: number;
  template_page_slot_id: number;
  ui_block_definition_id: number;
  display_order: number;
  is_default: boolean;
}

export interface TemplatePageSlotVariantListResponse {
  data: TemplatePageSlotVariantSummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface CreateTemplatePageSlotVariantRequest {
  ui_block_definition_id: number;
  display_order?: number;
  is_default?: boolean;
}

export interface UpdateTemplatePageSlotVariantRequest {
  ui_block_definition_id?: number;
  display_order?: number;
  is_default?: boolean;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

export interface ListParams {
  page?: number;
  size?: number;
  sort_by?: "id" | "displayOrder";
  sort_dir?: "ASC" | "DESC";
}

const base = (templateId: number, pageId: number, slotId: number) =>
  `/templates/${templateId}/template-pages/${pageId}/template-page-slots/${slotId}/template-page-slot-variants`

export const listTemplatePageSlotVariants = (
  templateId: number,
  pageId: number,
  slotId: number,
  params: ListParams = {}
): Promise<TemplatePageSlotVariantListResponse> => {
  const query = new URLSearchParams()
  if (params.page !== undefined) query.set("page", String(params.page))
  if (params.size !== undefined) query.set("size", String(params.size))
  if (params.sort_by) query.set("sort_by", params.sort_by)
  if (params.sort_dir) query.set("sort_dir", params.sort_dir)
  return api.get<TemplatePageSlotVariantListResponse>(`${base(templateId, pageId, slotId)}?${query.toString()}`)
}

export const getTemplatePageSlotVariant = (
  templateId: number,
  pageId: number,
  slotId: number,
  id: number
): Promise<{ data: TemplatePageSlotVariantSummary }> =>
  api.get<{ data: TemplatePageSlotVariantSummary }>(`${base(templateId, pageId, slotId)}/${id}`)

export const createTemplatePageSlotVariant = (
  templateId: number,
  pageId: number,
  slotId: number,
  body: CreateTemplatePageSlotVariantRequest
): Promise<MutationResponse> =>
  api.post<MutationResponse>(base(templateId, pageId, slotId), body)

export const updateTemplatePageSlotVariant = (
  templateId: number,
  pageId: number,
  slotId: number,
  id: number,
  body: UpdateTemplatePageSlotVariantRequest
): Promise<MutationResponse> =>
  api.put<MutationResponse>(`${base(templateId, pageId, slotId)}/${id}`, body)

export const deleteTemplatePageSlotVariant = (
  templateId: number,
  pageId: number,
  slotId: number,
  id: number
): Promise<MutationResponse> =>
  api.delete<MutationResponse>(`${base(templateId, pageId, slotId)}/${id}`)
