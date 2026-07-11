export type ContactTypeDialogMode = "create" | "edit" | "view";

export interface LocaleRow {
  id?: number;
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
  _new?: boolean;
}

export interface ContactTypeFormState {
  code: string;
  sort_order: number;
  locales: LocaleRow[];
}
