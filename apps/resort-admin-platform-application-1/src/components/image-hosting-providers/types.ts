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

export interface ConfigRow {
  id?: number;
  name: string;
  config: Record<string, unknown>;
  _new?: boolean;
}

export interface ImageHostingProviderFormState {
  code: string;
  name: string;
  description: string;
  sort_order: number;
  /** View/edit only — populated lazily by the dialog the first time the Config Fields tab is selected */
  config_fields: ConfigFieldRow[];
  /** View/edit only — populated lazily by the dialog the first time the Configs tab is selected; configs can only be created once the provider exists, and are never part of the create request */
  configs: ConfigRow[];
}
