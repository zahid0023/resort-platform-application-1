"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { icons as LucideIcons, Search, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../../lib/utils";

interface Props {
  value: string;
  onChange: (name: string) => void;
  color?: string;
}

// All icon names from lucide-react (PascalCase)
const ALL_ICONS = Object.keys(LucideIcons).sort();
const PAGE_SIZE = 80;

export default function LucideIconPicker({ value, onChange, color }: Props) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollRootRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_ICONS;
    return ALL_ICONS.filter((n) => n.toLowerCase().includes(q));
  }, [query]);

  // Reset pagination whenever the search query changes.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query]);

  // Ensure the currently-selected icon is always visible in the rendered slice,
  // even when it would otherwise fall outside the loaded window.
  const visible = useMemo(() => {
    const slice = filtered.slice(0, visibleCount);
    if (value && filtered.includes(value) && !slice.includes(value)) {
      return [value, ...slice];
    }
    return slice;
  }, [filtered, value, visibleCount]);

  const hasMore = visibleCount < filtered.length;

  // Infinite scroll: observe a sentinel near the bottom of the scroll viewport.
  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // Radix ScrollArea renders an inner [data-radix-scroll-area-viewport] element.
    const root =
      scrollRootRef.current?.querySelector<HTMLElement>(
        "[data-radix-scroll-area-viewport]",
      ) ?? null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
        }
      },
      { root, rootMargin: "120px", threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, filtered.length, visible.length]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${ALL_ICONS.length} icons...`}
          className="pl-9 h-9"
        />
      </div>

      <ScrollArea
        ref={scrollRootRef}
        className="h-56 rounded-md border border-border bg-muted/30"
      >
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No icons match "{query}"
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-1 p-2">
            {visible.map((name) => {
              const Icon = LucideIcons[name as keyof typeof LucideIcons] as LucideIcon;
              const selected = value === name;
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => onChange(name)}
                  className={cn(
                    "relative aspect-square rounded-md flex items-center justify-center transition-all hover:bg-background hover:scale-110",
                    selected && "bg-primary/10 ring-2 ring-primary",
                  )}
                  style={selected && color ? { color } : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {selected && (
                    <Check className="absolute -top-1 -right-1 w-3 h-3 bg-primary text-primary-foreground rounded-full p-0.5" />
                  )}
                </button>
              );
            })}
            {hasMore ? (
              <div
                ref={sentinelRef}
                className="col-span-8 flex items-center justify-center py-3 text-xs text-muted-foreground"
              >
                Loading more icons…
              </div>
            ) : (
              <div className="col-span-8 text-center text-xs text-muted-foreground py-2">
                {filtered.length} icon{filtered.length === 1 ? "" : "s"} loaded
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {value && (
        <div className="text-xs text-muted-foreground">
          Selected: <span className="font-mono text-foreground">{value}</span>
        </div>
      )}
    </div>
  );
}
