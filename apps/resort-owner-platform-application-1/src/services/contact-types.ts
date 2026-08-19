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

export interface ContactTypeListResponse {
  data: ContactType[]
  current_page: number
  total_pages: number
  total_elements: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export const contactTypesService = {
  list(params: {
    page?: number
    size?: number
    sort_by?: string
    sort_dir?: "ASC" | "DESC"
    code?: string
  } = {}): Promise<ContactTypeListResponse> {
    const q = new URLSearchParams()
    if (params.page !== undefined) q.set("page", String(params.page))
    if (params.size !== undefined) q.set("size", String(params.size))
    if (params.sort_by) q.set("sort_by", params.sort_by)
    if (params.sort_dir) q.set("sort_dir", params.sort_dir)
    if (params.code) q.set("code", params.code)
    return api.get<ContactTypeListResponse>(`/contact-types?${q}`)
  },
}

export function listContactTypes(size = 50): Promise<ContactTypeListResponse> {
  return api.get<ContactTypeListResponse>(
    `/contact-types?size=${size}&sort_by=sortOrder&sort_dir=ASC`
  )
}
