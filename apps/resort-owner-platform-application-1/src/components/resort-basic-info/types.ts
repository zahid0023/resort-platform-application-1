export interface ResortLocaleRow {
  id?: number
  locale_id: number | ""
  name: string
  tagline: string
  short_description: string
  address: string
  sort_order: number
  _new?: boolean
}

export interface EmbeddedLocaleEntry {
  id: number
  locale_id: number
  name: string
}

export interface ResortBasicInfoFormState {
  sort_order: number
  estd: number | ""
  lat: string
  lon: string
  logo_url: string
  country: { id: number; code: string; locales: EmbeddedLocaleEntry[] }
  city: { id: number; code: string; locales: EmbeddedLocaleEntry[] }
  locales: ResortLocaleRow[]
}
