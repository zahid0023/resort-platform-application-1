"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Layers, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  listResortRoomCategories, type ResortRoomCategorySummary,
} from "@/services/resort-room-categories";
import { getResort, type Resort } from "@/services/resorts";
import CategoryCard from "@/components/room/category-card";
import CreateRoomCategoryDialog from "@/components/room/create-room-category-dialog";

export default function RoomsPage() {
  const { resortId } = useParams<{ resortId: string }>();

  const [resort, setResort] = useState<Resort | null>(null);
  const [categories, setCategories] = useState<ResortRoomCategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addCatOpen, setAddCatOpen] = useState(false);

  useEffect(() => {
    getResort(Number(resortId))
      .then((res) => setResort(res.data))
      .catch(() => toast.error("Failed to load resort."));
  }, [resortId]);

  const refreshCategories = useCallback(() => {
    setLoading(true); setError(null);
    listResortRoomCategories(resortId, { size: 100, sort_by: "sortOrder", sort_dir: "ASC" })
      .then((res) => setCategories(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load categories"))
      .finally(() => setLoading(false));
  }, [resortId]);

  useEffect(() => {
    if (!resortId) return;
    refreshCategories();
  }, [resortId, refreshCategories]);

  const nextSortOrder =
    categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) + 1 : 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Inventory</p>
          <h1 className="text-xl font-semibold mt-1">
            {resort ? `Room categories at ${resort.name}` : "Room categories"}
          </h1>
        </div>
        <Button type="button" onClick={() => setAddCatOpen(true)}
          className="bg-gradient-ocean text-primary-foreground hover:opacity-95 gap-2">
          <Plus className="h-4 w-4" /> New category
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && !error && (
        <div className="flex items-center justify-center py-20">
          <Spinner className="size-6" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && categories.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/40 py-20 text-center">
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
            <Layers className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No categories yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first collection to start adding rooms.
            </p>
          </div>
          <Button type="button" onClick={() => setAddCatOpen(true)}
            className="bg-gradient-ocean text-primary-foreground hover:opacity-95 gap-2">
            <Plus className="h-4 w-4" /> New category
          </Button>
        </div>
      )}

      {/* Category list */}
      {!loading && !error && categories.length > 0 && (
        <div className="space-y-5">
          {categories.map((cat, i) => (
            <CategoryCard key={cat.id} cat={cat} resortId={resortId} index={i} />
          ))}

          {/* Add category tile */}
          <button
            type="button"
            onClick={() => setAddCatOpen(true)}
            className="w-full rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-card transition-all duration-300 ease-luxe p-6 flex items-center justify-center gap-3 group"
          >
            <span className="h-9 w-9 rounded-full bg-gradient-ocean text-primary-foreground flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary">
              Add category
            </span>
          </button>
        </div>
      )}

      <CreateRoomCategoryDialog
        open={addCatOpen}
        onOpenChange={setAddCatOpen}
        resortId={resortId}
        nextSortOrder={nextSortOrder}
        onCreated={refreshCategories}
      />
    </div>
  );
}
