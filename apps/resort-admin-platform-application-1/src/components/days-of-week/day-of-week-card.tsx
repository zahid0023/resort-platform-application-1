import { CalendarDays, Eye } from "lucide-react";
import { Card, CardHeader, CardAction } from "@resort/shadcn-ui";
import { Button } from "@resort/shadcn-ui";
import type { DayOfWeek } from "@/services/days-of-week";

export interface DayOfWeekCardProps {
  dayOfWeek: DayOfWeek;
  defaultName?: string;
  onView?: (dayOfWeek: DayOfWeek) => void;
}

// No delete affordance — the seven days are platform-seeded and read-only through this API, only
// their locale translations can be managed (via the dialog this card opens).
export function DayOfWeekCard({ dayOfWeek, defaultName, onView }: DayOfWeekCardProps) {
  const title = defaultName?.trim() || dayOfWeek.code;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(dayOfWeek)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(dayOfWeek); } }}
      className="group hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <CardHeader>
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            <p className="text-xs text-muted-foreground truncate font-mono">
              {dayOfWeek.code}
              {dayOfWeek.locale?.short_name ? ` · ${dayOfWeek.locale.short_name}` : ""}
            </p>
          </div>
        </div>
        {onView && (
          <CardAction
            className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Button size="icon" variant="ghost" className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onView(dayOfWeek); }}
              title="View details"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </CardAction>
        )}
      </CardHeader>
    </Card>
  );
}
