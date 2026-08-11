import type { Locale } from "@/services/locales";
import type { PriceScope } from "@/services/price-scopes";

export type PriceUnitDialogMode = "create" | "edit" | "view";

export interface LocaleRow {
  id?: number;
  /** Present on existing rows — read from the API, immutable once created */
  locale?: Locale;
  /** Only set while adding a brand-new translation row — the language being assigned */
  locale_id?: number | "";
  name: string;
  description: string;
  sort_order: number;
  purpose: string;
  usage_example: string;
  _new?: boolean;
}

export interface PriceUnitFormState {
  code: string;
  sort_order: number;
  /** Create mode only — the single "en" translation created alongside the price unit */
  locale: { name: string; description: string; sort_order: number; purpose: string; usage_example: string };
  /** View/edit mode only — every existing translation, populated after creation */
  locales: LocaleRow[];
  /** Create mode only — price scopes picked via PriceScopePickerDialog, sent as price_scope_ids. At
   * least one is required — the API rejects an empty price_scope_ids array with 400 INVALID_ARGUMENT. */
  scopes: PriceScope[];
  /** View/edit mode only — the price unit's currently assigned scopes, from GET /price-units/{id}'s
   * embedded price_scopes (fetched once when the card is clicked). Read-only display — scope
   * assignment changes after creation go through the separate Price Unit Scope Assignments resource. */
  price_scopes: PriceScope[];
}
