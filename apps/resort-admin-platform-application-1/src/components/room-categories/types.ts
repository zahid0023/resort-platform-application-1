import type { Locale } from "@/services/locales";

export type RoomCategoryDialogMode = "create" | "edit" | "view";

export interface LocaleRow {
  id?: number;
  /** Present on existing rows — read from the API, immutable once created */
  locale?: Locale;
  /** Only set while adding a brand-new translation row — the language being assigned */
  locale_id?: number | "";
  name: string;
  description: string;
  sort_order: number;
  _new?: boolean;
}

export interface RoomCategoryFormState {
  code: string;
  sort_order: number;
  /** Create mode only — the single "en" translation created alongside the room category */
  locale: { name: string; description: string; sort_order: number };
  /** View/edit mode only — every existing translation, populated after creation */
  locales: LocaleRow[];
}
