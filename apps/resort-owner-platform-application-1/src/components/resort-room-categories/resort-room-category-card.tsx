import { Baby, BedDouble, Cigarette, Eye, Globe, LogIn, LogOut, PawPrint, Tag, Trash2, Users } from "lucide-react"
import { Button, Card } from "@resort/shadcn-ui"
import type { ResortRoomCategory } from "@/services/resort-room-categories"

function formatTime(t: string): string {
  const [hh, mm] = t.split(":")
  const h = parseInt(hh ?? "0", 10)
  const ampm = h < 12 ? "AM" : "PM"
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${mm ?? "00"} ${ampm}`
}

function PolicyPip({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
}) {
  return (
    <div className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors ${
      active
        ? "border-primary/30 bg-primary/10 text-primary"
        : "border-border/40 bg-muted/30 text-muted-foreground/50"
    }`}>
      <Icon className="h-3 w-3 shrink-0" />
      {label}
    </div>
  )
}

export interface ResortRoomCategoryCardProps {
  roomCategory: ResortRoomCategory
  defaultName?: string
  onView?: (rc: ResortRoomCategory) => void
  onPrices?: (rc: ResortRoomCategory) => void
  onDelete?: (rc: ResortRoomCategory) => void
}

export function ResortRoomCategoryCard({ roomCategory: rc, defaultName, onView, onPrices, onDelete }: ResortRoomCategoryCardProps) {
  const title = defaultName?.trim() || rc.code

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(rc)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(rc) } }}
      className="group overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-primary/15 via-primary/8 to-transparent px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 shadow-sm ring-1 ring-primary/10">
              <BedDouble className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base leading-tight truncate">{title}</h3>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{rc.code} · #{rc.id}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">{rc.room_category.code}</p>
            </div>
          </div>

          <div
            className="flex items-center gap-0.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {onPrices && (
              <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-500 hover:text-amber-600"
                title="Manage prices"
                onClick={(e) => { e.stopPropagation(); onPrices(rc) }}>
                <Tag className="h-3.5 w-3.5" />
              </Button>
            )}
            {onView && (
              <Button size="icon" variant="ghost" className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onView(rc) }}>
                <Eye className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button size="icon" variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(rc) }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3.5">
        {/* Occupancy stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/60 py-2.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-base font-bold tabular-nums leading-none">{rc.meta.max_adults}</span>
            <span className="text-[10px] text-muted-foreground leading-none">Adults</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/60 py-2.5">
            <Baby className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-base font-bold tabular-nums leading-none">{rc.meta.max_children}</span>
            <span className="text-[10px] text-muted-foreground leading-none">Children</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-primary/10 py-2.5 ring-1 ring-primary/15">
            <BedDouble className="h-3.5 w-3.5 text-primary" />
            <span className="text-base font-bold tabular-nums leading-none text-primary">{rc.meta.max_occupancy}</span>
            <span className="text-[10px] text-primary/70 leading-none">Max</span>
          </div>
        </div>

        {/* Check-in / Check-out times */}
        {(rc.meta.default_check_in_time || rc.meta.default_check_out_time) && (
          <div className="rounded-lg border border-border/50 bg-muted/20 divide-y divide-border/40 text-xs overflow-hidden">
            {rc.meta.default_check_in_time && (
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <LogIn className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Check-in</span>
                </div>
                <span className="font-mono font-semibold text-foreground">{formatTime(rc.meta.default_check_in_time)}</span>
              </div>
            )}
            {rc.meta.default_check_out_time && (
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <LogOut className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                  <span>Check-out</span>
                </div>
                <span className="font-mono font-semibold text-foreground">{formatTime(rc.meta.default_check_out_time)}</span>
              </div>
            )}
          </div>
        )}

        {/* Policy pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {!rc.meta.is_extra_bed_allowed && !rc.meta.is_smoking_allowed && !rc.meta.is_pets_allowed ? (
            <span className="text-[11px] text-muted-foreground/50 italic">No policies assigned</span>
          ) : (
            <>
              {rc.meta.is_extra_bed_allowed && (
                <PolicyPip
                  icon={BedDouble}
                  label={rc.meta.max_extra_beds > 0 ? `Extra bed ×${rc.meta.max_extra_beds}` : "Extra bed"}
                  active
                />
              )}
              {rc.meta.is_smoking_allowed && (
                <PolicyPip icon={Cigarette} label="Smoking" active />
              )}
              {rc.meta.is_pets_allowed && (
                <PolicyPip icon={PawPrint} label="Pets" active />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/60">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Globe className="h-3 w-3" />
            <span>{rc.locales.length} lang{rc.locales.length !== 1 ? "s" : ""}</span>
          </div>
          <span className="text-[11px] text-muted-foreground/60 font-mono">sort {rc.sort_order}</span>
        </div>
      </div>
    </Card>
  )
}
