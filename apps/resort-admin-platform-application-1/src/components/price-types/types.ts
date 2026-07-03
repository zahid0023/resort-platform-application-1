export type PriceTypeDialogMode = "create" | "edit" | "view";

export interface LocaleRow {
  id?: number;
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
  purpose: string;
  usage_example: string;
  _new?: boolean;
}

export interface PriceTypeFormState {
  code: string;
  sort_order: number;
  locales: LocaleRow[];
}
