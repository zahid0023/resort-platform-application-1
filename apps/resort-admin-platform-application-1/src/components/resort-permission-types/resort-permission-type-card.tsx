import { Eye, Trash2 } from "lucide-react";
import { Card } from "@resort/shadcn-ui";
import { Button } from "@resort/shadcn-ui";
import { Badge } from "@resort/shadcn-ui";
import type { ResortPermissionType } from "@/services/resort-permission-types";

export interface ResortPermissionTypeCardProps {
  permissionType: ResortPermissionType;
  defaultName?: string;
  onView?: (permissionType: ResortPermissionType) => void;
  onDelete?: (permissionType: ResortPermissionType) => void;
}

export function ResortPermissionTypeCard({ permissionType, defaultName, onView, onDelete }: ResortPermissionTypeCardProps) {
  const title = defaultName?.trim() || permissionType.code;
  const subtitle = defaultName?.trim()
    ? `${permissionType.code} · ID #${permissionType.id}`
    : `ID #${permissionType.id}`;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete?.(permissionType);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(permissionType)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(permissionType); } }}
      className="group p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 text-[10px] text-center leading-tight px-1">
            {permissionType.code}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          </div>
        </div>
        <div
          className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {onView && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onView(permissionType); }}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <Badge variant="secondary">#{permissionType.sort_order}</Badge>
        <span className="text-xs text-muted-foreground">{permissionType.locales.length} locale{permissionType.locales.length !== 1 ? "s" : ""}</span>
      </div>
    </Card>
  );
}
