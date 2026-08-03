import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Database, Eye, EyeOff, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@resort/shadcn-ui";
import { Card } from "@resort/shadcn-ui";
import { Input } from "@resort/shadcn-ui";
import { Label } from "@resort/shadcn-ui";
import { Switch } from "@resort/shadcn-ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@resort/shadcn-ui";
import { imageHostingProvidersService } from "@/services/image-hosting-providers";
import { toast } from "sonner";
import type { ImageHostingProviderFormState, ConfigFieldRow, ConfigRow } from "./types";

// Local edit draft — one value per config field, keyed by the field's `key`. Booleans are held as
// real booleans (for the Switch), everything else as the raw typed string (parsed/coerced on save).
interface ConfigEditDraft {
  name: string;
  values: Record<string, string | boolean>;
}

// A config field's `default_value` is always stored as a string on the schema (see ConfigFieldRow),
// regardless of `field_type` — this fills a fresh draft from either the config's existing values or
// each field's configured default.
function buildDraftValues(fields: ConfigFieldRow[], config: Record<string, unknown>): Record<string, string | boolean> {
  const values: Record<string, string | boolean> = {};
  for (const field of fields) {
    const raw = config[field.key];
    if (field.field_type === "BOOLEAN") {
      values[field.key] = typeof raw === "boolean" ? raw : raw != null ? Boolean(raw) : false;
    } else {
      values[field.key] = raw != null ? String(raw) : field.default_value;
    }
  }
  return values;
}

type NewConfigRow = ConfigRow & { _rkey: string };

export interface ImageHostingProviderConfigsProps {
  form: ImageHostingProviderFormState;
  onFormChange: (form: ImageHostingProviderFormState) => void;
  providerId?: number;
  onSaved?: () => void | Promise<void>;
  /** True while any single config row has an in-progress edit (existing or newly added). */
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  /** Clears search and re-pulls the complete unfiltered list before adding a new config row. */
  onPrepareAdd: () => void;
  /** Owned by the parent dialog — survives this component unmounting on tab switch. */
  search: string;
  onSearchChange: (v: string) => void;
  open: boolean;
}

