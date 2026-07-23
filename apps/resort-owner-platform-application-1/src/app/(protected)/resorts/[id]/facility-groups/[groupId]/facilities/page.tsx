"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Star } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Button,
} from "@resort/shadcn-ui"
import { PageActions } from "@/components/shared/page-actions"
import { PageHeader } from "@/components/shared/page-header"
import { Pagination } from "@/components/shared/pagination"
import { ResortFacilityCard } from "@/components/resort-facilities/resort-facility-card"
import {
  ResortFacilityDialog,
  emptyResortFacilityForm,
} from "@/components/resort-facilities/resort-facility-dialog"
import { ResortFacilityHighlightsDialog } from "@/components/resort-facilities/resort-facility-highlights-dialog"
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
const ALL_FIELD = "all"

export default function ResortFacilitiesPage() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const resortId = Number(params.id)
  const groupId = Number(params.groupId)

  // Group
  const [group, setGroup] = useState<ResortFacilityGroupSummary | null>(null)
  const [groupLoading, setGroupLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Facilities list
  const [facilities, setFacilities] = useState<ResortFacilitySummary[]>([])
  const [facilitiesLoading, setFacilitiesLoading] = useState(true)

  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)

  const [search, setSearch] = useState("")
  const [searchField, setSearchField] = useState(ALL_FIELD)
  const [sortBy, setSortBy] = useState("sortOrder")
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("ASC")

  const [availableLocales, setAvailableLocales] = useState<Locale[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mode, setMode] = useState<ResortFacilityDialogMode>("create")
  const [activeId, setActiveId] = useState<number | undefined>(undefined)
  const [form, setForm] = useState<ResortFacilityFormState>(emptyResortFacilityForm)
  const [deleteTarget, setDeleteTarget] = useState<ResortFacilitySummary | null>(null)
  const [highlightsOpen, setHighlightsOpen] = useState(false)

  const dialogOpenRef = useRef(dialogOpen)
  const activeIdRef = useRef(activeId)
  useEffect(() => { dialogOpenRef.current = dialogOpen }, [dialogOpen])
  useEffect(() => { activeIdRef.current = activeId }, [activeId])

  const localesLoadedRef = useRef(false)
  const isFirstRender = useRef(true)

  function toFieldOption(key: string) {
    return { value: key, label: t(`apiFields.${key}`) }
  }

  const searchFields = useMemo(() => [
    { value: ALL_FIELD, label: t("common.allFields") },
  ], [t]) // eslint-disable-line react-hooks/exhaustive-deps

  const sortFields = useMemo(() => [
    ...["sortOrder", "id", "createdAt"].map(toFieldOption),
  ], [t]) // eslint-disable-line react-hooks/exhaustive-deps

  async function refreshFacilities(overrides: Partial<ListParams> = {}) {
    setFacilitiesLoading(true)
    try {
      const res = await resortFacilitiesService.list(resortId, {
        page,
        size: PAGE_SIZE,
        sort_by: sortBy as ListParams["sort_by"],
        sort_dir: sortDir,
        resort_facility_group_id: groupId,
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
      setFacilitiesLoading(false)
    }
  }

  // Load group info
  useEffect(() => {
    if (!groupId) return
    resortFacilityGroupsService.get(resortId, groupId)
      .then((res) => setGroup(res.data))
      .catch((err) => {
        const msg = (err as Error).message ?? ""
        if (msg.toLowerCase().includes("not found")) setNotFound(true)
        else toast.error(msg)
      })
      .finally(() => setGroupLoading(false))
  }, [resortId, groupId])

  // Initial facilities load
  useEffect(() => { refreshFacilities() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return () => { isFirstRender.current = true }
    }
    setPage(0)
    const timer = setTimeout(() => refreshFacilities({ page: 0 }), 350)
    return () => clearTimeout(timer)
  }, [search, searchField]) // eslint-disable-line react-hooks/exhaustive-deps

  function loadLocales() {
    if (localesLoadedRef.current) return
    localesLoadedRef.current = true
    localesService
      .list({ size: 50, sort_by: "sortOrder" })
      .then((res) => setAvailableLocales(res.data))
      .catch((err) => toast.error((err as Error).message))
  }

  const defaultNames = useMemo(
    () => Object.fromEntries(facilities.map((f) => [f.id, f.locales[0]?.name ?? ""])),
    [facilities],
  )

  const displayFacilities = useMemo(() => {
    if (!search.trim()) return facilities
    const q = search.trim().toLowerCase()
    return facilities.filter((f) => (defaultNames[f.id] ?? "").toLowerCase().includes(q))
  }, [facilities, defaultNames, search])

  const groupName = group?.locales[0]?.name ?? `Group #${groupId}`

  function openCreate() {
    loadLocales()
    setMode("create")
    setActiveId(undefined)
    setForm({ ...emptyResortFacilityForm, resort_facility_group_id: groupId })
    setDialogOpen(true)
  }

  async function openView(f: ResortFacilitySummary) {
    loadLocales()
    setMode("view")
    setActiveId(f.id)
    setForm(toFormState(f))
    setDialogOpen(true)
    try {
      const res = await resortFacilitiesService.get(resortId, f.id)
      setForm(toFormState(res.data))
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  function handleSortByChange(value: string) {
    setSortBy(value)
    setPage(0)
    refreshFacilities({ sort_by: value as ListParams["sort_by"], page: 0 })
  }

  function handleSortDirChange(dir: "ASC" | "DESC") {
    setSortDir(dir)
    setPage(0)
    refreshFacilities({ sort_dir: dir, page: 0 })
  }

  function handlePageChange(p: number) {
    setPage(p)
    refreshFacilities({ page: p })
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await resortFacilitiesService.remove(resortId, deleteTarget.id)
      toast.success(t("resortFacility.deleted"))
      setDeleteTarget(null)
      await refreshFacilities({ page: 0 })
      setPage(0)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  if (groupLoading) {
    return (
      <div className="max-w-6xl mx-auto py-16 text-center text-muted-foreground">
        {t("resortFacilityGroup.loading")}
      </div>
    )
  }

  if (notFound || !group) {
    return (
      <div className="max-w-6xl mx-auto py-16 text-center text-muted-foreground">
        {t("resortFacilityGroup.notFound")}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">

      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="self-start gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("resortFacilityGroup.title")}
      </Button>

      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
        <PageHeader
          eyebrow={t("resortPortal.title")}
          title={groupName}
          subtitle={t("resortFacility.subtitle")}
        />
        <div className="flex flex-col sm:items-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs self-start sm:self-auto text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            onClick={() => setHighlightsOpen(true)}
          >
            <Star className="h-3.5 w-3.5 fill-current" />
            {t("resortFacility.manageHighlights")}
          </Button>
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
          onNew={openCreate}
        />
        </div>
      </header>

      <main className="flex flex-col gap-4">
        {facilitiesLoading ? (
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
                defaultName={defaultNames[f.id]}
                onView={openView}
                onDelete={setDeleteTarget}
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

      <ResortFacilityDialog
        resortId={resortId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        facilityId={activeId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        onSaved={() => refreshFacilities()}
        lockedGroupName={groupName}
        defaultFacilityMode={group?.facility_group_id ? "platform" : "custom"}
        platformFacilityGroupId={group?.facility_group_id}
      />

      <ResortFacilityHighlightsDialog
        resortId={resortId}
        open={highlightsOpen}
        onOpenChange={setHighlightsOpen}
        onSaved={() => refreshFacilities()}
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
