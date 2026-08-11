import { api } from "./api";
import type { Locale, LocaleCount } from "./locales";

export interface ContactTypeLocale {
  id: number;
  locale: Locale;
  name: string;
  description?: string;
  sort_order: number;
}

export interface ContactType {
  id: number;
  code: string;
  sort_order: number;
  /** The single translation matching Accept-Language (falls back to en, then null) — on GET /{id} and list alike. */
  locale: ContactTypeLocale | null;
}

export interface ContactTypeListResponse {
  data: ContactType[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface ContactTypeLocaleListResponse {
  data: ContactTypeLocale[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CreateContactTypeLocaleRequest {
  locale_id: number;
  name: string;
  description?: string;
  sort_order: number;
}

// The initial translation is always resolved to the "en" locale server-side —
// there's no locale_id here, and only a single locale entry is accepted at creation.
export interface CreateContactTypeRequest {
  code: string;
  sort_order: number;
  locale: {
    name: string;
    description: string;
    sort_order: number;
  };
}

export interface UpdateContactTypeRequest {
  sort_order: number;
}

export interface UpdateContactTypeLocaleRequest {
  name: string;
  description?: string;
  sort_order: number;
}

export interface MutationResponse {
  success: boolean;
  id: number;
}

export interface ListParams {
  page?: number;
  size?: number;
  // sortBy=id throws 400 — it's only valid as the implicit default when sortBy is omitted entirely.
  sort_by?: "createdAt" | "code" | "name";
  sort_dir?: "ASC" | "DESC";
  code?: string;
  name?: string;
}

export interface ListLocalesParams {
  page?: number;
  size?: number;
  localeCode?: string;
}

export const contactTypesService = {
  async list(params: ListParams = {}): Promise<ContactTypeListResponse> {
    const { page = 0, size = 10, sort_by, sort_dir = "ASC", code, name } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sortDir: sort_dir,
    });
    if (sort_by) query.set("sortBy", sort_by);
    if (code) query.set("code", code);
    if (name) query.set("name", name);
    return api.get<ContactTypeListResponse>(`/contact-types?${query}`);
  },

  async get(id: number): Promise<{ data: ContactType }> {
    return api.get<{ data: ContactType }>(`/contact-types/${id}`);
  },

  async listLocales(contactTypeId: number, params: ListLocalesParams = {}): Promise<ContactTypeLocaleListResponse> {
    const { page = 0, size = 10, localeCode } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (localeCode) query.set("localeCode", localeCode);
    return api.get<ContactTypeLocaleListResponse>(`/contact-types/${contactTypeId}/locales?${query}`);
  },

  // `codes` here is the authoritative, complete set of locale codes this contact type already has a
  // translation for — unlike listLocales, which is paginated (size 10) and can miss codes past the
  // first page. Compare against `localesService.count()`'s codes to know what's still addable.
  async countLocales(contactTypeId: number): Promise<LocaleCount> {
    return api.get<LocaleCount>(`/contact-types/${contactTypeId}/locales/count`);
  },

  async create(body: CreateContactTypeRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>("/contact-types", body);
  },

  async update(id: number, body: UpdateContactTypeRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/contact-types/${id}`, body);
  },

  async remove(id: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/contact-types/${id}`);
  },

  async addLocale(contactTypeId: number, body: CreateContactTypeLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/contact-types/${contactTypeId}/locales`, body);
  },

  async updateLocale(contactTypeId: number, localeId: number, body: UpdateContactTypeLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/contact-types/${contactTypeId}/locales/${localeId}`, body);
  },

  async removeLocale(contactTypeId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/contact-types/${contactTypeId}/locales/${localeId}`);
  },
};
