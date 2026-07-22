"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Dialog, DialogContent, DialogTitle,
} from "@resort/shadcn-ui"
import { BedDouble, Tag } from "lucide-react"
import { ResortRoomCategoryPricesSection } from "@/components/resort-room-category-prices/resort-room-category-prices-section"
import { PageActions } from "@/components/shared/page-actions"
import { PageHeader } from "@/components/shared/page-header"
import { Pagination } from "@/components/shared/pagination"
import { ResortRoomCategoryCard } from "@/components/resort-room-categories/resort-room-category-card"
import {
  ResortRoomCategoryDialog,
  emptyResortRoomCategoryForm,
} from "@/components/resort-room-categories/resort-room-category-dialog"
import type { ResortRoomCategoryDialogMode, ResortRoomCategoryFormState } from "@/components/resort-room-categories/types"
import { toFormState } from "@/components/resort-room-categories/types"
import {
  resortRoomCategoriesService,
  type ResortRoomCategory,
  type ResortRoomCategoryMeta,
  type ResortRoomCategoryBed,
  type ListParams,
} from "@/services/resort-room-categories"
import { localesService, type Locale } from "@/services/locales"

const PAGE_SIZE = 20

export default function ResortRoomCategoriesPage() {
  const { t } = useTranslation()
  const params = useParams()
  const resortId = Number(params.id)

  const [roomCategories, setRoomCategories] = useState<ResortRoomCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)

  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("sortOrder")
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("ASC")

  const [availableLocales, setAvailableLocales] = useState<Locale[]>([])
  const localesLoadedRef = useRef(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [mode, setMode] = useState<ResortRoomCategoryDialogMode>("create")
  const [activeId, setActiveId] = useState<number | undefined>(undefined)
  const [form, setForm] = useState<ResortRoomCategoryFormState>(emptyResortRoomCategoryForm)
  const [deleteTarget, setDeleteTarget] = useState<ResortRoomCategory | null>(null)
  const [pricesTarget, setPricesTarget] = useState<ResortRoomCategory | null>(null)
  const [activeMeta, setActiveMeta] = useState<ResortRoomCategoryMeta | undefined>(undefined)
  const [activeBeds, setActiveBeds] = useState<ResortRoomCategoryBed[] | undefined>(undefined)

  const dialogOpenRef = useRef(dialogOpen)
  const activeIdRef = useRef(activeId)
  useEffect(() => { dialogOpenRef.current = dialogOpen }, [dialogOpen])
  useEffect(() => { activeIdRef.current = activeId }, [activeId])

  const isFirstRender = useRef(true)

  const sortFields = [
    { value: "sortOrder", label: t("apiFields.sortOrder") },
    { value: "id", label: t("apiFields.id") },
    { value: "code", label: "Code" },
    { value: "maxAdults", label: t("resortRoomCategory.maxAdults") },
    { value: "maxOccupancy", label: t("resortRoomCategory.maxOccupancy") },
    { value: "createdAt", label: t("apiFields.createdAt") },
  ]

  async function refresh(overrides: Partial<ListParams> = {}) {
    setLoading(true)
    try {
      const res = await resortRoomCategoriesService.list(resortId, {
        page,
        size: PAGE_SIZE,
        sort_by: sortBy as ListParams["sort_by"],
        sort_dir: sortDir,
        code: search.trim() || undefined,
        ...overrides,
      })
      setRoomCategories(res.data)
      setTotalPages(res.total_pages)
      setTotalElements(res.total_elements)
      setHasNext(res.has_next)
      setHasPrevious(res.has_previous)

      if (dialogOpenRef.current && activeIdRef.current != null) {
        resortRoomCategoriesService.get(resortId, activeIdRef.current)
          .then(({ data }) => setForm(toFormState(data)))
          .catch(() => {})
      }
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
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  function loadLocales() {
    if (localesLoadedRef.current) return
    localesLoadedRef.current = true
    localesService
      .list({ size: 50, sort_by: "sortOrder" })
      .then((res) => setAvailableLocales(res.data))
      .catch(() => {})
  }

  function openCreate() {
    loadLocales()
    setMode("create")
    setActiveId(undefined)
    setForm(emptyResortRoomCategoryForm)
    setDialogOpen(true)
  }

  function openView(rc: ResortRoomCategory) {
    loadLocales()
    setMode("view")
    setActiveId(rc.id)
    setForm(toFormState(rc))
    setActiveMeta(rc.meta)
    setActiveBeds(rc.beds)
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
      await resortRoomCategoriesService.remove(resortId, deleteTarget.id)
      toast.success(t("resortRoomCategory.deleted"))
      setDeleteTarget(null)
      await refresh({ page: 0 })
      setPage(0)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const defaultNames = Object.fromEntries(
    roomCategories.map((rc) => [rc.id, rc.locales[0]?.name ?? ""])
  )

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
        <PageHeader
          eyebrow={t("resortPortal.title")}
          title={t("resortRoomCategory.title")}
          subtitle={t("resortRoomCategory.subtitle")}
        />
        <PageActions
          fields={[{ value: "code", label: "Code" }]}
          searchField="code"
          onSearchFieldChange={() => {}}
          search={search}
          onSearchChange={setSearch}
          sort={{
            fields: sortFields,
            sortBy,
            onSortByChange: handleSortByChange,
            sortDir,
            onSortDirChange: handleSortDirChange,
          }}
          newLabel={t("resortRoomCategory.new")}
          onNew={openCreate}
        />
      </header>

      <main className="flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">{t("resortRoomCategory.loading")}</div>
        ) : roomCategories.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
            {t("resortRoomCategory.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roomCategories.map((rc) => (
              <ResortRoomCategoryCard
                key={rc.id}
                roomCategory={rc}
                defaultName={defaultNames[rc.id]}
                onView={openView}
                onPrices={setPricesTarget}
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

      <ResortRoomCategoryDialog
        resortId={resortId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        resortRoomCategoryId={activeId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        onSaved={() => refresh()}
        meta={activeMeta}
        beds={activeBeds}
      />

      {/* Prices dialog */}
      <Dialog open={!!pricesTarget} onOpenChange={(o) => !o && setPricesTarget(null)}>
        <DialogContent
          className="max-w-xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">{t("resortRoomCategoryPrice.title")}</DialogTitle>
          <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Tag className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("resortRoomCategoryPrice.title")}</p>
              <p className="text-xs text-muted-foreground">
                <BedDouble className="inline h-3 w-3 mr-1 mb-0.5" />
                {pricesTarget ? (pricesTarget.locales[0]?.name ?? pricesTarget.code) : ""}
              </p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {pricesTarget && (
              <ResortRoomCategoryPricesSection
                resortId={resortId}
                resortRoomCategoryId={pricesTarget.id}
                open={!!pricesTarget}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resortRoomCategory.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("resortRoomCategory.deleteDesc")}</AlertDialogDescription>
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
