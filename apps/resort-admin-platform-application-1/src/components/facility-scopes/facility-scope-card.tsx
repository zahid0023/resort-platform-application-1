import { Eye } from "lucide-react";
import { Badge } from "@resort/shadcn-ui";
import { Button } from "@resort/shadcn-ui";
import { Card } from "@resort/shadcn-ui";
import type { FacilityScope } from "@/services/facility-scopes";

export interface FacilityScopeCardProps {
  scope: FacilityScope;
  defaultName?: string;
  onView?: (scope: FacilityScope) => void;
}

export function FacilityScopeCard({ scope, defaultName, onView }: FacilityScopeCardProps) {
  const title = defaultName?.trim() || scope.code;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(scope)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView?.(scope);
        }
      }}
      className="group p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 text-xs">
            {scope.code.slice(0, 4)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            <p className="text-xs text-muted-foreground truncate font-mono">{scope.code} · ID #{scope.id}</p>
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
              onClick={(e) => { e.stopPropagation(); onView(scope); }}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <Badge variant="secondary">#{scope.sort_order}</Badge>
        <span className="text-xs text-muted-foreground">
          {scope.locales.length} locale{scope.locales.length !== 1 ? "s" : ""}
        </span>
      </div>
    </Card>
  );
}
