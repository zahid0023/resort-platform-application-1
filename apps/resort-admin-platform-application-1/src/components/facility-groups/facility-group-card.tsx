"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { LucideIconRenderer } from "ui-blocks";
import type { FacilityGroupSummary } from "@/services/facility-groups";

interface Props {
  item: FacilityGroupSummary;
  /** Optional index used to stagger the entrance animation. */
  index?: number;
  onView?: (item: FacilityGroupSummary) => void;
  onEdit?: (item: FacilityGroupSummary) => void;
  onDelete?: (item: FacilityGroupSummary) => void;
}

export const FacilityGroupCard = ({ item, index = 0, onView, onEdit, onDelete }: Props) => {
  const router = useRouter();
  const color = (item.icon_meta?.color as string | undefined) ?? undefined;
  const iconName = item.icon_type === "LUCIDE" ? item.icon_value : undefined;

  const goToFacilities = () =>
    router.push(`/facility-groups/${item.id}/facilities`);
  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToFacilities();
    }
  };
  const handleAction = (
    e: React.MouseEvent,
    handler?: (item: FacilityGroupSummary) => void,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    handler?.(item);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={goToFacilities}
      onKeyDown={handleCardKeyDown}
      className={
        "group relative p-5 shadow-card hover:shadow-elegant transition-all hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
      }
      style={{ animationDelay: `${index * 40}ms`, animationFillMode: "backwards" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: color
              ? `linear-gradient(135deg, ${color}, ${color}cc)`
              : "var(--gradient-primary)",
            boxShadow: color ? `0 8px 24px -8px ${color}80` : "var(--shadow-elegant)",
          }}
        >
          <LucideIconRenderer name={iconName} className="w-6 h-6 text-white" />
        </div>
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {onView && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={(e) => handleAction(e, onView)}
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
          )}
          {onEdit && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={(e) => handleAction(e, onEdit)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => handleAction(e, onDelete)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-base truncate">{item.name}</h3>
      </div>
      <Badge variant="secondary" className="font-mono text-[10px] mb-3">
        {item.code}
      </Badge>
      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
        {item.description ?? "No description"}
      </p>

      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono">#{item.id}</span>
        <span>Order: {item.sort_order}</span>
        <span className="font-mono">{item.icon_value}</span>
      </div>
    </Card>
  );
};

export default FacilityGroupCard;