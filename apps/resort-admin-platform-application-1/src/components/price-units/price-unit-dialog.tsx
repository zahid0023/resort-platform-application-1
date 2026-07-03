import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Coins } from "lucide-react";
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
import { priceUnitsService } from "@/services/price-units";
import type { Locale } from "@/services/locales";
import { toast } from "sonner";
import type { PriceUnitDialogMode, PriceUnitFormState } from "./types";
import { PriceUnitGeneralInfo } from "./price-unit-general-info";
import { PriceUnitLocaleTranslations } from "./price-unit-locale-translations";

export const emptyPriceUnitForm: PriceUnitFormState = {
  code: "",
  sort_order: 0,
  locales: [{ locale_id: "", name: "", description: "", sort_order: 0, calculation_method: "", usage_example: "" }],
};

export interface PriceUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: PriceUnitDialogMode;
  priceUnitId?: number;
  form: PriceUnitFormState;
  onFormChange: (form: PriceUnitFormState) => void;
  availableLocales: Locale[];
  onSaved?: () => void | Promise<void>;
}

export function PriceUnitDialog({
  open,
  onOpenChange,
  mode,
  priceUnitId,
  form,
  onFormChange,
  availableLocales,
  onSaved,
}: PriceUnitDialogProps) {
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
    for (const [i, row] of form.locales.entries()) {
      if (!row.locale_id) { toast.error(t("toast.localeSelectLang", { n: i + 1 })); return; }
      if (!row.name.trim()) { toast.error(t("toast.localeNameRequired", { n: i + 1 })); return; }
    }
    setSubmitting(true);
    try {
      const code = form.code.trim().toUpperCase();
      await priceUnitsService.create({
        code,
        sort_order: Number(form.sort_order) || 0,
        locales: form.locales.map((row) => ({
          locale_id: Number(row.locale_id),
          name: row.name.trim(),
          description: row.description.trim() || undefined,
          sort_order: Number(row.sort_order) || 0,
          calculation_method: row.calculation_method.trim() || undefined,
          usage_example: row.usage_example.trim() || undefined,
        })),
      });
      toast.success(t("priceUnit.created"));
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
    ? t("priceUnitDialog.create")
    : (isEditing ? t("priceUnitDialog.edit") : t("priceUnitDialog.view"));
  const headerDesc = mode === "create"
    ? t("priceUnitDialog.descCreate")
    : (isEditing ? t("priceUnitDialog.descEdit") : t("priceUnitDialog.descView"));

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose(); }}>
        <DialogContent
          className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose(); }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">

            <DialogEntityHeader icon={<Coins className="h-4 w-4" />} title={headerTitle} description={headerDesc} />

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <PriceUnitGeneralInfo
                mode={mode}
                form={form}
                onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                priceUnitId={priceUnitId}
                onSaved={onSaved}
                editing={generalEditing}
                onEditingChange={setGeneralEditing}
                open={open}
              />
              <PriceUnitLocaleTranslations
                mode={mode}
                form={form}
                onFormChange={onFormChange}
                priceUnitId={priceUnitId}
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
