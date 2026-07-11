export type CommunicationChannelDialogMode = "create" | "edit" | "view";

export interface LocaleRow {
  id?: number;
  locale_id: number | "";
  name: string;
  description: string;
  sort_order: number;
  _new?: boolean;
}

export interface CommunicationChannelFormState {
  code: string;
  sort_order: number;
  is_url: boolean;
  is_phone: boolean;
  is_email: boolean;
  is_clickable: boolean;
  locales: LocaleRow[];
}
