import { api } from "./api";

export interface CreateUiBlockDefinitionRequest {
  ui_block_key: string;
  name: string;
  description: string;
  ui_block_version: string;
  ui_block_category_id: number;
  page_type_id: number;
  editable_schema: unknown;
  default_content: unknown;
  allowed_pages: string[];
  is_accepted: boolean;
}

export interface UpdateUiBlockDefinitionRequest {
  ui_block_key?: string;
  name?: string;
  description?: string;
  ui_block_version?: string;
  ui_block_category_id?: number;
  page_type_id?: number;
  editable_schema?: unknown;
  default_content?: unknown;
  allowed_pages?: string[];
  is_accepted?: boolean;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

export interface UiBlockDefinitionSummary {
  id: number;
  ui_block_key: string;
  name: string;
  description: string;
  ui_block_version: string;
  ui_block_category_id: number;
  page_type_id: number;
  editable_schema: unknown;
  default_content: unknown;
  allowed_pages: string[];
  status: "Accepted" | "Rejected";
}

export interface ListUiBlockDefinitionsResponse {
  data: UiBlockDefinitionSummary[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export const createUiBlockDefinition = (
  body: CreateUiBlockDefinitionRequest
): Promise<MutationResponse> =>
  api.post<MutationResponse>("/ui-block-definitions", body);

export const updateUiBlockDefinition = (
  id: number,
  body: UpdateUiBlockDefinitionRequest
): Promise<{ data: UiBlockDefinitionSummary }> =>
  api.put<{ data: UiBlockDefinitionSummary }>(`/ui-block-definitions/${id}`, body);

export const listUiBlockDefinitions = (params?: {
  page?: number;
  size?: number;
}): Promise<ListUiBlockDefinitionsResponse> => {
  const page = params?.page ?? 0;
  const size = params?.size ?? 50;
  return api.get<ListUiBlockDefinitionsResponse>(
    `/ui-block-definitions?page=${page}&size=${size}`
  );
};
