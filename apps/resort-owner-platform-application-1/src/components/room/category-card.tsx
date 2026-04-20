"use client";

import { Layers } from "lucide-react";

import { type ResortRoomCategorySummary } from "@/services/resort-room-categories";
import CategoryRoomsRail from "./category-rooms-rail";

/* ------------------------------------------------------------------ */
/* Category card                                                       */
/* ------------------------------------------------------------------ */
const CategoryCard = ({
  cat, resortId, index,
}: {
  cat: ResortRoomCategorySummary;
  resortId: string;
  index: number;
}) => (
  <article
    className="group rounded-xl bg-card border border-border p-6 md:p-7 shadow-soft hover:shadow-luxe transition-all duration-500 ease-luxe animate-fade-up"
    style={{ animationDelay: `${index * 60}ms` }}>
    <header className="flex items-start gap-5 flex-wrap md:flex-nowrap">
      <div className="h-12 w-12 rounded-lg bg-gradient-ocean flex items-center justify-center shrink-0">
        <Layers className="h-7 w-7" strokeWidth={1.5} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-display text-2xl md:text-3xl text-primary leading-tight">
          {cat.name}
        </h3>
        
        {cat.description && (
          <p className="mt-1.5 text-sm text-muted-foreground max-w-3xl">
            {cat.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground">
          #{cat.sort_order}
        </span>
      </div>
    </header>

    <CategoryRoomsRail resortId={resortId} categoryId={cat.id} categoryName={cat.name} />
  </article>
);

export default CategoryCard;
