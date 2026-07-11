import { api } from "./api"

export interface ContactTypeLocale {
  id: number
  locale_id: number
  name: string
  description?: string
  sort_order: number
}

export interface ContactType {
  id: number
  code: string
  sort_order: number
  locales: ContactTypeLocale[]
}

interface ContactTypeListResponse {
  data: ContactType[]
}

export function listContactTypes(size = 50): Promise<ContactTypeListResponse> {
  return api.get<ContactTypeListResponse>(
    `/contact-types?size=${size}&sort_by=sortOrder&sort_dir=ASC`
  )
}
