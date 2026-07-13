import { api } from "./api"

export interface ContactTypeLocale {
  language_code: string
  name: string
}

export interface ContactType {
  id: number
  code: string
  sort_order: number
  locales: ContactTypeLocale[]
}

export interface CommunicationChannelLocale {
  language_code: string
  name: string
}

export interface CommunicationChannel {
  id: number
  code: string
  is_url: boolean
  is_phone: boolean
  is_email: boolean
  is_clickable: boolean
  locales: CommunicationChannelLocale[]
}

export interface ResortContact {
  id: number
  resort_id: number
  contact_type: ContactType
  communication_channel: CommunicationChannel
  contact_value: string
  is_primary: boolean
  sort_order: number
}

export interface ResortContactListResponse {
  data: ResortContact[]
  current_page: number
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export interface CreateContactPayload {
  contact_type_id: number
  communication_channel_id: number
  contact_value: string
  is_primary: boolean
  sort_order: number
}

export interface UpdateContactPayload {
  contact_value: string
  is_primary: boolean
  sort_order: number
}

export interface MutationResponse {
  success: boolean
  id: number
}

export const resortContactsService = {
  list(resortId: number, params: { page?: number; size?: number } = {}): Promise<ResortContactListResponse> {
    const { page = 0, size = 50 } = params
    const q = new URLSearchParams({ page: String(page), size: String(size), sort_by: "id", sort_dir: "ASC" })
    return api.get<ResortContactListResponse>(`/resorts/${resortId}/contacts?${q}`)
  },

  get(resortId: number, id: number): Promise<{ data: ResortContact }> {
    return api.get<{ data: ResortContact }>(`/resorts/${resortId}/contacts/${id}`)
  },

  create(resortId: number, body: CreateContactPayload): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/resorts/${resortId}/contacts`, body)
  },

  update(resortId: number, id: number, body: UpdateContactPayload): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/resorts/${resortId}/contacts/${id}`, body)
  },

  remove(resortId: number, id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/resorts/${resortId}/contacts/${id}`)
  },
}
