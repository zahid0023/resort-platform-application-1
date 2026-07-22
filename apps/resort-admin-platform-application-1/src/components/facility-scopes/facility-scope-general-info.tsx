import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@resort/shadcn-ui";
import { Card, CardContent } from "@resort/shadcn-ui";
import { Input } from "@resort/shadcn-ui";
import { Label } from "@resort/shadcn-ui";
import { facilityScopesService } from "@/services/facility-scopes";
import { toast } from "sonner";
import type { FacilityScopeFormState } from "./types";

export interface FacilityScopeGeneralInfoProps {
  form: FacilityScopeFormState;
  onFormChange: (patch: Partial<FacilityScopeFormState>) => void;
  facilityScopeId?: number;
  onSaved?: () => void | Promise<void>;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  open: boolean;
}

export function FacilityScopeGeneralInfo({
  form,
  onFormChange,
  facilityScopeId,
  onSaved,
  editing,
  onEditingChange,
  open,
}: FacilityScopeGeneralInfoProps) {
  const { t } = useTranslation();
  const [local, setLocal] = useState({ sort_order: 0 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setSubmitting(false);
  }, [open]);

  function startEdit() {
    setLocal({ sort_order: form.sort_order });
    onEditingChange(true);
  }

  async function save() {
    if (facilityScopeId == null) return;
    setSubmitting(true);
    try {
      await facilityScopesService.update(facilityScopeId, {
        sort_order: Number(local.sort_order) || 0,
      });
      toast.success(t("facilityScope.updatedToast"));
      onEditingChange(false);
      onFormChange({ sort_order: Number(local.sort_order) || 0 });
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const sortValue = editing ? local.sort_order : form.sort_order;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("common.generalInfo")}
          </h3>
        </div>
        {!editing && (
          <Button type="button" size="sm" variant="outline" onClick={startEdit} className="h-7 text-xs px-2.5 gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
          </Button>
        )}
        {editing && (
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onEditingChange(false)}
              disabled={submitting}
              className="h-7 text-xs px-2.5 gap-1.5"
            >
              <X className="h-3.5 w-3.5" /> {t("common.cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={save}
              disabled={submitting}
              className="h-7 text-xs px-2.5 gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              {submitting ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fs-code" className="text-xs font-medium">{t("common.code")}</Label>
            <Input
              id="fs-code"
              value={form.code}
              disabled
              className="font-mono"
              onChange={() => {}}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fs-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
            <Input
              id="fs-sort"
              type="number"
              value={sortValue}
              onChange={(e) => setLocal((p) => ({ ...p, sort_order: Number(e.target.value) }))}
              disabled={!editing}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
