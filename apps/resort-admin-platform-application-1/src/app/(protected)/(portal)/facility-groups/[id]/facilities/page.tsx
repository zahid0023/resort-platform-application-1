"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Plus, Search, X, ChevronLeftIcon, ChevronRightIcon, ArrowLeftIcon, LayersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
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
  FacilityDialog,
  type FacilityDialogMode,
  type FacilityFormState,
  emptyFacilityForm,
} from "@/components/facilities/facility-dialog"
import { FacilityCard } from "@/components/facilities/facility-card"
import { LucideIconRenderer } from "ui-blocks"
import {
  listFacilities,
  getFacility,
  deleteFacility,
  type FacilitySummary,
  type FacilityListResponse,
} from "@/services/facilities"
import { getFacilityGroup, type FacilityGroup } from "@/services/facility-groups"
import { localesService, type Locale } from "@/services/locales"

type SearchField = "all" | "code" | "name" | "icon"

export default function GroupFacilitiesPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const groupId = Number(id)

  const [group, setGroup] = useState<FacilityGroup | null>(null)
  const [groupLoading, setGroupLoading] = useState(true)
  const [data, setData] = useState<FacilityListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([])
  const [search, setSearch] = useState("")
  const [searchField, setSearchField] = useState<SearchField>("all")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<FacilityDialogMode>("create")
  const [facilityId, setFacilityId] = useState<number | undefined>(undefined)
  const [form, setForm] = useState<FacilityFormState>(emptyFacilityForm)

  const [deleteTarget, setDeleteTarget] = useState<FacilitySummary | null>(null)

  useEffect(() => {
    if (!groupId) return
    setGroupLoading(true)
    getFacilityGroup(groupId)
      .then((res) => setGroup(res.data))
      .catch((err) => toast.error(err instanceof Error ? err.message : t("facility.errLoadGroup")))
      .finally(() => setGroupLoading(false))
  }, [groupId])

  useEffect(() => {
    localesService.list({ size: 50, sort_by: "sortOrder" })
      .then((res) => setAvailableLocales(res.data))
      .catch(() => {})
  }, [])

  const fetchList = useCallback(async () => {
    if (!groupId) return
    setLoading(true)
    try {
      setData(await listFacilities(groupId, { page, size: 50, sort_by: "sort_order", sort_dir: "ASC" }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("facility.errLoad"))
    } finally {
      setLoading(false)
    }
  }, [groupId, page])

  useEffect(() => { fetchList() }, [fetchList])

  const filtered = useMemo(() => {
    const items = data?.data ?? []
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => {
      const code = item.code.toLowerCase()
      const name = (item.locales[0]?.name ?? "").toLowerCase()
      const icon = (item.icon_value ?? "").toLowerCase()
      switch (searchField) {
        case "code": return code.includes(q)
        case "name": return name.includes(q)
        case "icon": return icon.includes(q)
        default: return code.includes(q) || name.includes(q) || icon.includes(q)
      }
    })
  }, [data, search, searchField])

  function openCreate() {
    setDialogMode("create")
    setFacilityId(undefined)
    setForm(emptyFacilityForm)
    setDialogOpen(true)
  }

  async function openView(row: FacilitySummary) {
    try {
      const res = await getFacility(groupId, row.id)
      const f = res.data
      const meta = f.icon_meta ?? {}
      const color = typeof meta.color === "string" ? meta.color : ""
      const sizeRaw = meta.size
      const size = typeof sizeRaw === "number" ? String(sizeRaw) : typeof sizeRaw === "string" ? sizeRaw : ""
      setForm({
        code: f.code,
        sort_order: f.sort_order ?? 0,
        icon_type: f.icon_type,
        icon_value: f.icon_value,
        icon_color: color,
        icon_size: size,
        locales: f.locales.map((l) => ({
          id: l.id,
          locale_id: l.locale_id,
          name: l.name,
          description: l.description ?? "",
          sort_order: l.sort_order,
        })),
      })
      setFacilityId(f.id)
      setDialogMode("view")
      setDialogOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("facility.errLoad"))
    }
  }

  async function handleSaved() {
    await fetchList()
    if (facilityId != null) {
      try {
        const res = await getFacility(groupId, facilityId)
        const f = res.data
        const meta = f.icon_meta ?? {}
        const color = typeof meta.color === "string" ? meta.color : ""
        const sizeRaw = meta.size
        const size = typeof sizeRaw === "number" ? String(sizeRaw) : typeof sizeRaw === "string" ? sizeRaw : ""
        setForm((prev) => ({
          ...prev,
          sort_order: f.sort_order ?? 0,
          icon_type: f.icon_type,
          icon_value: f.icon_value,
          icon_color: color,
          icon_size: size,
          locales: f.locales.map((l) => ({
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
      await deleteFacility(groupId, deleteTarget.id)
      toast.success(t("facility.deleted"))
      setDeleteTarget(null)
      fetchList()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("facility.errDelete"))
    }
  }

  const iconColor = group?.icon_meta?.color as string | undefined
  const iconName = group?.icon_type === "LUCIDE" ? group.icon_value : undefined
  const groupName = group?.locales[0]?.name ?? group?.code
  const groupDescription = group?.locales[0]?.description

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="self-start -ml-2"
        onClick={() => router.push("/facility-groups")}
      >
        <ArrowLeftIcon />
        {t("facility.backToGroups")}
      </Button>

      {groupLoading ? (
        <div className="flex justify-center py-10"><Spinner className="size-6" /></div>
      ) : group ? (
        <Card className="p-6 shadow-card">
          <div className="flex items-start gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 bg-primary"
              style={iconColor ? {
                background: `linear-gradient(135deg, ${iconColor}, ${iconColor}cc)`,
                boxShadow: `0 8px 32px -8px ${iconColor}80`,
              } : undefined}
            >
              <LucideIconRenderer name={iconName} className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold truncate">{groupName}</h1>
                <Badge variant="secondary" className="font-mono text-[10px] shrink-0">{group.code}</Badge>
              </div>
              {groupDescription && (
                <p className="text-sm text-muted-foreground mb-3">{groupDescription}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <LayersIcon className="w-3.5 h-3.5" />
                  <span>{data ? (data.total_elements === 1 ? t("facility.countOne", { n: data.total_elements }) : t("facility.countMany", { n: data.total_elements })) : "—"}</span>
                </div>
                <span>{t("facility.sortOrderLabel", { n: group.sort_order })}</span>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">{t("facility.groupNotFound")}</p>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold">{t("facility.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("facility.subtitle")}</p>
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
                <SelectItem value="icon">{t("iconFields.iconValue")}</SelectItem>
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
          <Button size="sm" onClick={openCreate} disabled={!group}>
            <Plus className="h-4 w-4 mr-1" /> {t("facility.new")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="size-6" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex justify-center py-12 text-sm text-muted-foreground border rounded-xl border-dashed">
          {t("facility.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => (
            <FacilityCard
              key={row.id}
              data={row}
              onView={openView}
              onDelete={(id) => setDeleteTarget(data?.data.find((f) => f.id === id) ?? null)}
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

      <FacilityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        facilityGroupId={groupId}
        facilityId={facilityId}
        form={form}
        onFormChange={setForm}
        availableLocales={availableLocales}
        onSaved={handleSaved}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("facility.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("facility.deleteDesc", { code: deleteTarget?.code ?? `#${deleteTarget?.id}` })}
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
