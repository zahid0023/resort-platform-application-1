"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Eye, Trash2 } from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Button,
} from "@resort/shadcn-ui"
import { LucideIconRenderer } from "ui-blocks"
import { PageActions } from "@/components/shared/page-actions"
import { PageHeader } from "@/components/shared/page-header"
import { Pagination } from "@/components/shared/pagination"
import { ResortFacilityCard } from "@/components/resort-facilities/resort-facility-card"
import {
  ResortFacilityDialog,
  emptyResortFacilityForm,
} from "@/components/resort-facilities/resort-facility-dialog"
import type { ResortFacilityDialogMode, ResortFacilityFormState } from "@/components/resort-facilities/types"
import { toFormState as toFacilityFormState } from "@/components/resort-facilities/types"
import {
  resortFacilitiesService,
  type ResortFacilitySummary,
} from "@/services/resort-facilities"
import {
  ResortFacilityGroupDialog,
  emptyResortFacilityGroupForm,
} from "@/components/resort-facility-groups/resort-facility-group-dialog"
import type { ResortFacilityGroupDialogMode, ResortFacilityGroupFormState } from "@/components/resort-facility-groups/types"
import { toFormState as toGroupFormState } from "@/components/resort-facility-groups/types"
import {
  resortFacilityGroupsService,
  type ResortFacilityGroupSummary,
  type ListParams as GroupListParams,
} from "@/services/resort-facility-groups"
import { useLocales } from "@/providers/locales-provider"
import { useDaysOfWeek } from "@/providers/days-of-week-provider"

const GROUPS_PAGE_SIZE = 4
const FACILITIES_PAGE_SIZE = 20
const ALL_FIELD = "all"

interface GroupSection {
  group: ResortFacilityGroupSummary
  facilities: ResortFacilitySummary[]
  page: number
  totalPages: number
  totalElements: number
  hasNext: boolean
  hasPrevious: boolean
  loading: boolean
}

