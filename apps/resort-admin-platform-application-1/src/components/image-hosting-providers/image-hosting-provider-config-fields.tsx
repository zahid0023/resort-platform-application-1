import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, KeyRound, Pencil, Plus, Trash2, X } from "lucide-react";
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
import type { ImageHostingProviderDialogMode, ImageHostingProviderFormState, ConfigFieldRow } from "./types";

type NewConfigFieldRow = ConfigFieldRow & { _rkey: string };

const FIELD_TYPE_SUGGESTIONS = ["TEXT", "PASSWORD", "NUMBER", "BOOLEAN", "URL"];

export interface ImageHostingProviderConfigFieldsProps {
  mode: ImageHostingProviderDialogMode;
  form: ImageHostingProviderFormState;
  onFormChange: (form: ImageHostingProviderFormState) => void;
  providerId?: number;
  onSaved?: () => void | Promise<void>;
  /** Reported upward automatically based on whether any row has an open edit draft. */
  onEditingChange: (v: boolean) => void;
  open: boolean;
}

export function ImageHostingProviderConfigFields({
  mode,
  form,
  onFormChange,
  providerId,
  onSaved,
  onEditingChange,
  open,
}: ImageHostingProviderConfigFieldsProps) {
  const { t } = useTranslation();
  const [newRows, setNewRows] = useState<NewConfigFieldRow[]>([]);
  const [rowEditData, setRowEditData] = useState<Record<string, ConfigFieldRow>>({});
  const [busyRowKeys, setBusyRowKeys] = useState<Set<string>>(new Set());
  const [pendingDeleteRow, setPendingDeleteRow] = useState<ConfigFieldRow | null>(null);
  const rKeyCounter = useRef(0);

  useEffect(() => {
    if (!open) {
      setNewRows([]);
      setRowEditData({});
      setBusyRowKeys(new Set());
    }
  }, [open]);

  // A config field is "being edited" whenever any row (existing or newly added) has an open draft —
  // there's no section-wide edit toggle anymore, so this is what drives isDirty upstream.
  useEffect(() => {
    onEditingChange(Object.keys(rowEditData).length > 0);
  }, [rowEditData]); // eslint-disable-line react-hooks/exhaustive-deps

  function rowKey(row: ConfigFieldRow): string {
    return row.id != null ? `e_${row.id}` : (row as NewConfigFieldRow)._rkey ?? "";
  }

  function isRowEditing(key: string) { return key in rowEditData; }
  function isRowBusy(key: string) { return busyRowKeys.has(key); }

  function startEditRow(key: string, row: ConfigFieldRow) {
    setRowEditData((prev) => ({ ...prev, [key]: { ...row } }));
  }

  function cancelEditRow(key: string, isNew: boolean) {
    setRowEditData((prev) => { const n = { ...prev }; delete n[key]; return n; });
    if (isNew) setNewRows((prev) => prev.filter((r) => r._rkey !== key));
  }

  function patchRowEdit(key: string, patch: Partial<ConfigFieldRow>) {
    setRowEditData((prev) => prev[key] ? { ...prev, [key]: { ...prev[key], ...patch } } : prev);
  }

  function setBusy(key: string, busy: boolean) {
    setBusyRowKeys((prev) => {
      const n = new Set(prev);
      busy ? n.add(key) : n.delete(key);
      return n;
    });
  }

  async function saveRow(key: string, row: ConfigFieldRow, isNew: boolean) {
    if (providerId == null) return;
    const data = rowEditData[key];
    if (!data) return;
    if (isNew && !data.key.trim()) { toast.error(t("toast.configFieldKeyRequired")); return; }
    if (!data.label.trim()) { toast.error(t("toast.configFieldLabelRequired")); return; }
    if (!data.field_type.trim()) { toast.error(t("toast.configFieldTypeRequired")); return; }
    setBusy(key, true);
    try {
      if (isNew) {
        await imageHostingProvidersService.addConfigField(providerId, {
          key: data.key.trim(),
          label: data.label.trim(),
          field_type: data.field_type.trim(),
          placeholder: data.placeholder.trim(),
          default_value: data.default_value.trim(),
          is_required: data.is_required,
          sort_order: Number(data.sort_order) || 0,
        });
        setNewRows((prev) => prev.filter((r) => r._rkey !== key));
      } else {
        await imageHostingProvidersService.updateConfigField(providerId, row.id!, {
          label: data.label.trim(),
          field_type: data.field_type.trim(),
          placeholder: data.placeholder.trim(),
          default_value: data.default_value.trim(),
          is_required: data.is_required,
          sort_order: Number(data.sort_order) || 0,
        });
      }
      setRowEditData((prev) => { const n = { ...prev }; delete n[key]; return n; });
      toast.success(t("common.saved"));
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
      await imageHostingProvidersService.removeConfigField(providerId, row.id!);
      toast.success(t("imageHostingProvider.configField.removedToast"));
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(key, false);
    }
  }

  function addNewRow() {
    const _rkey = `n_${rKeyCounter.current++}`;
    const newRow: NewConfigFieldRow = {
      _rkey,
      key: "",
      label: "",
      field_type: "TEXT",
      placeholder: "",
      default_value: "",
      is_required: true,
      sort_order: form.config_fields.length + newRows.length + 1,
      _new: true,
    };
    setNewRows((prev) => [...prev, newRow]);
    setRowEditData((prev) => ({ ...prev, [_rkey]: { ...newRow } }));
  }

  // CREATE mode — rows live only in `form.config_fields` until the whole provider is submitted.
  // New rows are prepended so adding one never requires scrolling down to see it.
  function addCreateRow() {
    onFormChange({
      ...form,
      config_fields: [
        {
          key: "",
          label: "",
          field_type: "TEXT",
          placeholder: "",
          default_value: "",
          is_required: true,
          sort_order: form.config_fields.length + 1,
          _new: true,
        },
        ...form.config_fields,
      ],
    });
  }

  function updateCreateRow(idx: number, patch: Partial<ConfigFieldRow>) {
    onFormChange({ ...form, config_fields: form.config_fields.map((row, i) => (i === idx ? { ...row, ...patch } : row)) });
  }

  function removeCreateRow(idx: number) {
    onFormChange({ ...form, config_fields: form.config_fields.filter((_, i) => i !== idx) });
  }

  // New rows render first, so adding one never requires scrolling down to see it.
  const allRows: Array<ConfigFieldRow & { _rkey: string }> = [
    ...newRows,
    ...form.config_fields.map((f) => ({ ...f, _rkey: `e_${f.id}` })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("imageHostingProvider.configFields")}
          </h3>
        </div>
        {mode !== "create" && (
          <Button type="button" size="sm" variant="outline" onClick={addNewRow} disabled={newRows.length > 0} className="h-7 text-xs px-2.5">
            <Plus className="h-3.5 w-3.5 mr-1" /> {t("imageHostingProvider.configField.add")}
          </Button>
        )}
        {mode === "create" && (
          <Button type="button" size="sm" variant="outline" onClick={addCreateRow} className="h-7 text-xs px-2.5">
            <Plus className="h-3.5 w-3.5 mr-1" /> {t("imageHostingProvider.configField.add")}
          </Button>
        )}
      </div>

      <Card className="gap-0 py-0 overflow-hidden">
        {/* CREATE mode — bundled directly into the create request, no API calls until submit */}
        {mode === "create" && (
          form.config_fields.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <KeyRound className="h-4 w-4 mr-2 opacity-40" />
              {t("imageHostingProvider.configField.empty.create")}
            </div>
          ) : (
            <div className="divide-y">
              {form.config_fields.map((row, idx) => (
                <div key={idx} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <ConfigFieldHeader row={row} isNew keyEditable />
                    <Button type="button" size="icon" variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeCreateRow(idx)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <ConfigFieldFields row={row} disabled={false} keyEditable onChange={(patch) => updateCreateRow(idx, patch)} listId={`cft-c_${idx}`} />
                </div>
              ))}
            </div>
          )
        )}

        {/* View/Edit — each config field is edited independently via its own pencil icon, no
            section-wide edit toggle required first */}
        {mode !== "create" && (
          allRows.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <KeyRound className="h-4 w-4 mr-2 opacity-40" />
              {t("imageHostingProvider.configField.empty.view")}
            </div>
          ) : (
            <div className="divide-y">
              {allRows.map((row) => {
                const key = row._rkey;
                const isNew = !!row._new;
                const rowEditing = isRowEditing(key);
                const busy = isRowBusy(key);
                const editData = rowEditData[key] ?? row;

                return (
                  <div key={key} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <ConfigFieldHeader row={row} isNew={isNew} keyEditable={false} />
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

                    <ConfigFieldFields
                      row={editData}
                      disabled={!rowEditing}
                      keyEditable={isNew}
                      onChange={(patch) => patchRowEdit(key, patch)}
                      listId={`cft-${key}`}
                    />
                  </div>
                );
              })}
            </div>
          )
        )}
      </Card>

      <AlertDialog open={!!pendingDeleteRow} onOpenChange={(o) => !o && setPendingDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("imageHostingProvider.configField.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("imageHostingProvider.configField.delete.desc")}</AlertDialogDescription>
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

interface ConfigFieldHeaderProps {
  row: ConfigFieldRow;
  isNew: boolean;
  keyEditable: boolean;
}

function ConfigFieldHeader({ row, isNew, keyEditable }: ConfigFieldHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
      {!keyEditable && row.key ? <span className="font-mono">{row.key}</span> : t("locale.row.new")}
      {isNew && (
        <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
          {t("locale.row.new")}
        </span>
      )}
    </div>
  );
}

interface ConfigFieldFieldsProps {
  row: ConfigFieldRow;
  disabled: boolean;
  keyEditable: boolean;
  onChange: (patch: Partial<ConfigFieldRow>) => void;
  listId: string;
}

function ConfigFieldFields({ row, disabled, keyEditable, onChange, listId }: ConfigFieldFieldsProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      {keyEditable && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("imageHostingProvider.configField.key")} {!disabled && "*"}</Label>
          <Input
            value={row.key}
            onChange={(e) => onChange({ key: e.target.value })}
            placeholder={t("placeholder.configFieldKey")}
            disabled={disabled}
            className="h-9 text-sm font-mono"
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("imageHostingProvider.configField.label")} {!disabled && "*"}</Label>
          <Input
            value={row.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder={t("placeholder.configFieldLabel")}
            disabled={disabled}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("imageHostingProvider.configField.fieldType")} {!disabled && "*"}</Label>
          <Input
            value={row.field_type}
            onChange={(e) => onChange({ field_type: e.target.value.toUpperCase() })}
            placeholder="TEXT"
            disabled={disabled}
            className="h-9 text-sm"
            list={disabled ? undefined : listId}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("imageHostingProvider.configField.placeholder")}</Label>
          <Input
            value={row.placeholder}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            disabled={disabled}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("imageHostingProvider.configField.defaultValue")}</Label>
          <Input
            value={row.default_value}
            onChange={(e) => onChange({ default_value: e.target.value })}
            disabled={disabled}
            className="h-9 text-sm"
          />
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        <Label className="text-xs text-muted-foreground">{t("imageHostingProvider.configField.required")}</Label>
        <Switch
          checked={row.is_required}
          onCheckedChange={(v) => onChange({ is_required: v })}
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t("field.sort")} {!disabled && "*"}</Label>
        <Input type="number"
          value={row.sort_order}
          onChange={(e) => onChange({ sort_order: Number(e.target.value) })}
          disabled={disabled}
          className="h-9 text-sm"
        />
      </div>
      {!disabled && (
        <datalist id={listId}>
          {FIELD_TYPE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
        </datalist>
      )}
    </div>
  );
}
