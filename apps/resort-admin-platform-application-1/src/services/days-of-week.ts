import { api } from "./api";
import type { Locale, LocaleCount } from "./locales";

export interface DayOfWeekLocale {
  id: number;
  locale: Locale;
  name: string;
  short_name: string;
  description?: string;
  sort_order: number;
}

export interface DayOfWeek {
  id: number;
  code: string;
  sort_order: number;
  /** The single translation matching Accept-Language (falls back to en, then null) — on GET /{id} and list alike. */
  locale: DayOfWeekLocale | null;
}

export interface DayOfWeekListResponse {
  data: DayOfWeek[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface DayOfWeekLocaleListResponse {
  data: DayOfWeekLocale[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  searchable_fields?: string[];
  sortable_fields?: string[];
}

export interface CreateDayOfWeekLocaleRequest {
  locale_id: number;
  name: string;
  short_name: string;
  description?: string;
  sort_order: number;
}

export interface UpdateDayOfWeekLocaleRequest {
  name: string;
  short_name: string;
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
  sort_by?: "createdAt" | "code" | "sortOrder" | "name" | "shortName";
  sort_dir?: "ASC" | "DESC";
  code?: string;
  name?: string;
  shortName?: string;
}

export interface ListLocalesParams {
  page?: number;
  size?: number;
  localeCode?: string;
}

// The seven day-of-week records are platform-seeded and read-only through this API — there is no
// create/update/delete for the day itself, only GET (list/single) and full CRUD on its /locales
// sub-resource.
export const daysOfWeekService = {
  async list(params: ListParams = {}): Promise<DayOfWeekListResponse> {
    const { page = 0, size = 10, sort_by, sort_dir = "ASC", code, name, shortName } = params;
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sortDir: sort_dir,
    });
    if (sort_by) query.set("sortBy", sort_by);
    if (code) query.set("code", code);
    if (name) query.set("name", name);
    if (shortName) query.set("shortName", shortName);
    return api.get<DayOfWeekListResponse>(`/days-of-week?${query}`);
  },

  async get(id: number): Promise<{ data: DayOfWeek }> {
    return api.get<{ data: DayOfWeek }>(`/days-of-week/${id}`);
  },

  async listLocales(dayOfWeekId: number, params: ListLocalesParams = {}): Promise<DayOfWeekLocaleListResponse> {
    const { page = 0, size = 10, localeCode } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (localeCode) query.set("localeCode", localeCode);
    return api.get<DayOfWeekLocaleListResponse>(`/days-of-week/${dayOfWeekId}/locales?${query}`);
  },

  // `codes` here is the authoritative, complete set of locale codes this day already has a
  // translation for — unlike listLocales, which is paginated (size 10) and can miss codes past the
  // first page. Compare against `localesService.count()`'s codes to know what's still addable.
  async countLocales(dayOfWeekId: number): Promise<LocaleCount> {
    return api.get<LocaleCount>(`/days-of-week/${dayOfWeekId}/locales/count`);
  },

  async addLocale(dayOfWeekId: number, body: CreateDayOfWeekLocaleRequest): Promise<MutationResponse> {
    return api.post<MutationResponse>(`/days-of-week/${dayOfWeekId}/locales`, body);
  },

  async updateLocale(dayOfWeekId: number, localeId: number, body: UpdateDayOfWeekLocaleRequest): Promise<MutationResponse> {
    return api.put<MutationResponse>(`/days-of-week/${dayOfWeekId}/locales/${localeId}`, body);
  },

  async removeLocale(dayOfWeekId: number, localeId: number): Promise<MutationResponse> {
    return api.delete<MutationResponse>(`/days-of-week/${dayOfWeekId}/locales/${localeId}`);
  },
};
