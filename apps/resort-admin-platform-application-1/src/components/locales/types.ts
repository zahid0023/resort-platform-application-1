export type LocaleDialogMode = "create" | "view";

export interface LocaleFormState {
  code: string;
  name: string;
  sort_order: number;
}
