import { api } from "./api"
import type { Locale } from "./locales"

export interface ContactTypeLocale {
  id: number
  locale: Locale
  name: string
  description?: string
  sort_order: number
}

export interface ContactType {
  id: number
  code: string
  sort_order: number
  /** The single translation matching Accept-Language (falls back to en, then null). */
  locale: ContactTypeLocale | null
}

export interface CommunicationChannelLocale {
  id: number
  locale: Locale
  name: string
  description?: string
  sort_order: number
}

export interface CommunicationChannel {
  id: number
  code: string
  sort_order: number
  is_url: boolean
  is_phone: boolean
  is_email: boolean
  is_clickable: boolean
  /** The single translation matching Accept-Language (falls back to en, then null). */
  locale: CommunicationChannelLocale | null
}

export interface ResortSummary {
  id: number
  code: string
}

export interface ResortContact {
  id: number
  resort: ResortSummary
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

export interface ListResortContactsParams {
  page?: number
  size?: number
  contactTypeId?: number
  communicationChannelId?: number
  contactValue?: string
  isPrimary?: boolean
}

// Query params bind onto ResortContactFilterRequest's Java field names via Spring's DataBinder —
// camelCase, not the snake_case used in JSON request/response bodies. `id` is not a selectable
// sortBy value, so it's left as the implicit default rather than sent explicitly.
function buildQuery(params: ListResortContactsParams): URLSearchParams {
  const { page = 0, size = 50, contactTypeId, communicationChannelId, contactValue, isPrimary } = params
  const q = new URLSearchParams({ page: String(page), size: String(size) })
  if (contactTypeId != null) q.set("contactTypeId", String(contactTypeId))
  if (communicationChannelId != null) q.set("communicationChannelId", String(communicationChannelId))
  if (contactValue) q.set("contactValue", contactValue)
  if (isPrimary != null) q.set("isPrimary", String(isPrimary))
  return q
}

export const resortContactsService = {
  list(resortId: number, params: ListResortContactsParams = {}): Promise<ResortContactListResponse> {
    return api.get<ResortContactListResponse>(`/resorts/${resortId}/contacts?${buildQuery(params)}`)
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
