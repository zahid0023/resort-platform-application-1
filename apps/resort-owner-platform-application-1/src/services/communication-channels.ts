import { api } from "./api"

export interface CommunicationChannelLocale {
  id: number
  locale_id: number
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
  locales: CommunicationChannelLocale[]
}

export interface CommunicationChannelListResponse {
  data: CommunicationChannel[]
  current_page: number
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export const communicationChannelsService = {
  list(params: {
    page?: number
    size?: number
    sort_by?: string
    sort_dir?: "ASC" | "DESC"
    code?: string
  } = {}): Promise<CommunicationChannelListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.sort_by) q.set("sort_by", params.sort_by)
    if (params.sort_dir) q.set("sort_dir", params.sort_dir)
    if (params.code) q.set("code", params.code)
    return api.get<CommunicationChannelListResponse>(`/communication-channels?${q}`)
  },
}

export function listCommunicationChannels(size = 50): Promise<CommunicationChannelListResponse> {
  return api.get<CommunicationChannelListResponse>(
    `/communication-channels?size=${size}&sort_by=sortOrder&sort_dir=ASC`
  )
}
