import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@resort/shadcn-ui";
import { Card, CardContent } from "@resort/shadcn-ui";
import { Input } from "@resort/shadcn-ui";
import { Label } from "@resort/shadcn-ui";
import { Textarea } from "@resort/shadcn-ui";
import { imageHostingProvidersService } from "@/services/image-hosting-providers";
import { toast } from "sonner";
import type { ImageHostingProviderDialogMode, ImageHostingProviderFormState } from "./types";

interface LocalState {
  name: string;
  description: string;
  sort_order: number;
}

export interface ImageHostingProviderGeneralInfoProps {
  mode: ImageHostingProviderDialogMode;
  form: ImageHostingProviderFormState;
  onFormChange: (patch: Partial<ImageHostingProviderFormState>) => void;
  providerId?: number;
  onSaved?: () => void | Promise<void>;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  open: boolean;
}

export function ImageHostingProviderGeneralInfo({
  mode,
  form,
  onFormChange,
  providerId,
  onSaved,
  editing,
  onEditingChange,
  open,
}: ImageHostingProviderGeneralInfoProps) {
  const { t } = useTranslation();
  const [local, setLocal] = useState<LocalState>({ name: "", description: "", sort_order: 0 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setSubmitting(false);
  }, [open]);

  function startEdit() {
    setLocal({ name: form.name, description: form.description, sort_order: form.sort_order });
    onEditingChange(true);
  }

  async function save() {
    if (providerId == null) return;
    if (!local.name.trim()) { toast.error(t("toast.nameRequired")); return; }
    setSubmitting(true);
    try {
      await imageHostingProvidersService.update(providerId, {
        name: local.name.trim(),
        description: local.description.trim(),
        sort_order: Number(local.sort_order) || 0,
      });
      toast.success(t("imageHostingProvider.updatedToast"));
      onEditingChange(false);
      onFormChange({
        name: local.name.trim(),
        description: local.description.trim(),
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
  const descriptionValue = editing ? local.description : form.description;
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
            <Label htmlFor="ihp-code" className="text-xs font-medium">{t("common.code")} *</Label>
            <Input
              id="ihp-code"
              value={form.code}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                if (value.length > 50) { toast.error(t("toast.providerCodeMaxLength")); return; }
                onFormChange({ code: value });
              }}
              placeholder={t("placeholder.providerCode")}
              required
              disabled={mode !== "create"}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ihp-name" className="text-xs font-medium">{t("common.name")} *</Label>
            <Input
              id="ihp-name"
              value={nameValue}
              onChange={(e) => {
                if (e.target.value.length > 100) { toast.error(t("toast.nameMaxLength")); return; }
                mode === "create" ? onFormChange({ name: e.target.value }) : setLocal((p) => ({ ...p, name: e.target.value }));
              }}
              placeholder={t("placeholder.providerName")}
              required
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ihp-description" className="text-xs font-medium">{t("common.description")}</Label>
            <Textarea
              id="ihp-description"
              value={descriptionValue}
              onChange={(e) =>
                mode === "create"
                  ? onFormChange({ description: e.target.value })
                  : setLocal((p) => ({ ...p, description: e.target.value }))
              }
              placeholder={t("placeholder.providerDescription")}
              rows={2}
              disabled={isReadOnly}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ihp-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
            <Input
              id="ihp-sort"
              type="number"
              value={sortValue}
              onChange={(e) =>
                mode === "create"
                  ? onFormChange({ sort_order: Number(e.target.value) })
                  : setLocal((p) => ({ ...p, sort_order: Number(e.target.value) }))
              }
              required={mode === "create"}
              disabled={isReadOnly}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
