import { Eye, LayoutList, Trash2 } from "lucide-react";
import { Card, CardHeader, CardAction } from "@resort/shadcn-ui";
import { Button } from "@resort/shadcn-ui";
import type { RoomCategory } from "@/services/room-categories";

export interface RoomCategoryCardProps {
  roomCategory: RoomCategory;
  defaultName?: string;
  onView?: (roomCategory: RoomCategory) => void;
  onDelete?: (roomCategory: RoomCategory) => void;
}

export function RoomCategoryCard({ roomCategory, defaultName, onView, onDelete }: RoomCategoryCardProps) {
  const title = defaultName?.trim() || roomCategory.code;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete?.(roomCategory);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(roomCategory)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(roomCategory); } }}
      className="group hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <CardHeader>
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
            <LayoutList className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            <p className="text-xs text-muted-foreground truncate font-mono">{roomCategory.code}</p>
          </div>
        </div>
        {(onView || onDelete) && (
          <CardAction
            className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {onView && (
              <Button size="icon" variant="ghost" className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onView(roomCategory); }}
                title="View details"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </CardAction>
        )}
      </CardHeader>
    </Card>
  );
}
