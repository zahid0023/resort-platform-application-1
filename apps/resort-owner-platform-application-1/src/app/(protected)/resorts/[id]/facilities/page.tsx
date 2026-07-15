"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { LayoutGrid, Layers } from "lucide-react"
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
import { toFormState } from "@/components/resort-facilities/types"
import {
  resortFacilitiesService,
  type ResortFacilitySummary,
  type ListParams,
} from "@/services/resort-facilities"
import {
  resortFacilityGroupsService,
  type ResortFacilityGroupSummary,
} from "@/services/resort-facility-groups"
import { localesService, type Locale } from "@/services/locales"

const PAGE_SIZE = 20
const GROUPS_PAGE_SIZE = 6
const ALL_FIELD = "all"

type ViewMode = "all" | "by-group"

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

export default function ResortFacilitiesOverviewPage() {
  const { t } = useTranslation()
  const params = useParams()
  const resortId = Number(params.id)

  // ── View toggle ─────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("all")

  // ── All-facilities state ────────────────────────────────────────────────────
  const [facilities, setFacilities] = useState<ResortFacilitySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)

  const [search, setSearch] = useState("")
  const [searchField, setSearchField] = useState(ALL_FIELD)
  const [sortBy, setSortBy] = useState("sortOrder")
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("ASC")

  // ── By-group state ──────────────────────────────────────────────────────────
  const [groupSections, setGroupSections] = useState<GroupSection[]>([])
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [groupPage, setGroupPage] = useState(0)
  const [groupTotalPages, setGroupTotalPages] = useState(0)
  const [groupTotalElements, setGroupTotalElements] = useState(0)
  const [groupHasNext, setGroupHasNext] = useState(false)
  const [groupHasPrevious, setGroupHasPrevious] = useState(false)
  const byGroupInitialized = useRef(false)

  // ── Dialog / locales ────────────────────────────────────────────────────────
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([])
  const localesLoadedRef = useRef(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogGroupId, setDialogGroupId] = useState(0)
  const [mode, setMode] = useState<ResortFacilityDialogMode>("create")
  const [activeId, setActiveId] = useState<number | undefined>(undefined)
  const [form, setForm] = useState<ResortFacilityFormState>(emptyResortFacilityForm)
  const [deleteTarget, setDeleteTarget] = useState<{ facility: ResortFacilitySummary; groupId: number } | null>(null)

  const dialogOpenRef = useRef(dialogOpen)
  const activeIdRef = useRef(activeId)
  useEffect(() => { dialogOpenRef.current = dialogOpen }, [dialogOpen])
  useEffect(() => { activeIdRef.current = activeId }, [activeId])

  const isFirstRender = useRef(true)

  // ── Derived ─────────────────────────────────────────────────────────────────
  function toFieldOption(key: string) {
    return { value: key, label: t(`apiFields.${key}`) }
  }

  const searchFields = useMemo(() => [
    { value: ALL_FIELD, label: t("common.allFields") },
  ], [t]) // eslint-disable-line react-hooks/exhaustive-deps

  const sortFields = useMemo(() => [
    ...["sortOrder", "id", "createdAt"].map(toFieldOption),
  ], [t]) // eslint-disable-line react-hooks/exhaustive-deps

  const facilityNames = useMemo(
    () => Object.fromEntries(facilities.map((f) => [f.id, f.locales[0]?.name ?? ""])),
    [facilities],
  )

  const displayFacilities = useMemo(() => {
    if (!search.trim()) return facilities
    const q = search.trim().toLowerCase()
    return facilities.filter((f) => (facilityNames[f.id] ?? "").toLowerCase().includes(q))
  }, [facilities, facilityNames, search])

  // ── All-facilities fetch ────────────────────────────────────────────────────
  async function refresh(overrides: Partial<ListParams> = {}) {
    setLoading(true)
    try {
      const res = await resortFacilitiesService.list(resortId, {
        page,
        size: PAGE_SIZE,
        sort_by: sortBy as ListParams["sort_by"],
        sort_dir: sortDir,
        ...overrides,
      })
      setFacilities(res.data)
      setTotalPages(res.total_pages)
      setTotalElements(res.total_elements)
      setHasNext(res.has_next)
      setHasPrevious(res.has_previous)

      setForm((prev) => {
        if (!dialogOpenRef.current || activeIdRef.current == null) return prev
        const updated = res.data.find((f) => f.id === activeIdRef.current)
        if (!updated) return prev
        return { ...prev, locales: toFormState(updated).locales }
      })
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // ── By-group fetch ──────────────────────────────────────────────────────────
  async function loadGroupPage(p: number) {
    setGroupsLoading(true)
    try {
      const groupRes = await resortFacilityGroupsService.list(resortId, {
        page: p,
        size: GROUPS_PAGE_SIZE,
        sort_by: "sortOrder",
      })
      setGroupTotalPages(groupRes.total_pages)
      setGroupTotalElements(groupRes.total_elements)
      setGroupHasNext(groupRes.has_next)
      setGroupHasPrevious(groupRes.has_previous)

      setGroupSections(groupRes.data.map((g) => ({
        group: g,
        facilities: [],
        page: 0,
        totalPages: 0,
        totalElements: 0,
        hasNext: false,
        hasPrevious: false,
        loading: true,
      })))

      const facilityResults = await Promise.all(
        groupRes.data.map((g) =>
          resortFacilitiesService.list(resortId, {
            page: 0,
            size: PAGE_SIZE,
            sort_by: "sortOrder",
            resort_facility_group_id: g.id,
          }),
        ),
      )

      setGroupSections(groupRes.data.map((g, i) => ({
        group: g,
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
    setGroupSections((prev) =>
      prev.map((s) => s.group.id === groupId ? { ...s, loading: true } : s),
    )
    try {
      const res = await resortFacilitiesService.list(resortId, {
        page: p,
        size: PAGE_SIZE,
        sort_by: "sortOrder",
        resort_facility_group_id: groupId,
      })
      setGroupSections((prev) =>
        prev.map((s) =>
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
        ),
      )
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return () => { isFirstRender.current = true }
    }
    setPage(0)
    const timer = setTimeout(() => refresh({ page: 0 }), 350)
    return () => clearTimeout(timer)
  }, [search, searchField]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (viewMode === "by-group" && !byGroupInitialized.current) {
      byGroupInitialized.current = true
      setGroupPage(0)
      loadGroupPage(0)
    }
  }, [viewMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function loadLocales() {
    if (localesLoadedRef.current) return
    localesLoadedRef.current = true
    localesService
      .list({ size: 50, sort_by: "sortOrder" })
      .then((res) => setAvailableLocales(res.data))
      .catch(() => {})
  }

  function handleSaved() {
    if (viewMode === "all") {
      refresh()
    } else if (dialogGroupId > 0) {
      loadFacilitiesForGroup(dialogGroupId, 0)
    } else {
      loadGroupPage(groupPage)
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function openCreateAll() {
    loadLocales()
    setDialogGroupId(0)
    setMode("create")
    setActiveId(undefined)
    setForm(emptyResortFacilityForm)
    setDialogOpen(true)
  }

  function openCreateForGroup(groupId: number) {
    loadLocales()
    setDialogGroupId(groupId)
    setMode("create")
    setActiveId(undefined)
    setForm({ ...emptyResortFacilityForm, resort_facility_group_id: groupId })
    setDialogOpen(true)
  }

  function openView(f: ResortFacilitySummary) {
    loadLocales()
    setDialogGroupId(f.resort_facility_group_id)
    setMode("view")
    setActiveId(f.id)
    setForm(toFormState(f))
    setDialogOpen(true)
  }

  function handleSortByChange(value: string) {
    setSortBy(value)
    setPage(0)
    refresh({ sort_by: value as ListParams["sort_by"], page: 0 })
  }

  function handleSortDirChange(dir: "ASC" | "DESC") {
    setSortDir(dir)
    setPage(0)
    refresh({ sort_dir: dir, page: 0 })
  }

  function handlePageChange(p: number) {
    setPage(p)
    refresh({ page: p })
  }

  function handleGroupPageChange(p: number) {
    setGroupPage(p)
    byGroupInitialized.current = true
    loadGroupPage(p)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await resortFacilitiesService.remove(resortId, deleteTarget.facility.id)
      toast.success(t("resortFacility.deleted"))
      setDeleteTarget(null)
      if (viewMode === "all") {
        await refresh({ page: 0 })
        setPage(0)
      } else {
        await loadFacilitiesForGroup(deleteTarget.groupId, 0)
      }
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">

      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
        <PageHeader
          eyebrow={t("resortPortal.title")}
          title={t("resortFacility.title")}
          subtitle={viewMode === "all" ? t("resortFacility.overviewSubtitle") : t("resortFacility.subtitle")}
        />
        <div className="flex flex-col sm:items-end gap-3">
          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/30 self-start sm:self-auto">
            <Button
              type="button"
              size="sm"
              variant={viewMode === "all" ? "default" : "ghost"}
              className="h-7 px-3 gap-1.5 text-xs"
              onClick={() => setViewMode("all")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              {t("resortFacility.allFacilities")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "by-group" ? "default" : "ghost"}
              className="h-7 px-3 gap-1.5 text-xs"
              onClick={() => setViewMode("by-group")}
            >
              <Layers className="h-3.5 w-3.5" />
              {t("resortFacility.byGroup")}
            </Button>
          </div>

          {/* Search/sort in All view */}
          {viewMode === "all" && (
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
              newLabel={t("resortFacility.new")}
              onNew={openCreateAll}
            />
          )}

        </div>
      </header>

      {/* ── All Facilities view ────────────────────────────────────────────── */}
      {viewMode === "all" && (
        <main className="flex flex-col gap-4">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">{t("resortFacility.loading")}</div>
          ) : displayFacilities.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
              {t("resortFacility.empty")}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayFacilities.map((f) => (
                <ResortFacilityCard
                  key={f.id}
                  facility={f}
                  defaultName={facilityNames[f.id]}
                  onView={openView}
                  onDelete={(f) => setDeleteTarget({ facility: f, groupId: f.resort_facility_group_id })}
                />
              ))}
            </div>
          )}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalElements={totalElements}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
            onPageChange={handlePageChange}
          />
        </main>
      )}

      {/* ── By Group view ─────────────────────────────────────────────────── */}
      {viewMode === "by-group" && (
        <main className="flex flex-col gap-10">
          {groupsLoading && groupSections.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">{t("resortFacilityGroup.loading")}</div>
          ) : groupSections.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
              {t("resortFacility.empty")}
            </div>
          ) : (
            groupSections.map((section) => {
              const accentColor = String(section.group.icon_meta?.color ?? "") || undefined
              const groupName = section.group.locales[0]?.name ?? `Group #${section.group.id}`
              const sectionFacilityNames = Object.fromEntries(
                section.facilities.map((f) => [f.id, f.locales[0]?.name ?? ""]),
              )

              return (
                <section key={section.group.id} className="flex flex-col gap-4">
                  {/* Group section header */}
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center gap-3">
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
                        <h2 className="font-semibold text-base leading-tight">{groupName}</h2>
                        <p className="text-xs text-muted-foreground">
                          {section.totalElements} facilit{section.totalElements !== 1 ? "ies" : "y"}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2.5"
                      onClick={() => openCreateForGroup(section.group.id)}
                    >
                      + {t("resortFacility.new")}
                    </Button>
                  </div>

                  {/* Facilities grid */}
                  {section.loading ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {t("resortFacility.loading")}
                    </div>
                  ) : section.facilities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm border rounded-xl border-dashed">
                      {t("resortFacility.empty")}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {section.facilities.map((f) => (
                        <ResortFacilityCard
                          key={f.id}
                          facility={f}
                          defaultName={sectionFacilityNames[f.id]}
                          onView={openView}
                          onDelete={(f) => setDeleteTarget({ facility: f, groupId: section.group.id })}
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
            <div className="pt-2 border-t">
              <Pagination
                currentPage={groupPage}
                totalPages={groupTotalPages}
                totalElements={groupTotalElements}
                hasNext={groupHasNext}
                hasPrevious={groupHasPrevious}
                onPageChange={handleGroupPageChange}
              />
            </div>
          )}
        </main>
      )}

      <ResortFacilityDialog
        resortId={resortId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        facilityId={activeId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        onSaved={handleSaved}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resortFacility.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("resortFacility.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
