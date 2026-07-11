import { api } from "./api"

export interface CreateResortContactRequest {
  contact_type_id: number
  communication_channel_id: number
  contact_value: string
  is_primary: boolean
  sort_order: number
}

export interface MutationResponse {
  success: boolean
  id: number
}

export function createResortContact(
  resortId: number,
  body: CreateResortContactRequest
): Promise<MutationResponse> {
  return api.post<MutationResponse>(`/resorts/${resortId}/contacts`, body)
}
