import { Eye, Trash2 } from "lucide-react"
import { Badge, Button, Card } from "@resort/shadcn-ui"
import { LucideIconRenderer } from "ui-blocks"
import type { ResortFacilityGroupSummary } from "@/services/resort-facility-groups"

export interface ResortFacilityGroupCardProps {
  group: ResortFacilityGroupSummary
  defaultName?: string
  onNavigate?: (group: ResortFacilityGroupSummary) => void
  onView?: (group: ResortFacilityGroupSummary) => void
  onDelete?: (group: ResortFacilityGroupSummary) => void
}

export function ResortFacilityGroupCard({ group, defaultName, onNavigate, onView, onDelete }: ResortFacilityGroupCardProps) {
  const accentColor = String(group.icon_meta?.color ?? "") || undefined
  const title = defaultName?.trim() || `Group #${group.id}`

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onNavigate?.(group)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigate?.(group) }
      }}
      className="group p-5 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-11 w-11 rounded-lg bg-primary flex items-center justify-center shrink-0"
            style={{
              background: accentColor ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` : undefined,
              boxShadow: accentColor ? `0 4px 14px -4px ${accentColor}80` : undefined,
            }}
          >
            {group.icon_type === "LUCIDE" && group.icon_value ? (
              <LucideIconRenderer name={group.icon_value} size={20} style={{ color: "white" }} />
            ) : (group.icon_type === "IMAGE" || group.icon_type === "EXTERNAL") && group.icon_value ? (
              <img src={group.icon_value} alt={title} className="h-5 w-5 object-contain" />
            ) : (
              <span className="font-mono text-xs font-semibold text-white">
                {title[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {"ID #"}{group.id}
              {group.facility_group_id ? ` · Platform #${group.facility_group_id}` : " · Custom"}
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {onView && (
            <Button size="icon" variant="ghost" className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onView(group) }}
              title="View details"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button size="icon" variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(group) }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <Badge variant="secondary">#{group.sort_order}</Badge>
        <span className="text-xs text-muted-foreground">
          {group.locales.length} locale{group.locales.length !== 1 ? "s" : ""}
        </span>
      </div>
    </Card>
  )
}
