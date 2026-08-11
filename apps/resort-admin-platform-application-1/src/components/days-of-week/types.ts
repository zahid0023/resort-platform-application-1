import type { Locale } from "@/services/locales";

export interface LocaleRow {
  id?: number;
  /** Present on existing rows — read from the API, immutable once created */
  locale?: Locale;
  /** Only set while adding a brand-new translation row — the language being assigned */
  locale_id?: number | "";
  name: string;
  short_name: string;
  description: string;
  sort_order: number;
  _new?: boolean;
}

export interface DayOfWeekFormState {
  code: string;
  sort_order: number;
  /** Every existing translation for this day — populated lazily by the dialog the first time the
   * Translations tab is selected (see `country_pattern` memory for why: GET /days-of-week/{id} only
   * ever returns the single Accept-Language-matched translation, never the full set). */
  locales: LocaleRow[];
}

export const emptyDayOfWeekForm: DayOfWeekFormState = {
  code: "",
  sort_order: 0,
  locales: [],
};
