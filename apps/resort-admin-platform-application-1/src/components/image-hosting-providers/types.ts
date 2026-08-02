export type ImageHostingProviderDialogMode = "create" | "edit" | "view";

export interface ConfigFieldRow {
  id?: number;
  /** Immutable once created — only editable while the row is brand-new (`_new`) */
  key: string;
  label: string;
  field_type: string;
  placeholder: string;
  default_value: string;
  is_required: boolean;
  sort_order: number;
  _new?: boolean;
}

export interface ImageHostingProviderFormState {
  code: string;
  name: string;
  description: string;
  sort_order: number;
  /** View/edit only — config fields can only be added once the provider exists, populated after creation */
  config_fields: ConfigFieldRow[];
}
