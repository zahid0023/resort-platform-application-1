"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Baby, BedDouble, Building2, CalendarRange, FileText,
  ListOrdered, Loader2, Plus, Tag, Users,
} from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type RoomSummary } from "@/services/rooms";
import {
  listRoomPricePeriods, type RoomPricePeriodSummary,
} from "@/services/room-price-periods";
import { PriceTag } from "./room-card";

/* ------------------------------------------------------------------ */
/* Local primitives                                                    */
/* ------------------------------------------------------------------ */
const Eyebrow = ({
  icon: Icon,
  tone,
  className,
  children,
}: {
  icon?: React.ElementType;
  tone?: "onPrimary";
  className?: string;
  children: React.ReactNode;
}) => (
  <p className={cn(
    "text-xs uppercase tracking-[0.2em] inline-flex items-center gap-1.5",
    tone === "onPrimary" ? "text-primary-foreground/70" : "text-muted-foreground",
    className,
  )}>
    {Icon && <Icon className="h-3 w-3" />}
    {children}
  </p>
);

const StatTile = ({
  icon: Icon, label, value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="rounded-lg bg-muted/40 p-3 flex flex-col gap-1">
    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1">
      <Icon className="h-3 w-3" /> {label}
    </span>
    <span className="text-lg font-semibold text-foreground">{value}</span>
  </div>
);

const LoadingState = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
    <Loader2 className="h-4 w-4 animate-spin" />
    {label}
  </div>
);

/* ------------------------------------------------------------------ */
/* Room details dialog                                                 */
/* ------------------------------------------------------------------ */
const RoomDetailsDialog = ({
  open, onOpenChange, resortId, categoryId, categoryName, room, onSetPrice,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  resortId: string;
  categoryId: number;
  categoryName: string;
  room: RoomSummary;
  onSetPrice: () => void;
}) => {
  const [periods, setPeriods] = useState<RoomPricePeriodSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true); setError(null);
    listRoomPricePeriods(resortId, categoryId, room.id, {
      size: 100, sort_by: "startDate", sort_dir: "ASC",
    })
      .then((res) => setPeriods(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load price periods"))
      .finally(() => setLoading(false));
  }, [open, resortId, categoryId, room.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-card border-border">
        <div className="relative bg-gradient-ocean text-primary-foreground p-8">
          <Eyebrow icon={BedDouble} tone="onPrimary" className="mb-3 tracking-[0.3em]">
            {categoryName}
          </Eyebrow>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="font-display text-3xl">{room.name}</h2>
            <span className="font-mono text-xs text-primary-foreground/80">
              #{room.room_number || "—"}
            </span>
          </div>
          <div className="mt-4">
            <PriceTag value={room.base_price} suffix="base / night" size="lg" />
          </div>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {room.description && (
            <div className="space-y-2">
              <Eyebrow icon={FileText}>Description</Eyebrow>
              <p className="text-sm text-foreground leading-relaxed">{room.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile icon={Building2} label="Floor" value={room.floor} />
            <StatTile icon={Users} label="Adults" value={room.max_adults} />
            <StatTile icon={Baby} label="Children" value={room.max_children} />
            <StatTile icon={BedDouble} label="Occupancy" value={room.max_occupancy} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Eyebrow icon={CalendarRange}>
                Price periods
                {!loading && (
                  <span className="text-muted-foreground/70">· {periods.length}</span>
                )}
              </Eyebrow>
              <Button type="button" size="sm" variant="outline"
                onClick={onSetPrice}
                className="h-7 px-2.5 text-[11px] uppercase tracking-[0.15em] gap-1 hover:bg-gradient-ocean hover:text-primary-foreground hover:border-transparent">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>

            {loading && <LoadingState label="Loading price periods…" />}

            {error && <p className="text-sm text-destructive">{error}</p>}

            {!loading && !error && periods.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No price periods yet. Use "Set price" to add one.
              </div>
            )}

            {!loading && !error && periods.length > 0 && (
              <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                {periods.map((p) => {
                  let range = `${p.start_date} → ${p.end_date}`;
                  try {
                    range = `${format(new Date(p.start_date), "MMM d, yyyy")} → ${format(new Date(p.end_date), "MMM d, yyyy")}`;
                  } catch { /* ignore */ }
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/30">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{range}</p>
                        <p className="mt-0.5 text-[11px] uppercase tracking-[0.15em] text-muted-foreground inline-flex items-center gap-2">
                          <span className="inline-flex items-center gap-1">
                            <Tag className="h-3 w-3" /> {p.price_type_name}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ListOrdered className="h-3 w-3" /> P{p.priority}
                          </span>
                        </p>
                      </div>
                      <PriceTag value={p.price} className="shrink-0" />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomDetailsDialog;
