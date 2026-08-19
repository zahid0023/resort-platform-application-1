"use client"

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

// List endpoints only ever return `{ id, code }` — no basic_info/address — so the card can only
// show the code here. Name/description/address show up once the dashboard fetches the full resort.
export function ResortCard({ data, index, onOpen }: ResortCardProps) {
  const gradient = GRADIENTS[index % GRADIENTS.length]

  return (
    <button
      onClick={() => onOpen(data)}
      className={`group relative aspect-4/5 w-full overflow-hidden rounded-2xl bg-linear-to-br ${gradient} text-left shadow-lg transition-all duration-700 hover:shadow-2xl hover:-translate-y-1 hover:cursor-pointer`}
    >
      <div className="absolute inset-0 bg-gradient-overlay" />
      <div className="relative h-full flex flex-col justify-end p-6 text-primary-foreground lg:p-8">
        <h3 className="font-display text-3xl leading-tight text-primary-foreground lg:text-4xl">{data.code}</h3>
      </div>
    </button>
  )
}
