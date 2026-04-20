"use client"

import { MapPin, ArrowRightIcon } from "lucide-react"
import type { ResortSummary } from "@/services/resorts"

const GRADIENTS = [
  "from-stone-800 via-stone-900 to-neutral-950",
  "from-zinc-700 via-zinc-800 to-zinc-950",
  "from-slate-700 via-slate-800 to-slate-950",
  "from-neutral-700 via-neutral-800 to-stone-950",
  "from-gray-700 via-gray-800 to-gray-950",
  "from-stone-600 via-stone-800 to-neutral-900",
]

interface ResortCardProps {
  data: ResortSummary
  index: number
  onOpen: (data: ResortSummary) => void
}

export function ResortCard({ data, index, onOpen }: ResortCardProps) {
  const gradient = GRADIENTS[index % GRADIENTS.length]

  return (
    <button
      onClick={() => onOpen(data)}
      className={`group relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} text-left shadow-lg transition-all duration-700 hover:shadow-2xl hover:-translate-y-1`}
    >
              <img
                src={data.image}
                alt={data.name}
                loading="lazy"
                width={1024}
                height={768}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-luxe group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-overlay" />
              <div className="relative h-full flex flex-col justify-end p-6 text-primary-foreground">
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-primary-foreground/80 mb-2">
                  <MapPin className="h-3 w-3" />
                  {data.address}
                </div>
                <h3 className="font-display text-3xl leading-tight text-primary-foreground">{data.name}</h3>
                <p className="mt-2 text-sm text-primary-foreground/80 line-clamp-2">
                  {data.description}
                </p>
              </div>
    </button>
  )
}
