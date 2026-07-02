import { Eye, Trash2 } from "lucide-react";
import { Card } from "@resort/shadcn-ui";
import { Button } from "@resort/shadcn-ui";
import { Badge } from "@resort/shadcn-ui";
import type { Locale } from "@/services/locales";

export interface LocaleCardProps {
  locale: Locale;
  onView?: (locale: Locale) => void;
  onDelete?: (locale: Locale) => void;
}

export function LocaleCard({ locale, onView, onDelete }: LocaleCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete?.(locale);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(locale)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView?.(locale);
        }
      }}
      className="group p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 font-mono text-sm">
            {locale.code}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{locale.name}</h3>
            <p className="text-xs text-muted-foreground truncate">{locale.code} · ID #{locale.id}</p>
          </div>
        </div>
        <div
          className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {onView && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onView(locale); }}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <Badge variant="secondary">#{locale.sort_order}</Badge>
        <span className="text-xs text-muted-foreground font-mono">{locale.code}</span>
      </div>
    </Card>
  );
}
