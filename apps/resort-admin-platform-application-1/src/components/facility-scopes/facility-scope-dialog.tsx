import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Target } from "lucide-react";
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
import { Dialog, DialogContent } from "@resort/shadcn-ui";
import { DialogEntityHeader } from "@/components/shared/dialog-entity-header";
import type { Locale } from "@/services/locales";
import type { FacilityScopeFormState } from "./types";
import { FacilityScopeGeneralInfo } from "./facility-scope-general-info";
import { FacilityScopeLocaleTranslations } from "./facility-scope-locale-translations";

export interface FacilityScopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityScopeId?: number;
  form: FacilityScopeFormState;
  onFormChange: (form: FacilityScopeFormState) => void;
  availableLocales: Locale[];
  onSaved?: () => void | Promise<void>;
}

export function FacilityScopeDialog({
  open,
  onOpenChange,
  facilityScopeId,
  form,
  onFormChange,
  availableLocales,
  onSaved,
}: FacilityScopeDialogProps) {
  const { t } = useTranslation();
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

  const isDirty = generalEditing || translationsEditing;

  function requestClose() {
    if (isDirty) setConfirmClose(true);
    else onOpenChange(false);
  }

  const isEditing = generalEditing || translationsEditing;
  const headerTitle = isEditing ? t("facilityScopeDialog.edit") : t("facilityScopeDialog.view");
  const headerDesc = isEditing ? t("facilityScopeDialog.descEdit") : t("facilityScopeDialog.descView");

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose(); }}>
        <DialogContent
          className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose(); }}
        >
          <div className="flex flex-col min-h-0 flex-1">
            <DialogEntityHeader
              icon={<Target className="h-4 w-4" />}
              title={headerTitle}
              description={headerDesc}
            />

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <FacilityScopeGeneralInfo
                form={form}
                onFormChange={(patch) => onFormChange({ ...form, ...patch })}
                facilityScopeId={facilityScopeId}
                onSaved={onSaved}
                editing={generalEditing}
                onEditingChange={setGeneralEditing}
                open={open}
              />
              <FacilityScopeLocaleTranslations
                form={form}
                onFormChange={onFormChange}
                facilityScopeId={facilityScopeId}
                availableLocales={availableLocales}
                onSaved={onSaved}
                editing={translationsEditing}
                onEditingChange={setTranslationsEditing}
                open={open}
              />
            </div>
          </div>
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
            <AlertDialogAction onClick={() => onOpenChange(false)}>
              {t("dialog.discardChanges.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
