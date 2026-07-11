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

interface CommunicationChannelListResponse {
  data: CommunicationChannel[]
}

export function listCommunicationChannels(size = 50): Promise<CommunicationChannelListResponse> {
  return api.get<CommunicationChannelListResponse>(
    `/communication-channels?size=${size}&sort_by=sortOrder&sort_dir=ASC`
  )
}
