import type { Locale } from "@/services/locales";

export type CurrencyDialogMode = "create" | "edit" | "view";

export interface LocaleRow {
  id?: number;
  /** Present on existing rows — read from the API, immutable once created */
  locale?: Locale;
  /** Only set while adding a brand-new translation row — the language being assigned */
  locale_id?: number | "";
  name: string;
  short_name: string;
  sort_order: number;
  _new?: boolean;
}

export interface CurrencyFormState {
  country_id: number | "";
  code: string;
  numeric_code: string;
  symbol: string;
  decimal_places: number;
  is_default: boolean;
  sort_order: number;
  /** Create mode only — the single "en" translation created alongside the currency */
  locale: { name: string; short_name: string; sort_order: number };
  /** View/edit mode only — every existing translation, populated after creation */
  locales: LocaleRow[];
}
