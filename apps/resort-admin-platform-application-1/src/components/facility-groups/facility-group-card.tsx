import { useTranslation } from "react-i18next"
import { ArrowRight, Eye, Trash2 } from "lucide-react"
import { Badge } from "@resort/shadcn-ui"
import { Button } from "@resort/shadcn-ui"
import { Card, CardHeader, CardAction, CardContent, CardFooter } from "@resort/shadcn-ui"
import { IconRenderer } from "@/components/shared/icon-picker"
import type { FacilityGroupSummary } from "@/services/facility-groups"
import { toIconValue } from "./types"

export interface FacilityGroupCardProps {
  group: FacilityGroupSummary
  defaultName?: string
  onNavigate?: (group: FacilityGroupSummary) => void
  onView?: (group: FacilityGroupSummary) => void
  onDelete?: (group: FacilityGroupSummary) => void
}

export function FacilityGroupCard({ group, defaultName, onNavigate, onView, onDelete }: FacilityGroupCardProps) {
  const { t } = useTranslation()
  const icon = toIconValue(group)
  const accentColor = icon.meta?.color || undefined
  const title = defaultName?.trim() || group.code
  const scopes = group.facility_scopes ?? []

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onDelete?.(group)
  }

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onView?.(group)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(group) }
      }}
      className="group hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <CardHeader>
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
            <p className="text-xs text-muted-foreground truncate font-mono">{group.code}</p>
          </div>
        </div>
        {(onView || onDelete) && (
          <CardAction
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
          </CardAction>
        )}
      </CardHeader>

      {scopes.length > 0 && (
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {scopes.map((s) => (
              <Badge key={s.id} variant="outline" className="font-mono text-[10px] px-1.5 py-0 h-5">
                {s.locale?.name ?? s.code}
              </Badge>
            ))}
          </div>
        </CardContent>
      )}

      <CardFooter
        className="justify-between text-xs font-medium text-primary hover:underline"
        onClick={(e) => { e.stopPropagation(); onNavigate?.(group) }}
      >
        <span>{t("facilityGroup.viewFacilities")}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </CardFooter>
    </Card>
  )
}
