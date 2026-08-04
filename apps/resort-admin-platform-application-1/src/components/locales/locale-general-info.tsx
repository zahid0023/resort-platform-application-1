import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@resort/shadcn-ui";
import { Card, CardContent } from "@resort/shadcn-ui";
import { Input } from "@resort/shadcn-ui";
import { Label } from "@resort/shadcn-ui";
import { localesService } from "@/services/locales";
import { toast } from "sonner";
import type { LocaleDialogMode, LocaleFormState } from "./types";

export interface LocaleGeneralInfoProps {
  mode: LocaleDialogMode;
  form: LocaleFormState;
  onFormChange: (patch: Partial<LocaleFormState>) => void;
  localeId?: number;
  onSaved?: () => void | Promise<void>;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  open: boolean;
}

export function LocaleGeneralInfo({
  mode,
  form,
  onFormChange,
  localeId,
  onSaved,
  editing,
  onEditingChange,
  open,
}: LocaleGeneralInfoProps) {
  const { t } = useTranslation();
  const [local, setLocal] = useState({ name: "", sort_order: 0 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setSubmitting(false);
  }, [open]);

  function startEdit() {
    setLocal({ name: form.name, sort_order: form.sort_order });
    onEditingChange(true);
  }

  async function save() {
    if (localeId == null) return;
    if (!local.name.trim()) { toast.error(t("toast.codeRequired")); return; }
    setSubmitting(true);
    try {
      await localesService.update(localeId, {
        name: local.name.trim(),
        sort_order: Number(local.sort_order) || 0,
      });
      toast.success(t("localeDialog.updated"));
      onEditingChange(false);
      onFormChange({
        name: local.name.trim(),
        sort_order: Number(local.sort_order) || 0,
      });
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const nameValue = editing ? local.name : form.name;
  const sortValue = editing ? local.sort_order : form.sort_order;
  const isReadOnly = !editing && mode !== "create";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("common.generalInfo")}
          </h3>
        </div>
        {mode !== "create" && !editing && (
          <Button type="button" size="sm" variant="outline" onClick={startEdit} className="h-7 text-xs px-2.5 gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
          </Button>
        )}
        {editing && (
          <div className="flex items-center gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={() => onEditingChange(false)} disabled={submitting} className="h-7 text-xs px-2.5 gap-1.5">
              <X className="h-3.5 w-3.5" /> {t("common.cancel")}
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={submitting} className="h-7 text-xs px-2.5 gap-1.5">
              <Check className="h-3.5 w-3.5" />
              {submitting ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="locale-code" className="text-xs font-medium">{t("common.code")} *</Label>
            <Input
              id="locale-code"
              value={form.code}
              onChange={(e) => onFormChange({ code: e.target.value })}
              placeholder={t("localeDialog.codePlaceholder")}
              required
              disabled={mode !== "create"}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="locale-name" className="text-xs font-medium">{t("common.name")} *</Label>
            <Input
              id="locale-name"
              value={nameValue}
              onChange={(e) => mode === "create" ? onFormChange({ name: e.target.value }) : setLocal((p) => ({ ...p, name: e.target.value }))}
              placeholder={t("localeDialog.namePlaceholder")}
              required={mode === "create"}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="locale-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
            <Input
              id="locale-sort"
              type="number"
              value={sortValue}
              onChange={(e) => mode === "create" ? onFormChange({ sort_order: Number(e.target.value) }) : setLocal((p) => ({ ...p, sort_order: Number(e.target.value) }))}
              required={mode === "create"}
              disabled={isReadOnly}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