export function ImageHostingProviderConfigs({
  form,
  onFormChange,
  providerId,
  onSaved,
  editing,
  onEditingChange,
  onPrepareAdd,
  search,
  onSearchChange,
  open,
}: ImageHostingProviderConfigsProps) {
  const { t } = useTranslation();
  const [newRows, setNewRows] = useState<NewConfigRow[]>([]);
  const [rowEditData, setRowEditData] = useState<Record<string, ConfigEditDraft>>({});
  const [busyRowKeys, setBusyRowKeys] = useState<Set<string>>(new Set());
  const [pendingDeleteRow, setPendingDeleteRow] = useState<ConfigRow | null>(null);
  const rKeyCounter = useRef(0);

  // Configs are never part of provider creation — the request has no `configs` field at all, and
  // this sub-resource requires an existing provider id. This tab stays disabled during create.
  function refreshConfigs(name?: string) {
    if (providerId == null) return;
    imageHostingProvidersService.listConfigs(providerId, { size: 50, name: name || undefined })
      .then((res) => {
        onFormChange({
          ...form,
          configs: res.data.map((c) => ({ id: c.id, name: c.name, config: c.config })),
        });
      })
      .catch((err) => toast.error((err as Error).message));
  }

  useEffect(() => {
    if (!open) {
      setNewRows([]);
      setRowEditData({});
      setBusyRowKeys(new Set());
    }
  }, [open]);

  // A config is "being edited" whenever any row (existing or newly added) has an open draft —
  // there's no section-wide edit toggle anymore, so this is what drives isDirty upstream.
  useEffect(() => {
    onEditingChange(Object.keys(rowEditData).length > 0);
  }, [rowEditData]); // eslint-disable-line react-hooks/exhaustive-deps

  function rowKey(row: ConfigRow): string {
    return row.id != null ? `e_${row.id}` : (row as NewConfigRow)._rkey ?? "";
  }

  function isRowEditing(key: string) { return key in rowEditData; }
  function isRowBusy(key: string) { return busyRowKeys.has(key); }

  function startEditRow(key: string, row: ConfigRow) {
    setRowEditData((prev) => ({ ...prev, [key]: { name: row.name, values: buildDraftValues(form.config_fields, row.config) } }));
  }

  function cancelEditRow(key: string, isNew: boolean) {
    setRowEditData((prev) => { const n = { ...prev }; delete n[key]; return n; });
    if (isNew) setNewRows((prev) => prev.filter((r) => r._rkey !== key));
  }

  function patchRowName(key: string, name: string) {
    setRowEditData((prev) => prev[key] ? { ...prev, [key]: { ...prev[key], name } } : prev);
  }

  function patchFieldValue(key: string, fieldKey: string, value: string | boolean) {
    setRowEditData((prev) => {
      const draft = prev[key];
      if (!draft) return prev;
      return { ...prev, [key]: { ...draft, values: { ...draft.values, [fieldKey]: value } } };
    });
  }

  function setBusy(key: string, busy: boolean) {
    setBusyRowKeys((prev) => {
      const n = new Set(prev);
      busy ? n.add(key) : n.delete(key);
      return n;
    });
  }

  async function saveRow(key: string, row: ConfigRow, isNew: boolean) {
    if (providerId == null) return;
    const data = rowEditData[key];
    if (!data) return;
    if (!data.name.trim()) { toast.error(t("toast.configNameRequired")); return; }
    const parsedConfig: Record<string, unknown> = {};
    for (const field of form.config_fields) {
      if (field.field_type === "BOOLEAN") {
        parsedConfig[field.key] = !!data.values[field.key];
        continue;
      }
      const raw = data.values[field.key];
      const strVal = typeof raw === "string" ? raw.trim() : "";
      if (field.is_required && !strVal) {
        toast.error(t("toast.configValueRequired", { field: field.label }));
        return;
      }
      parsedConfig[field.key] = field.field_type === "NUMBER" ? (Number(strVal) || 0) : strVal;
    }
    setBusy(key, true);
    try {
      if (isNew) {
        await imageHostingProvidersService.createConfig(providerId, { name: data.name.trim(), config: parsedConfig });
        setNewRows((prev) => prev.filter((r) => r._rkey !== key));
      } else {
        await imageHostingProvidersService.updateConfig(providerId, row.id!, { name: data.name.trim(), config: parsedConfig });
      }
      setRowEditData((prev) => { const n = { ...prev }; delete n[key]; return n; });
      toast.success(t("common.saved"));
      refreshConfigs();
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(key, false);
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteRow || providerId == null || !pendingDeleteRow.id) return;
    const row = pendingDeleteRow;
    const key = rowKey(row);
    setPendingDeleteRow(null);
    setBusy(key, true);
    try {
      await imageHostingProvidersService.removeConfig(providerId, row.id!);
      toast.success(t("imageHostingProvider.config.removedToast"));
      refreshConfigs();
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(key, false);
    }
  }

  function addNewRow() {
    const _rkey = `n_${rKeyCounter.current++}`;
    const newRow: NewConfigRow = { _rkey, name: "", config: {}, _new: true };
    setNewRows((prev) => [...prev, newRow]);
    setRowEditData((prev) => ({ ...prev, [_rkey]: { name: "", values: buildDraftValues(form.config_fields, {}) } }));
  }

  // Adding a config clears any active search and re-pulls the complete list first, so the new
  // draft row doesn't get appended on top of a filtered view. Used by both the header Add button
  // and the empty-state shortcut.
  function handleAddConfig() {
    onPrepareAdd();
    addNewRow();
  }

  // New rows render first, so adding one never requires scrolling down to see it.
  const allRows: Array<ConfigRow & { _rkey: string }> = [
    ...newRows,
    ...form.configs.map((c) => ({ ...c, _rkey: `e_${c.id}` })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("imageHostingProvider.configs")}
          </h3>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={handleAddConfig} disabled={newRows.length > 0} className="h-7 text-xs px-2.5">
          <Plus className="h-3.5 w-3.5 mr-1" /> {t("imageHostingProvider.config.add")}
        </Button>
      </div>

      {/* Search is view mode only — edit mode always needs the complete, unfiltered list. */}
      {!editing && (form.configs.length > 0 || search.trim() !== "") && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("imageHostingProvider.config.searchByName")}
            className="pl-8 h-8 text-sm"
          />
        </div>
      )}

      <Card className="gap-0 py-0 overflow-hidden">
        {/* Each config is edited independently via its own pencil icon, no section-wide edit
            toggle required first */}
        {allRows.length === 0 ? (
          search.trim() !== "" ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Search className="h-4 w-4 mr-2 opacity-40" />
              {t("imageHostingProvider.config.noSearchMatch")}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Database className="h-4 w-4 mr-2 opacity-40" />
                {t("imageHostingProvider.config.empty.view")}
              </div>
              <Button type="button" size="sm" variant="outline" onClick={handleAddConfig} className="h-7 text-xs px-2.5 gap-1.5">
                <Plus className="h-3.5 w-3.5" /> {t("imageHostingProvider.config.addFirst")}
              </Button>
            </div>
          )
        ) : (
          <div className="divide-y">
            {allRows.map((row) => {
              const key = row._rkey;
              const isNew = !!row._new;
              const rowEditing = isRowEditing(key);
              const busy = isRowBusy(key);
              const editData = rowEditData[key] ?? { name: row.name, values: buildDraftValues(form.config_fields, row.config) };

              return (
                <div key={key} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Database className="h-3.5 w-3.5 text-muted-foreground" />
                      {!isNew ? row.name : t("locale.row.new")}
                      {isNew && (
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                          {t("locale.row.new")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!rowEditing && (
                        <>
                          <Button type="button" size="icon" variant="ghost"
                            className="h-7 w-7"
                            onClick={() => startEditRow(key, row)}
                            disabled={busy}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {!isNew && (
                            <Button type="button" size="icon" variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => setPendingDeleteRow(row)}
                              disabled={busy}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                      {rowEditing && (
                        <>
                          <Button type="button" size="icon" variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => cancelEditRow(key, isNew)}
                            disabled={busy}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                          <Button type="button" size="icon" variant="ghost"
                            className="h-7 w-7 text-primary"
                            onClick={() => saveRow(key, row, isNew)}
                            disabled={busy}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{t("imageHostingProvider.config.name")} *</Label>
                    <Input
                      value={editData.name}
                      onChange={(e) => patchRowName(key, e.target.value)}
                      placeholder={form.name.trim() ? t("placeholder.configNameForProvider", { provider: form.name.trim() }) : t("placeholder.configName")}
                      disabled={!rowEditing}
                      className="h-9 text-sm"
                    />
                  </div>

                  {[...form.config_fields].sort((a, b) => a.sort_order - b.sort_order).map((field) => (
                    <ConfigValueField
                      key={field.key}
                      field={field}
                      value={editData.values[field.key] ?? (field.field_type === "BOOLEAN" ? false : "")}
                      disabled={!rowEditing}
                      onChange={(v) => patchFieldValue(key, field.key, v)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <AlertDialog open={!!pendingDeleteRow} onOpenChange={(o) => !o && setPendingDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("imageHostingProvider.config.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("imageHostingProvider.config.delete.desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ConfigValueFieldProps {
  field: ConfigFieldRow;
  value: string | boolean;
  disabled: boolean;
  onChange: (v: string | boolean) => void;
}

// One input per config field, typed off `field.field_type` — mirrors how ConfigFieldFields renders
// the schema itself, except this renders a *value* against that schema rather than the schema fields.
function ConfigValueField({ field, value, disabled, onChange }: ConfigValueFieldProps) {
  if (field.field_type === "BOOLEAN") {
    return (
      <div className="flex items-center justify-between pt-1">
        <Label className="text-xs text-muted-foreground">{field.label}</Label>
        <Switch checked={!!value} onCheckedChange={onChange} disabled={disabled} />
      </div>
    );
  }

  if (field.field_type === "PASSWORD") {
    return <ConfigPasswordField field={field} value={value as string} disabled={disabled} onChange={onChange} />;
  }

  const inputType = field.field_type === "NUMBER" ? "number" : field.field_type === "URL" ? "url" : "text";

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{field.label} {field.is_required && !disabled && "*"}</Label>
      <Input
        type={inputType}
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || undefined}
        disabled={disabled}
        className="h-9 text-sm"
      />
    </div>
  );
}

interface ConfigPasswordFieldProps {
  field: ConfigFieldRow;
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
}

// The reveal toggle only appears once the field actually has a value to show — an empty
// PASSWORD input has nothing to reveal, so the button stays hidden until there's input.
function ConfigPasswordField({ field, value, disabled, onChange }: ConfigPasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const hasValue = value.trim() !== "";

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{field.label} {field.is_required && !disabled && "*"}</Label>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || undefined}
          disabled={disabled}
          className={hasValue ? "h-9 text-sm pr-9" : "h-9 text-sm"}
        />
        {hasValue && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            tabIndex={-1}
          >
            {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}
