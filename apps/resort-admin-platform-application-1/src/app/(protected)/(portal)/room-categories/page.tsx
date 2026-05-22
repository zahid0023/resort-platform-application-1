"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Plus, Search, X, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  RoomCategoryDialog,
  type RoomCategoryDialogMode,
  type RoomCategoryFormState,
  emptyRoomCategoryForm,
} from "@/components/room-categories/room-category-dialog"
import { RoomCategoryCard } from "@/components/room-categories/room-category-card"
import {
  listRoomCategories,
  getRoomCategory,
  deleteRoomCategory,
  type RoomCategorySummary,
  type RoomCategoryListResponse,
} from "@/services/room-categories"
import { localesService, type Locale } from "@/services/locales"

type SearchField = "all" | "code" | "name"

export default function RoomCategoriesPage() {
  const { t } = useTranslation()

  const [data, setData] = useState<RoomCategoryListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([])
  const [search, setSearch] = useState("")
  const [searchField, setSearchField] = useState<SearchField>("all")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<RoomCategoryDialogMode>("create")
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)
  const [form, setForm] = useState<RoomCategoryFormState>(emptyRoomCategoryForm)

  const [deleteTarget, setDeleteTarget] = useState<RoomCategorySummary | null>(null)

  useEffect(() => {
    localesService.list({ size: 50, sort_by: "sortOrder" })
      .then((res) => setAvailableLocales(res.data))
      .catch(() => {})
  }, [])

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      setData(await listRoomCategories({ page, size: 50, sort_by: "sortOrder", sort_dir: "ASC" }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("roomCategory.errLoad"))
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchList() }, [fetchList])

  const filtered = useMemo(() => {
    const items = data?.data ?? []
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => {
      const code = item.code.toLowerCase()
      const name = (item.locales[0]?.name ?? "").toLowerCase()
      switch (searchField) {
        case "code": return code.includes(q)
        case "name": return name.includes(q)
        default: return code.includes(q) || name.includes(q)
      }
    })
  }, [data, search, searchField])

  function openCreate() {
    setDialogMode("create")
    setCategoryId(undefined)
    setForm(emptyRoomCategoryForm)
    setDialogOpen(true)
  }

  async function openView(row: RoomCategorySummary) {
    try {
      const res = await getRoomCategory(row.id)
      const c = res.room_category
      setForm({
        code: c.code,
        sort_order: c.sort_order,
        locales: c.locales.map((l) => ({
          id: l.id,
          locale_id: l.locale_id,
          name: l.name,
          description: l.description ?? "",
          sort_order: l.sort_order,
        })),
      })
      setCategoryId(c.id)
      setDialogMode("view")
      setDialogOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("roomCategory.errLoad"))
    }
  }

  async function handleSaved() {
    await fetchList()
    if (categoryId != null) {
      try {
        const res = await getRoomCategory(categoryId)
        const c = res.room_category
        setForm((prev) => ({
          ...prev,
          sort_order: c.sort_order,
          locales: c.locales.map((l) => ({
            id: l.id,
            locale_id: l.locale_id,
            name: l.name,
            description: l.description ?? "",
            sort_order: l.sort_order,
          })),
        }))
      } catch {
        // best effort
      }
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await deleteRoomCategory(deleteTarget.id)
      toast.success(t("roomCategory.deleted"))
      setDeleteTarget(null)
      fetchList()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("roomCategory.errDelete"))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("common.admin")}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{t("roomCategory.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("roomCategory.subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-stretch">
            <Select value={searchField} onValueChange={(v) => setSearchField(v as SearchField)}>
              <SelectTrigger className="w-32 h-9 rounded-r-none border-r-0 bg-muted text-foreground focus:ring-0 focus:ring-offset-0 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allFields")}</SelectItem>
                <SelectItem value="code">{t("common.code")}</SelectItem>
                <SelectItem value="name">{t("common.localizedName")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`${t("common.search")}…`}
                className="pl-9 pr-9 w-48 h-9 rounded-l-none text-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> {t("roomCategory.new")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="size-6" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex justify-center py-12 text-sm text-muted-foreground border rounded-xl border-dashed">
          {t("roomCategory.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => (
            <RoomCategoryCard
              key={row.id}
              data={row}
              onView={openView}
              onDelete={(id) => setDeleteTarget(data?.data.find((c) => c.id === id) ?? null)}
            />
          ))}
        </div>
      )}

      {data && data.total_pages > 1 && !search && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("pagination.info", { current: data.current_page + 1, total: data.total_pages, elements: data.total_elements })}</span>
          <div className="flex gap-2">
            <Button size="icon-sm" variant="outline" disabled={!data.has_previous} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeftIcon />
            </Button>
            <Button size="icon-sm" variant="outline" disabled={!data.has_next} onClick={() => setPage((p) => p + 1)}>
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}

      <RoomCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        categoryId={categoryId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        onSaved={handleSaved}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("roomCategory.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("roomCategory.deleteDesc", { code: deleteTarget?.code ?? `#${deleteTarget?.id}` })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
