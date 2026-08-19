import { api } from "./api";
import type { Locale } from "./locales";

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
  /** The single translation matching Accept-Language (falls back to en, then null). */
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
}

export interface ListDaysOfWeekParams {
  page?: number;
  size?: number;
  sort_by?: "createdAt" | "code" | "sortOrder" | "name" | "shortName";
  sort_dir?: "ASC" | "DESC";
}

// Read-only in the owner app — the seven days are a platform-seeded lookup list managed
// exclusively through the admin app; this service only ever needs to list them for pickers.
export const daysOfWeekService = {
  async list(params: ListDaysOfWeekParams = {}): Promise<DayOfWeekListResponse> {
    const { page = 0, size = 10, sort_by, sort_dir } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (sort_by) query.set("sortBy", sort_by);
    if (sort_dir) query.set("sortDir", sort_dir);
    return api.get<DayOfWeekListResponse>(`/days-of-week?${query}`);
  },
};
