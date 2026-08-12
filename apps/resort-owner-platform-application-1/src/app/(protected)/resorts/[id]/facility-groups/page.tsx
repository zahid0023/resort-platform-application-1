"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@resort/shadcn-ui"
import { PageActions } from "@/components/shared/page-actions"
import { PageHeader } from "@/components/shared/page-header"
import { Pagination } from "@/components/shared/pagination"
import { ResortFacilityGroupCard } from "@/components/resort-facility-groups/resort-facility-group-card"
import {
  ResortFacilityGroupDialog,
  emptyResortFacilityGroupForm,
} from "@/components/resort-facility-groups/resort-facility-group-dialog"
import type { ResortFacilityGroupDialogMode, ResortFacilityGroupFormState } from "@/components/resort-facility-groups/types"
import { toFormState } from "@/components/resort-facility-groups/types"
import {
  resortFacilityGroupsService,
  type ResortFacilityGroupSummary,
  type ListParams,
} from "@/services/resort-facility-groups"
import { useLocales } from "@/providers/locales-provider"

const PAGE_SIZE = 20
const ALL_FIELD = "all"

export default function ResortFacilityGroupsPage() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const resortId = Number(params.id)

  const [groups, setGroups] = useState<ResortFacilityGroupSummary[]>([])
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

  const { locales: availableLocales, totalCount: totalLocaleCount, loaded: localesLoaded, refresh: refreshLocales } = useLocales()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mode, setMode] = useState<ResortFacilityGroupDialogMode>("create")
  const [activeId, setActiveId] = useState<number | undefined>(undefined)
  const [form, setForm] = useState<ResortFacilityGroupFormState>(emptyResortFacilityGroupForm)
  const [deleteTarget, setDeleteTarget] = useState<ResortFacilityGroupSummary | null>(null)

  const dialogOpenRef = useRef(dialogOpen)
  const activeIdRef = useRef(activeId)
  useEffect(() => { dialogOpenRef.current = dialogOpen }, [dialogOpen])
  useEffect(() => { activeIdRef.current = activeId }, [activeId])

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

  async function refresh(overrides: Partial<ListParams> = {}) {
    setLoading(true)
    try {
      const res = await resortFacilityGroupsService.list(resortId, {
        page,
        size: PAGE_SIZE,
        sort_by: sortBy as ListParams["sort_by"],
        sort_dir: sortDir,
        ...overrides,
      })
      setGroups(res.data)
      setTotalPages(res.total_pages)
      setTotalElements(res.total_elements)
      setHasNext(res.has_next)
      setHasPrevious(res.has_previous)

      setForm((prev) => {
        if (!dialogOpenRef.current || activeIdRef.current == null) return prev
        const updated = res.data.find((g) => g.id === activeIdRef.current)
        if (!updated) return prev
        return { ...prev, locales: toFormState(updated).locales }
      })
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

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

  function loadLocales() {
    if (localesLoaded) return
    refreshLocales().catch((err) => toast.error((err as Error).message))
  }

  const defaultNames = useMemo(
    () => Object.fromEntries(groups.map((g) => [g.id, g.locales[0]?.name ?? ""])),
    [groups],
  )

  const displayGroups = useMemo(() => {
    if (!search.trim()) return groups
    const q = search.trim().toLowerCase()
    return groups.filter((g) => (defaultNames[g.id] ?? "").toLowerCase().includes(q))
  }, [groups, defaultNames, search])

  function openCreate() {
    loadLocales()
    setMode("create")
    setActiveId(undefined)
    setForm(emptyResortFacilityGroupForm)
    setDialogOpen(true)
  }

  function openView(g: ResortFacilityGroupSummary) {
    loadLocales()
    setMode("view")
    setActiveId(g.id)
    setForm(toFormState(g))
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

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await resortFacilityGroupsService.remove(resortId, deleteTarget.id)
      toast.success(t("resortFacilityGroup.deleted"))
      setDeleteTarget(null)
      await refresh({ page: 0 })
      setPage(0)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">

      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
        <PageHeader
          eyebrow={t("resortPortal.title")}
          title={t("resortFacilityGroup.title")}
          subtitle={t("resortFacilityGroup.subtitle")}
        />
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
          onNew={openCreate}
        />
      </header>

      <main className="flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">{t("resortFacilityGroup.loading")}</div>
        ) : displayGroups.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            {t("resortFacilityGroup.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayGroups.map((g) => (
              <ResortFacilityGroupCard
                key={g.id}
                group={g}
                defaultName={defaultNames[g.id]}
                onNavigate={(g) => router.push(`/resorts/${resortId}/facility-groups/${g.id}/facilities`)}
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

      <ResortFacilityGroupDialog
        resortId={resortId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        groupId={activeId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        totalLocaleCount={totalLocaleCount}
        onSaved={() => refresh()}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resortFacilityGroup.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("resortFacilityGroup.deleteDesc")}</AlertDialogDescription>
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
