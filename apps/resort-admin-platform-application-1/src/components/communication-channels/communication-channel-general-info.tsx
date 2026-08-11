import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@resort/shadcn-ui";
import { Card, CardContent } from "@resort/shadcn-ui";
import { Input } from "@resort/shadcn-ui";
import { Label } from "@resort/shadcn-ui";
import { Switch } from "@resort/shadcn-ui";
import { communicationChannelsService } from "@/services/communication-channels";
import { toast } from "sonner";
import type { CommunicationChannelDialogMode, CommunicationChannelFormState } from "./types";

const CODE_MAX_LENGTH = 50;

interface LocalFlags {
  sort_order: number;
  is_url: boolean;
  is_phone: boolean;
  is_email: boolean;
  is_clickable: boolean;
}

export interface CommunicationChannelGeneralInfoProps {
  mode: CommunicationChannelDialogMode;
  form: CommunicationChannelFormState;
  onFormChange: (patch: Partial<CommunicationChannelFormState>) => void;
  channelId?: number;
  onSaved?: () => void | Promise<void>;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  open: boolean;
}

export function CommunicationChannelGeneralInfo({
  mode,
  form,
  onFormChange,
  channelId,
  onSaved,
  editing,
  onEditingChange,
  open,
}: CommunicationChannelGeneralInfoProps) {
  const { t } = useTranslation();
  const [local, setLocal] = useState<LocalFlags>({
    sort_order: 0,
    is_url: false,
    is_phone: false,
    is_email: false,
    is_clickable: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setSubmitting(false);
  }, [open]);

  function startEdit() {
    setLocal({
      sort_order: form.sort_order,
      is_url: form.is_url,
      is_phone: form.is_phone,
      is_email: form.is_email,
      is_clickable: form.is_clickable,
    });
    onEditingChange(true);
  }

  async function save() {
    if (channelId == null) return;
    if (!local.is_phone && !local.is_email && !local.is_url) {
      toast.error(t("toast.commChannelTypeRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await communicationChannelsService.update(channelId, {
        sort_order: Number(local.sort_order) || 0,
        is_url: local.is_url,
        is_phone: local.is_phone,
        is_email: local.is_email,
        is_clickable: local.is_clickable,
      });
      toast.success(t("commChannel.updated"));
      onEditingChange(false);
      onFormChange({
        sort_order: Number(local.sort_order) || 0,
        is_url: local.is_url,
        is_phone: local.is_phone,
        is_email: local.is_email,
        is_clickable: local.is_clickable,
      });
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const sortValue = editing ? local.sort_order : form.sort_order;
  const flags = editing ? local : form;
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
            <Label htmlFor="cc-code" className="text-xs font-medium">{t("common.code")} *</Label>
            <Input
              id="cc-code"
              value={form.code}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                if (value.length > CODE_MAX_LENGTH) { toast.error(t("toast.commChannelCodeMaxLength")); return; }
                onFormChange({ code: value });
              }}
              placeholder="PHONE" required disabled={mode !== "create"} className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cc-sort" className="text-xs font-medium">{t("field.sort")} *</Label>
            <Input
              id="cc-sort"
              type="number"
              value={sortValue}
              onChange={(e) =>
                mode === "create"
                  ? onFormChange({ sort_order: Number(e.target.value) })
                  : setLocal((p) => ({ ...p, sort_order: Number(e.target.value) }))
              }
              required={mode === "create"} disabled={isReadOnly}
            />
          </div>
          <div className="space-y-3 pt-1">
            <Label className="text-xs font-medium">{t("commChannelField.valueType")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["is_phone", "is_email", "is_url"] as const).map((flag) => {
                const active = flags[flag];
                return (
                  <button
                    key={flag}
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => {
                      const patch = { is_phone: false, is_email: false, is_url: false, [flag]: true };
                      if (mode === "create") onFormChange(patch);
                      else setLocal((p) => ({ ...p, ...patch }));
                    }}
                    className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${active ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted"} disabled:opacity-60 disabled:pointer-events-none`}
                  >
                    {t(`commChannelField.${flag}`)}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">{t("commChannelField.is_clickable")}</Label>
              <Switch
                checked={flags.is_clickable}
                onCheckedChange={(v) => {
                  if (mode === "create") onFormChange({ is_clickable: v });
                  else setLocal((p) => ({ ...p, is_clickable: v }));
                }}
                disabled={isReadOnly}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
