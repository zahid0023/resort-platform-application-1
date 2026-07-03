import { Eye, Trash2 } from "lucide-react";
import { Card } from "@resort/shadcn-ui";
import { Button } from "@resort/shadcn-ui";
import { Badge } from "@resort/shadcn-ui";
import type { RoomCategory } from "@/services/room-categories";

export interface RoomCategoryCardProps {
  roomCategory: RoomCategory;
  defaultName?: string;
  onView?: (roomCategory: RoomCategory) => void;
  onDelete?: (roomCategory: RoomCategory) => void;
}

export function RoomCategoryCard({ roomCategory, defaultName, onView, onDelete }: RoomCategoryCardProps) {
  const title = defaultName?.trim() || roomCategory.code;
  const subtitle = defaultName?.trim()
    ? `${roomCategory.code} · ID #${roomCategory.id}`
    : `ID #${roomCategory.id}`;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(roomCategory)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(roomCategory); } }}
      className="group p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 text-xs">
            {roomCategory.code}
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
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onView(roomCategory); }}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(roomCategory); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <Badge variant="secondary">#{roomCategory.sort_order}</Badge>
        <span className="text-xs text-muted-foreground">
          {roomCategory.locales.length} locale{roomCategory.locales.length !== 1 ? "s" : ""}
        </span>
      </div>
    </Card>
  );
}
