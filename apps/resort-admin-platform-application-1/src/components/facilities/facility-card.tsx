import { Eye, Trash2 } from "lucide-react"
import { Badge } from "@resort/shadcn-ui"
import { Button } from "@resort/shadcn-ui"
import { Card } from "@resort/shadcn-ui"
import { IconRenderer } from "@/components/shared/icon-picker"
import type { FacilitySummary } from "@/services/facilities"
import { toIconValue } from "./types"

export interface FacilityCardProps {
  facility: FacilitySummary
  defaultName?: string
  groupName?: string
  onView?: (facility: FacilitySummary) => void
  onDelete?: (facility: FacilitySummary) => void
}

export function FacilityCard({ facility, defaultName, groupName, onView, onDelete }: FacilityCardProps) {
  const icon = toIconValue(facility)
  const accentColor = icon.meta?.color || undefined
  const title = defaultName?.trim() || facility.code

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onDelete?.(facility)
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(facility)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(facility) }
      }}
      className="group p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {/* Icon avatar */}
          <div
            className="h-11 w-11 rounded-lg bg-primary flex items-center justify-center shrink-0"
            style={{
              background: accentColor
                ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`
                : undefined,
              boxShadow: accentColor ? `0 4px 14px -4px ${accentColor}80` : undefined,
            }}
          >
            <IconRenderer
              icon={icon}
              className="h-5 w-5"
              style={{ color: "white" }}
              fallback={
                <span className="font-mono text-xs font-semibold text-white">
                  {facility.code[0] ?? "?"}
                </span>
              }
            />
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            <p className="text-xs text-muted-foreground truncate font-mono">{facility.code} · ID #{facility.id}</p>
            {groupName && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{groupName}</p>
            )}
          </div>
        </div>

        {/* Hover actions */}
        <div
          className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {onView && (
            <Button size="icon" variant="ghost" className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onView(facility) }}
              title="View details"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button size="icon" variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {(facility.facility_scopes.length > 0 || facility.facility_groups.length > 0) && (
        <div className="mt-4 pt-3 border-t">
          {facility.facility_scopes.length > 0 && (
            <div className={`flex flex-wrap gap-1.5 ${facility.facility_groups.length > 0 ? "pb-2.5 mb-2.5 border-b" : ""}`}>
              {facility.facility_scopes.map((s) => (
                <Badge key={s.id} variant="outline" className="text-xs px-2.5 py-1 h-6">
                  {s.locale?.name ?? s.code}
                </Badge>
              ))}
            </div>
          )}
          {facility.facility_groups.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {facility.facility_groups.map((g) => (
                <Badge key={g.id} variant="secondary" className="text-xs px-2.5 py-1 h-6">
                  {g.locale?.name ?? g.code}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
