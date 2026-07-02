import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
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
import { localesService } from "@/services/locales";
import { toast } from "sonner";
import type { LocaleDialogMode, LocaleFormState } from "./types";
import { LocaleGeneralInfo } from "./locale-general-info";

export const emptyLocaleForm: LocaleFormState = {
  code: "",
  name: "",
  sort_order: 0,
};

export interface LocaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: LocaleDialogMode;
  localeId?: number;
  form: LocaleFormState;
  onFormChange: (form: LocaleFormState) => void;
  onSaved?: () => void | Promise<void>;
}

export function LocaleDialog({
  open,
  onOpenChange,
  mode,
  localeId,
  form,
  onFormChange,
  onSaved,
}: LocaleDialogProps) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [generalEditing, setGeneralEditing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    if (!open) {
      setGeneralEditing(false);
      setConfirmClose(false);
    }
  }, [open]);

  const isDirty = mode === "create"
    ? form.code.trim() !== "" || form.name.trim() !== "" || form.sort_order !== 0
    : generalEditing;

  function requestClose() {
    if (isDirty) setConfirmClose(true);
    else onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode !== "create") return;
    if (!form.code.trim()) { toast.error(t("toast.codeRequired")); return; }
    if (!form.name.trim()) { toast.error(t("toast.codeRequired")); return; }
    setSubmitting(true);
    try {
      await localesService.create({
        code: form.code.trim(),
        name: form.name.trim(),
        sort_order: Number(form.sort_order) || 0,
      });
      toast.success(t("localeDialog.created"));
      onOpenChange(false);
      await onSaved?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const headerTitle = mode === "create"
    ? t("localeDialog.create")
    : (generalEditing ? t("localeDialog.edit") : t("localeDialog.view"));
  const headerDesc = mode === "create"
    ? t("localeDialog.descCreate")
    : (generalEditing ? t("localeDialog.descEdit") : t("localeDialog.descView"));

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose(); }}>
        <DialogContent
          className="max-w-xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose(); }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            <DialogEntityHeader
              icon={<Languages className="h-4 w-4" />}
              title={headerTitle}
              description={headerDesc}
            />

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <LocaleGeneralInfo
                mode={mode}
                form={form}
                onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                localeId={localeId}
                onSaved={onSaved}
                editing={generalEditing}
                onEditingChange={setGeneralEditing}
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
