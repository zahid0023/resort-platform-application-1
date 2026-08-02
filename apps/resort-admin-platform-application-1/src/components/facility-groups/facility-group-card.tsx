import { Eye, Trash2 } from "lucide-react"
import { Badge } from "@resort/shadcn-ui"
import { Button } from "@resort/shadcn-ui"
import { Card } from "@resort/shadcn-ui"
import { IconRenderer } from "@/components/shared/icon-picker"
import type { FacilityGroupSummary, ScopeAssignment } from "@/services/facility-groups"
import { toIconValue } from "./types"
import type { Locale } from "@/services/locales"
import { pickTranslation } from "@/lib/locale"

export interface FacilityGroupCardProps {
  group: FacilityGroupSummary
  defaultName?: string
  scopeAssignments?: ScopeAssignment[]
  availableLocales?: Locale[]
  onNavigate?: (group: FacilityGroupSummary) => void
  onView?: (group: FacilityGroupSummary) => void
  onDelete?: (group: FacilityGroupSummary) => void
}

export function FacilityGroupCard({ group, defaultName, scopeAssignments, availableLocales, onNavigate, onView, onDelete }: FacilityGroupCardProps) {
  const icon = toIconValue(group)
  const accentColor = icon.meta?.color || undefined
  const title = defaultName?.trim() || group.code

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onDelete?.(group)
  }

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
                  {group.code[0] ?? "?"}
                </span>
              }
            />
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold truncate">{title}</h3>
            <p className="text-xs text-muted-foreground truncate font-mono">{group.code} · ID #{group.id}</p>
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
              onClick={(e) => { e.stopPropagation(); onView(group) }}
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

      {scopeAssignments && scopeAssignments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {scopeAssignments.map((a) => (
            <Badge key={a.facility_scope_id} variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-5">
              {pickTranslation(a.locales, availableLocales ?? [])?.name ?? a.code}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <Badge variant="secondary">#{group.sort_order}</Badge>
        <span className="text-xs text-muted-foreground">
          {group.locales.length} locale{group.locales.length !== 1 ? "s" : ""}
        </span>
      </div>
    </Card>
  )
}
