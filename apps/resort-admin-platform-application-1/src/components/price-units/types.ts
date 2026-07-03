export type PriceUnitDialogMode = "create" | "edit" | "view";

export interface LocaleRow {
  id?: number;
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
  calculation_method: string;
  usage_example: string;
  _new?: boolean;
}

export interface PriceUnitFormState {
  code: string;
  sort_order: number;
  locales: LocaleRow[];
}
