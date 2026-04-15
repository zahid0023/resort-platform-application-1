"use client"

import { HotelIcon, ArrowRightIcon } from "lucide-react"
import type { ResortSummary } from "@/services/resorts"

interface ResortCardProps {
  data: ResortSummary
  onOpen: (data: ResortSummary) => void
}

export function ResortCard({ data, onOpen }: ResortCardProps) {
  return (
    <button
      onClick={() => onOpen(data)}
      className="group flex flex-col gap-2 rounded-xl border bg-card p-4 text-left text-sm ring-1 ring-foreground/10 transition-colors hover:border-primary/40 hover:bg-primary/5 w-full"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <HotelIcon className="size-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">{data.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {data.contact_email ?? data.address ?? "—"}
          </span>
        </div>
        <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      {data.description && (
        <p className="line-clamp-2 pl-12 text-xs text-muted-foreground">{data.description}</p>
      )}
    </button>
  )
}
