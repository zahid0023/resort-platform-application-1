"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Layers, Loader2, Search } from "lucide-react"
import { Badge, Dialog, DialogContent, DialogTitle, Input } from "@resort/shadcn-ui"
import { LucideIconRenderer } from "ui-blocks"
import { toast } from "sonner"
import { platformFacilityGroupsService, type PlatformFacilityGroupSummary } from "@/services/platform-facility-groups"
import { getResortFacilityScopeId } from "@/services/facility-scopes"
import { Pagination } from "@/components/shared/pagination"

const PAGE_SIZE = 20
// The platform facility-groups endpoint has no server-side name search — the full reference
// set is fetched once per dialog-open (same ceiling used elsewhere for "fetch it all" reference
// lists, e.g. useLocales) and search/pagination are both done client-side against it.
const FETCH_SIZE = 50

export interface PlatformFacilityGroupPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedId?: number
  onSelect: (group: PlatformFacilityGroupSummary) => void
}

export function PlatformFacilityGroupPickerDialog({
  open,
  onOpenChange,
  selectedId,
  onSelect,
}: PlatformFacilityGroupPickerDialogProps) {
  const { t } = useTranslation()
  const [allGroups, setAllGroups] = useState<PlatformFacilityGroupSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (open) {
      setSearch("")
      setPage(0)
      load()
    } else {
      setAllGroups([])
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPage(0)
  }, [search])

  async function load() {
    setLoading(true)
    try {
      const resortScopeId = await getResortFacilityScopeId()
      const res = await platformFacilityGroupsService.list({
        page: 0,
        size: FETCH_SIZE,
        sort_by: "name",
        facilityScopeIds: resortScopeId != null ? [resortScopeId] : undefined,
      })
      setAllGroups(res.data)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allGroups
    return allGroups.filter((g) =>
      g.code.toLowerCase().includes(q) ||
      (g.locale?.name ?? "").toLowerCase().includes(q)
    )
  }, [allGroups, search])

  const totalElements = filteredGroups.length
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE))
  const groups = filteredGroups.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  const hasNext = page < totalPages - 1
  const hasPrevious = page > 0

  function handleSelect(group: PlatformFacilityGroupSummary) {
    onSelect(group)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogTitle className="sr-only">{t("resortFacilityGroup.selectPlatformGroup")}</DialogTitle>

        {/* Header */}
        <div className="flex flex-col gap-3 px-5 pt-4 pb-4 pr-12 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{t("resortFacilityGroup.selectPlatformGroup")}</p>
              {totalElements > 0 && (
                <p className="text-xs text-muted-foreground">{totalElements} {t("resortFacilityGroup.platformGroup").toLowerCase()}s</p>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("resortFacilityGroup.searchPlatformGroup")}
              className="pl-8 h-8 text-sm w-full"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground border rounded-xl border-dashed">
              {t("resortFacilityGroup.noPlatformGroups")}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {groups.map((g) => {
                const isSelected = g.id === selectedId
                const name = g.locale?.name ?? g.code
                const accentColor = String(g.icon_meta?.color ?? "") || undefined
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleSelect(g)}
                    className={`text-left rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-primary/20" : "bg-muted"
                        }`}
                        style={accentColor ? { background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` } : undefined}
                      >
                        {g.icon_type === "LUCIDE" && g.icon_value ? (
                          <LucideIconRenderer name={g.icon_value} size={16} style={{ color: accentColor ? "white" : undefined }} />
                        ) : (g.icon_type === "IMAGE" || g.icon_type === "EXTERNAL") && g.icon_value ? (
                          <img src={g.icon_value} alt={name} className="h-5 w-5 object-contain" />
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground">{name[0]?.toUpperCase() ?? "?"}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm leading-tight truncate">{name}</p>
                        <Badge
                          variant="outline"
                          className={`font-mono text-[10px] px-1.5 py-0 h-4 mt-1 ${
                            isSelected ? "border-primary/30 text-primary" : ""
                          }`}
                        >
                          {g.code}
                        </Badge>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t px-5 py-3 shrink-0">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalElements={totalElements}
              hasNext={hasNext}
              hasPrevious={hasPrevious}
              onPageChange={setPage}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
