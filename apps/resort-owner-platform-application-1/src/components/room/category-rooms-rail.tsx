"use client";

import { useState, useCallback, useEffect } from "react";
import { BedDouble, Plus } from "lucide-react";

import { listRooms, type RoomSummary } from "@/services/rooms";
import RoomCard from "./room-card";
import AddRoomDialog from "./create-room-dialog";
import SetRoomPriceDialog from "./set-room-price-dialog";
import RoomDetailsDialog from "./room-details-dialog";

/* ------------------------------------------------------------------ */
/* Local primitives                                                    */
/* ------------------------------------------------------------------ */
const Eyebrow = ({
  icon: Icon,
  children,
}: {
  icon?: React.ElementType;
  children: React.ReactNode;
}) => (
  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
    {Icon && <Icon className="h-3 w-3" />}
    {children}
  </p>
);

const AddTile = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-card transition-all duration-300 ease-luxe p-4 flex flex-col items-center justify-center gap-2 min-h-[120px] text-center group/add"
  >
    <span className="h-9 w-9 rounded-full bg-gradient-ocean flex items-center justify-center group-hover/add:scale-110 transition-transform">
      <Plus className="h-12 w-12" strokeWidth={4} />
    </span>
    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground group-hover/add:text-primary">
      {label}
    </span>
  </button>
);

/* ------------------------------------------------------------------ */
/* Category rooms rail                                                 */
/* ------------------------------------------------------------------ */
const CategoryRoomsRail = ({
  resortId, categoryId, categoryName,
}: {
  resortId: string;
  categoryId: number;
  categoryName: string;
}) => {
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [priceTarget, setPriceTarget] = useState<RoomSummary | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<RoomSummary | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await listRooms(resortId, categoryId, { size: 100, sort_by: "name", sort_dir: "ASC" });
      setRooms(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  }, [resortId, categoryId]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="mt-6 pt-6 border-t border-border">
      <div className="flex items-center justify-between mb-3">
        <Eyebrow icon={BedDouble}>
          {loading ? "Loading…" : `${rooms.length} ${rooms.length === 1 ? "room" : "rooms"}`}
        </Eyebrow>
      </div>
      {error && <p className="text-sm text-destructive mb-3">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rooms.map((room) => (
          <RoomCard key={room.id}
            room={room}
            onOpenDetails={() => setDetailsTarget(room)}
            onSetPrice={() => setPriceTarget(room)}
          />
        ))}
        <AddTile label="Add room" onClick={() => setAddOpen(true)} />
      </div>

      <AddRoomDialog open={addOpen} onOpenChange={setAddOpen}
        resortId={resortId} categoryId={categoryId} categoryName={categoryName}
        onCreated={refresh} />

      {priceTarget && (
        <SetRoomPriceDialog
          open={!!priceTarget}
          onOpenChange={(v) => !v && setPriceTarget(null)}
          resortId={resortId} categoryId={categoryId}
          room={priceTarget}
        />
      )}

      {detailsTarget && (
        <RoomDetailsDialog
          open={!!detailsTarget}
          onOpenChange={(v) => !v && setDetailsTarget(null)}
          resortId={resortId} categoryId={categoryId}
          categoryName={categoryName}
          room={detailsTarget}
          onSetPrice={() => {
            setPriceTarget(detailsTarget);
            setDetailsTarget(null);
          }}
        />
      )}
    </div>
  );
};

export default CategoryRoomsRail;
