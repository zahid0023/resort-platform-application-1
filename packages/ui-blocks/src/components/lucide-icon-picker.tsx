"use client"

import { useMemo, useState } from "react"
import * as LucideIcons from "lucide-react"
import { Button, Input } from "@resort/shadcn-ui"
import { LucideIconRenderer } from "./lucide-icon-renderer"

const PAGE_SIZE = 200

const ICON_NAMES: string[] = Object.keys(LucideIcons).filter((key) => {
  const first = key.charAt(0)
  return first >= "A" && first <= "Z"
})

interface LucideIconPickerProps {
  value: string
  color?: string
  onChange: (name: string) => void
}

export function LucideIconPicker({ value, color, onChange }: LucideIconPickerProps) {
  const [search, setSearch] = useState("")
  const [limit, setLimit] = useState(PAGE_SIZE)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ICON_NAMES
    return ICON_NAMES.filter((n) => n.toLowerCase().includes(q))
  }, [search])

  const visible = filtered.slice(0, limit)
  const hasMore = filtered.length > limit

  function handleSearchChange(q: string) {
    setSearch(q)
    setLimit(PAGE_SIZE)
  }

  return (
    <div className="space-y-2">
      <Input
        placeholder="Search icons…"
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="h-8 text-sm"
      />
      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto rounded-md border border-border p-1">
        {visible.length === 0 ? (
          <p className="col-span-8 py-4 text-center text-xs text-muted-foreground">No icons found</p>
        ) : (
          <>
            {visible.map((name) => (
              <button
                key={name}
                type="button"
                title={name}
                onClick={() => onChange(name)}
                className={[
                  "flex items-center justify-center rounded p-1.5 transition-colors",
                  value === name
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground text-foreground",
                ].join(" ")}
              >
                <LucideIconRenderer
                  name={name}
                  size={16}
                  style={{ color: value === name ? undefined : (color || undefined) }}
                />
              </button>
            ))}
            {hasMore && (
              <div className="col-span-8 pt-1 pb-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs text-muted-foreground"
                  onClick={() => setLimit((l) => l + PAGE_SIZE)}
                >
                  Load more ({filtered.length - limit} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-right">
        {visible.length} of {filtered.length} icons
      </p>
    </div>
  )
}
