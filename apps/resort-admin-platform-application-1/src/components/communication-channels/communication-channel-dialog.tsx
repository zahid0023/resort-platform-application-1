import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Radio } from "lucide-react";
import { Dialog, DialogContent } from "@resort/shadcn-ui";
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
import { DialogEntityHeader } from "@/components/shared/dialog-entity-header";
import { DialogCreateFooter } from "@/components/shared/dialog-create-footer";
import { communicationChannelsService } from "@/services/communication-channels";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import type { CommunicationChannelDialogMode, CommunicationChannelFormState } from "./types";
import { CommunicationChannelGeneralInfo } from "./communication-channel-general-info";
import { CommunicationChannelLocaleTranslations } from "./communication-channel-locale-translations";

export const emptyCommChannelForm: CommunicationChannelFormState = {
  code: "",
  sort_order: 0,
  is_url: false,
  is_phone: false,
  is_email: false,
  is_clickable: false,
  locales: [{ locale_id: "", name: "", description: "", sort_order: 0 }],
};

export interface CommunicationChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: CommunicationChannelDialogMode;
  channelId?: number;
  form: CommunicationChannelFormState;
  onFormChange: (form: CommunicationChannelFormState) => void;
  availableLocales: Locale[];
  onSaved?: () => void | Promise<void>;
}

export function CommunicationChannelDialog({
  open,
  onOpenChange,
  mode,
  channelId,
  form,
  onFormChange,
  availableLocales,
  onSaved,
}: CommunicationChannelDialogProps) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [generalEditing, setGeneralEditing] = useState(false);
  const [translationsEditing, setTranslationsEditing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    if (!open) {
      setGeneralEditing(false);
      setTranslationsEditing(false);
      setConfirmClose(false);
    }
  }, [open]);

  const isDirty = mode === "create"
    ? form.code.trim() !== ""
      || form.locales.length > 1
      || form.locales.some((l) => l.locale_id !== "" || l.name.trim() !== "")
    : generalEditing || translationsEditing;

  function requestClose() {
    if (isDirty) setConfirmClose(true);
    else onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode !== "create") return;
    if (!form.code.trim()) { toast.error(t("toast.codeRequired")); return; }
    if (!form.is_phone && !form.is_email && !form.is_url) { toast.error(t("toast.commChannelTypeRequired")); return; }
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) { toast.error(t("toast.localeSelectLang", { n: i + 1 })); return; }
      if (!row.name.trim()) { toast.error(t("toast.localeNameRequired", { n: i + 1 })); return; }
    }
    setSubmitting(true);
    try {
      const code = form.code.trim().toUpperCase();
      await communicationChannelsService.create({
        code,
        sort_order: Number(form.sort_order) || 0,
        is_url: form.is_url,
        is_phone: form.is_phone,
        is_email: form.is_email,
        is_clickable: form.is_clickable,
        locales: form.locales.map((row) => ({
          locale_id: Number(row.locale_id),
          name: row.name.trim(),
          description: row.description.trim() || undefined,
          sort_order: Number(row.sort_order) || 0,
        })),
      });
      toast.success(t("commChannel.created"));
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const isEditing = generalEditing || translationsEditing;
  const headerTitle = mode === "create"
    ? t("commChannelDialog.create")
    : (isEditing ? t("commChannelDialog.edit") : t("commChannelDialog.view"));
  const headerDesc = mode === "create"
    ? t("commChannelDialog.descCreate")
    : (isEditing ? t("commChannelDialog.descEdit") : t("commChannelDialog.descView"));

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose(); }}>
        <DialogContent
          className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose(); }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">

            <DialogEntityHeader icon={<Radio className="h-4 w-4" />} title={headerTitle} description={headerDesc} />

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <CommunicationChannelGeneralInfo
                mode={mode}
                form={form}
                onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                channelId={channelId}
                onSaved={onSaved}
                editing={generalEditing}
                onEditingChange={setGeneralEditing}
                open={open}
              />
              <CommunicationChannelLocaleTranslations
                mode={mode}
                form={form}
                onFormChange={onFormChange}
                channelId={channelId}
                availableLocales={availableLocales}
                onSaved={onSaved}
                editing={translationsEditing}
                onEditingChange={setTranslationsEditing}
                open={open}
              />
            </div>

            {mode === "create" && (
              <DialogCreateFooter submitting={submitting} onCancel={requestClose} />
            )}

          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialog.discardChanges.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("dialog.discardChanges.desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onOpenChange(false)}>{t("dialog.discardChanges.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
