import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@resort/shadcn-ui";
import { DialogFooter } from "@resort/shadcn-ui";

interface DialogCreateFooterProps {
  submitting: boolean;
  onCancel: () => void;
  /** Extra condition beyond `submitting` that keeps the Create button disabled (e.g. incomplete required fields) */
  disabled?: boolean;
  /** Optional left-aligned status node (e.g. a "Draft saved" indicator) — pushes the buttons to the right */
  indicator?: React.ReactNode;
}

export function DialogCreateFooter({ submitting, onCancel, disabled, indicator }: DialogCreateFooterProps) {
  const { t } = useTranslation();
  return (
    <DialogFooter className="shrink-0 px-6 py-4 border-t bg-muted/40">
      <div className={`flex items-center gap-2 w-full ${indicator ? "justify-between" : "justify-end"}`}>
        {indicator}
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={submitting} className="gap-1.5">
            <X className="h-3.5 w-3.5" /> {t("common.cancel")}
          </Button>
          <Button type="submit" size="sm" disabled={submitting || disabled} className="gap-1.5">
            <Check className="h-3.5 w-3.5" />
            {submitting ? t("common.saving") : t("common.create")}
          </Button>
        </div>
      </div>
    </DialogFooter>
  );
}