// A resort facility only means anything in the context of the group that owns it — so this page
// fetches groups (4 at a time) and, for each one, its facilities — group -> facilities, inline.
export default function ResortFacilitiesPage() {
  const { t } = useTranslation()
  const params = useParams()
  const resortId = Number(params.id)

  const [sections, setSections] = useState<GroupSection[]>([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [groupPage, setGroupPage] = useState(0)
  const [groupTotalPages, setGroupTotalPages] = useState(0)
  const [groupTotalElements, setGroupTotalElements] = useState(0)
  const [groupHasNext, setGroupHasNext] = useState(false)
  const [groupHasPrevious, setGroupHasPrevious] = useState(false)

  const [search, setSearch] = useState("")
  const [searchField, setSearchField] = useState(ALL_FIELD)
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("ASC")

  const { locales: availableLocales, totalCount: totalLocaleCount, loaded: localesLoaded, refresh: refreshLocales } = useLocales()
  const { daysOfWeek: availableDaysOfWeek, loaded: daysOfWeekLoaded, refresh: refreshDaysOfWeek } = useDaysOfWeek()

  // Group dialog — create a new group, or view/edit an existing one's own details
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [groupMode, setGroupMode] = useState<ResortFacilityGroupDialogMode>("create")
  const [activeGroupId, setActiveGroupId] = useState<number | undefined>(undefined)
  const [groupForm, setGroupForm] = useState<ResortFacilityGroupFormState>(emptyResortFacilityGroupForm)
  const [groupDeleteTarget, setGroupDeleteTarget] = useState<ResortFacilityGroupSummary | null>(null)

  // Facility dialog — create/view a facility within a specific group's section
  const [facilityDialogOpen, setFacilityDialogOpen] = useState(false)
  const [facilityMode, setFacilityMode] = useState<ResortFacilityDialogMode>("create")
  const [activeFacilityId, setActiveFacilityId] = useState<number | undefined>(undefined)
  const [dialogGroupId, setDialogGroupId] = useState(0)
  const [dialogGroupName, setDialogGroupName] = useState("")
  const [dialogPlatformGroupId, setDialogPlatformGroupId] = useState<number | undefined>(undefined)
  const [facilityForm, setFacilityForm] = useState<ResortFacilityFormState>(emptyResortFacilityForm)
  const [facilityDeleteTarget, setFacilityDeleteTarget] = useState<{ facility: ResortFacilitySummary; groupId: number } | null>(null)

  const isFirstRender = useRef(true)

  function toFieldOption(key: string) {
    return { value: key, label: t(`apiFields.${key}`) }
  }

  const searchFields = useMemo(() => [
    { value: ALL_FIELD, label: t("common.allFields") },
  ], [t]) // eslint-disable-line react-hooks/exhaustive-deps

  const sortFields = useMemo(() => [
    ...["createdAt", "facilityGroupEntity.id", "name"].map(toFieldOption),
  ], [t]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadGroupPage(p: number, overrides: Partial<GroupListParams> = {}) {
    setGroupsLoading(true)
    try {
      const groupRes = await resortFacilityGroupsService.list(resortId, {
        page: p,
        size: GROUPS_PAGE_SIZE,
        sort_by: sortBy as GroupListParams["sort_by"],
        sort_dir: sortDir,
        name: search.trim() || undefined,
        ...overrides,
      })
      setGroupPage(p)
      setGroupTotalPages(groupRes.total_pages)
      setGroupTotalElements(groupRes.total_elements)
      setGroupHasNext(groupRes.has_next)
      setGroupHasPrevious(groupRes.has_previous)

      setSections(groupRes.data.map((group) => ({
        group,
        facilities: [],
        page: 0,
        totalPages: 0,
        totalElements: 0,
        hasNext: false,
        hasPrevious: false,
        loading: true,
      })))

      const facilityResults = await Promise.all(
        groupRes.data.map((group) =>
          resortFacilitiesService.list(resortId, {
            page: 0,
            size: FACILITIES_PAGE_SIZE,
            sort_by: "createdAt",
            resort_facility_group_id: group.id,
          }),
        ),
      )

      setSections(groupRes.data.map((group, i) => ({
        group,
        facilities: facilityResults[i].data,
        page: 0,
        totalPages: facilityResults[i].total_pages,
        totalElements: facilityResults[i].total_elements,
        hasNext: facilityResults[i].has_next,
        hasPrevious: facilityResults[i].has_previous,
        loading: false,
      })))
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setGroupsLoading(false)
    }
  }

  async function loadFacilitiesForGroup(groupId: number, p: number) {
    setSections((prev) => prev.map((s) => s.group.id === groupId ? { ...s, loading: true } : s))
    try {
      const res = await resortFacilitiesService.list(resortId, {
        page: p,
        size: FACILITIES_PAGE_SIZE,
        sort_by: "createdAt",
        resort_facility_group_id: groupId,
      })
      setSections((prev) => prev.map((s) =>
        s.group.id === groupId
          ? {
              ...s,
              facilities: res.data,
              page: p,
              totalPages: res.total_pages,
              totalElements: res.total_elements,
              hasNext: res.has_next,
              hasPrevious: res.has_previous,
              loading: false,
            }
          : s,
      ))
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  useEffect(() => { loadGroupPage(0) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return () => { isFirstRender.current = true }
    }
    const timer = setTimeout(() => loadGroupPage(0), 350)
    return () => clearTimeout(timer)
  }, [search, searchField]) // eslint-disable-line react-hooks/exhaustive-deps

  function loadLocales() {
    if (localesLoaded) return
    refreshLocales().catch((err) => toast.error((err as Error).message))
  }

  function loadDaysOfWeek() {
    if (daysOfWeekLoaded) return
    refreshDaysOfWeek().catch((err) => toast.error((err as Error).message))
  }

  // ── Group handlers ──────────────────────────────────────────────────────────
  function openCreateGroup() {
    loadLocales()
    setGroupMode("create")
    setActiveGroupId(undefined)
    setGroupForm(emptyResortFacilityGroupForm)
    setGroupDialogOpen(true)
  }

  function openViewGroup(group: ResortFacilityGroupSummary) {
    loadLocales()
    setGroupMode("view")
    setActiveGroupId(group.id)
    setGroupForm(toGroupFormState(group))
    setGroupDialogOpen(true)
  }

  function handleSortByChange(value: string) {
    setSortBy(value)
    loadGroupPage(0, { sort_by: value as GroupListParams["sort_by"] })
  }

  function handleSortDirChange(dir: "ASC" | "DESC") {
    setSortDir(dir)
    loadGroupPage(0, { sort_dir: dir })
  }

  async function confirmDeleteGroup() {
    if (!groupDeleteTarget) return
    try {
      await resortFacilityGroupsService.remove(resortId, groupDeleteTarget.id)
      toast.success(t("resortFacilityGroup.deleted"))
      setGroupDeleteTarget(null)
      await loadGroupPage(0)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  // ── Facility handlers ────────────────────────────────────────────────────────
  function openCreateFacility(group: ResortFacilityGroupSummary) {
    setDialogGroupId(group.id)
    setDialogGroupName(group.locale?.name ?? `Group #${group.id}`)
    setDialogPlatformGroupId(group.facility_group_id ?? undefined)
    setFacilityMode("create")
    setActiveFacilityId(undefined)
    setFacilityForm({ ...emptyResortFacilityForm, resort_facility_group_id: group.id })
    setFacilityDialogOpen(true)
  }

  async function openViewFacility(f: ResortFacilitySummary, group: ResortFacilityGroupSummary) {
    setDialogGroupId(group.id)
    setDialogGroupName(group.locale?.name ?? `Group #${group.id}`)
    setFacilityMode("view")
    setActiveFacilityId(f.id)
    setFacilityForm(toFacilityFormState(f))
    setFacilityDialogOpen(true)
    try {
      const res = await resortFacilitiesService.get(resortId, f.id)
      setFacilityForm(toFacilityFormState(res.data))
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  function handleFacilitySaved() {
    if (dialogGroupId > 0) loadFacilitiesForGroup(dialogGroupId, 0)
  }

  async function confirmDeleteFacility() {
    if (!facilityDeleteTarget) return
    try {
      await resortFacilitiesService.remove(resortId, facilityDeleteTarget.facility.id)
      toast.success(t("resortFacility.deleted"))
      setFacilityDeleteTarget(null)
      await loadFacilitiesForGroup(facilityDeleteTarget.groupId, 0)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">

      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full pb-2">
        <PageHeader
          eyebrow={t("resortPortal.title")}
          title={t("resortFacility.title")}
          subtitle={t("resortFacilityGroup.subtitle")}
        />
        <div className="flex flex-col sm:items-end gap-2">
          <PageActions
            fields={searchFields}
            searchField={searchField}
            onSearchFieldChange={setSearchField}
            search={search}
            onSearchChange={setSearch}
            sort={{
              fields: sortFields,
              sortBy,
              onSortByChange: handleSortByChange,
              sortDir,
              onSortDirChange: handleSortDirChange,
            }}
            newLabel={t("resortFacilityGroup.new")}
            onNew={openCreateGroup}
          />
        </div>
      </header>

      <main className="flex flex-col gap-14">
        {groupsLoading && sections.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">{t("resortFacilityGroup.loading")}</div>
        ) : sections.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            {t("resortFacilityGroup.empty")}
          </div>
        ) : (
          sections.map((section) => {
            const accentColor = String(section.group.icon_meta?.color ?? "") || undefined
            const groupName = section.group.locale?.name ?? `Group #${section.group.id}`
            const facilityNames = Object.fromEntries(
              section.facilities.map((f) => [f.id, f.locale?.name ?? ""]),
            )

            return (
              <section key={section.group.id} className="flex flex-col gap-5">
                {/* Group section header — plain info + actions, not a navigable card */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0"
                      style={{
                        background: accentColor
                          ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`
                          : undefined,
                        boxShadow: accentColor ? `0 4px 14px -4px ${accentColor}80` : undefined,
                      }}
                    >
                      {section.group.icon_type === "LUCIDE" && section.group.icon_value ? (
                        <LucideIconRenderer name={section.group.icon_value} size={16} style={{ color: "white" }} />
                      ) : (section.group.icon_type === "IMAGE" || section.group.icon_type === "EXTERNAL") && section.group.icon_value ? (
                        <img src={section.group.icon_value} alt={groupName} className="h-4 w-4 object-contain" />
                      ) : (
                        <span className="font-mono text-xs font-semibold text-white">
                          {groupName[0]?.toUpperCase() ?? "?"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-base leading-tight truncate">{groupName}</h2>
                      <p className="text-xs text-muted-foreground">
                        {section.totalElements} facilit{section.totalElements !== 1 ? "ies" : "y"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7"
                      onClick={() => openViewGroup(section.group)} title="View details">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setGroupDeleteTarget(section.group)} title={t("common.delete")}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="h-7 text-xs px-2.5"
                      onClick={() => openCreateFacility(section.group)}>
                      + {t("resortFacility.new")}
                    </Button>
                  </div>
                </div>

                {/* Facilities belonging to this group */}
                {section.loading ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {t("resortFacility.loading")}
                  </div>
                ) : section.facilities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm border rounded-xl border-dashed">
                    {t("resortFacility.empty")}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {section.facilities.map((f) => (
                      <ResortFacilityCard
                        key={f.id}
                        facility={f}
                        defaultName={facilityNames[f.id]}
                        onView={(f) => openViewFacility(f, section.group)}
                        onDelete={(f) => setFacilityDeleteTarget({ facility: f, groupId: section.group.id })}
                      />
                    ))}
                  </div>
                )}

                <Pagination
                  currentPage={section.page}
                  totalPages={section.totalPages}
                  totalElements={section.totalElements}
                  hasNext={section.hasNext}
                  hasPrevious={section.hasPrevious}
                  onPageChange={(p) => loadFacilitiesForGroup(section.group.id, p)}
                />
              </section>
            )
          })
        )}

        {!groupsLoading && groupTotalPages > 1 && (
          <div className="pt-4 border-t">
            <Pagination
              currentPage={groupPage}
              totalPages={groupTotalPages}
              totalElements={groupTotalElements}
              hasNext={groupHasNext}
              hasPrevious={groupHasPrevious}
              onPageChange={loadGroupPage}
            />
          </div>
        )}
      </main>

      <ResortFacilityGroupDialog
        resortId={resortId}
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        mode={groupMode}
        groupId={activeGroupId}
        form={groupForm}
        onFormChange={setGroupForm}
        availableLocales={availableLocales}
        totalLocaleCount={totalLocaleCount}
        availableDaysOfWeek={availableDaysOfWeek}
        onOperatingHoursTabOpen={loadDaysOfWeek}
        onSaved={() => loadGroupPage(groupPage)}
      />

      <ResortFacilityDialog
        resortId={resortId}
        open={facilityDialogOpen}
        onOpenChange={setFacilityDialogOpen}
        mode={facilityMode}
        facilityId={activeFacilityId}
        form={facilityForm}
        onFormChange={setFacilityForm}
        availableLocales={availableLocales}
        totalLocaleCount={totalLocaleCount}
        availableDaysOfWeek={availableDaysOfWeek}
        onSaved={handleFacilitySaved}
        lockedGroupName={dialogGroupName}
        platformFacilityGroupId={dialogPlatformGroupId}
        onLocalesTabOpen={loadLocales}
        onOperatingHoursTabOpen={loadDaysOfWeek}
      />

      <AlertDialog open={!!groupDeleteTarget} onOpenChange={(o) => !o && setGroupDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resortFacilityGroup.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("resortFacilityGroup.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteGroup}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!facilityDeleteTarget} onOpenChange={(o) => !o && setFacilityDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resortFacility.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("resortFacility.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFacility}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
