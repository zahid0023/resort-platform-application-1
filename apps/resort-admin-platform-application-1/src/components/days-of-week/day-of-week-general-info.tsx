import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@resort/shadcn-ui";
import { Input } from "@resort/shadcn-ui";
import { Label } from "@resort/shadcn-ui";
import type { DayOfWeekFormState } from "./types";

export interface DayOfWeekGeneralInfoProps {
  form: DayOfWeekFormState;
}

// Read-only — `code` and `sort_order` are seeded and immutable, there is no update endpoint for the
// day-of-week record itself (only its locale translations are editable, see the Translations tab).
export function DayOfWeekGeneralInfo({ form }: DayOfWeekGeneralInfoProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-primary" />
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          {t("common.generalInfo")}
        </h3>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dow-code" className="text-xs font-medium">{t("common.code")}</Label>
            <Input id="dow-code" value={form.code} disabled className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dow-sort" className="text-xs font-medium">{t("field.sort")}</Label>
            <Input id="dow-sort" type="number" value={form.sort_order} disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
