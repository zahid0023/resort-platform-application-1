"use client";

import { Baby, Building2, DollarSign, Hash, Tag, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type RoomSummary } from "@/services/rooms";

/* ------------------------------------------------------------------ */
/* Local primitive                                                     */
/* ------------------------------------------------------------------ */
const PriceTag = ({
  value,
  suffix,
  size = "sm",
  className,
}: {
  value: string | number;
  suffix?: string;
  size?: "sm" | "lg";
  className?: string;
}) => (
  <span className={cn("inline-flex items-center gap-0.5 font-medium text-foreground", size === "lg" ? "text-base" : "text-sm", className)}>
    <DollarSign className={cn(size === "lg" ? "h-4 w-4" : "h-3 w-3")} />
    {Number(value).toLocaleString()}
    {suffix && <span className="ml-0.5 text-[10px] text-muted-foreground font-normal">{suffix}</span>}
  </span>
);

export { PriceTag };

/* ------------------------------------------------------------------ */
/* Room card                                                           */
/* ------------------------------------------------------------------ */
const RoomCard = ({
  room, onOpenDetails, onSetPrice,
}: {
  room: RoomSummary;
  onOpenDetails: () => void;
  onSetPrice: () => void;
}) => (
  <button type="button"
    onClick={onOpenDetails}
    className="text-left rounded-lg bg-muted/40 hover:bg-muted/70 hover:ring-1 hover:ring-primary/30 transition-all p-4 flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <div className="flex items-center gap-1.5 text-[11px] font-mono text-accent">
      <Hash className="h-2.5 w-2.5" />
      {room.room_number || "—"}
    </div>
    <p className="mt-1 text-sm font-medium text-foreground truncate">{room.name}</p>

    <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
      <span className="inline-flex items-center gap-1">
        <Building2 className="h-3 w-3" /> Fl. {room.floor}
      </span>
      <span className="inline-flex items-center gap-1">
        <Users className="h-3 w-3" /> {room.max_adults}
      </span>
      <span className="inline-flex items-center gap-1">
        <Baby className="h-3 w-3" /> {room.max_children}
      </span>
    </div>

    <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
      <PriceTag value={room.base_price} suffix="/ night" />
      <Button asChild size="sm" variant="outline"
        className="h-7 px-2.5 text-[11px] uppercase tracking-[0.15em] gap-1 hover:bg-gradient-ocean hover:text-primary-foreground hover:border-transparent">
        <span
          role="button" tabIndex={0}
          onClick={(e) => { e.stopPropagation(); onSetPrice(); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault(); e.stopPropagation(); onSetPrice();
            }
          }}
        >
          <Tag className="h-3 w-3" />
          Set price
        </span>
      </Button>
    </div>
  </button>
);

export default RoomCard;
