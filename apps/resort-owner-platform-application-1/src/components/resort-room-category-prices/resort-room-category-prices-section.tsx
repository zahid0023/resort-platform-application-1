"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, Plus } from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Button,
} from "@resort/shadcn-ui"
import { toast } from "sonner"
import { resortRoomCategoryPricesService, type ResortRoomCategoryPrice } from "@/services/resort-room-category-prices"
import { LoadMore } from "@/components/shared/infinite-pagination"
import { ResortRoomCategoryPriceCard } from "./resort-room-category-price-card"
import { ResortRoomCategoryPriceDialog, type ResortRoomCategoryPriceDialogMode } from "./resort-room-category-price-dialog"

const PAGE_SIZE = 20

export interface ResortRoomCategoryPricesSectionProps {
  resortId: number
  resortRoomCategoryId: number
  open: boolean
}

export function ResortRoomCategoryPricesSection({
  resortId,
  resortRoomCategoryId,
  open,
}: ResortRoomCategoryPricesSectionProps) {
  const { t } = useTranslation()

  const [prices, setPrices] = useState<ResortRoomCategoryPrice[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [totalElements, setTotalElements] = useState(0)
  const loadedRef = useRef(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<ResortRoomCategoryPriceDialogMode>("create")
  const [editingPrice, setEditingPrice] = useState<ResortRoomCategoryPrice | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<ResortRoomCategoryPrice | null>(null)

  useEffect(() => {
    if (open && !loadedRef.current) {
      loadedRef.current = true
      loadPrices(0, true)
    }
    if (!open) {
      loadedRef.current = false
      setPrices([])
      setPage(0)
      setHasNext(false)
      setTotalElements(0)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadPrices(p: number, reset = false) {
    setLoading(true)
    try {
      const res = await resortRoomCategoryPricesService.list(resortId, resortRoomCategoryId, {
        page: p,
        size: PAGE_SIZE,
        sort_by: "priority",
        sort_dir: "DESC",
      })
      setPrices((prev) => (reset ? res.data : [...prev, ...res.data]))
      setPage(p)
      setHasNext(res.has_next)
      setTotalElements(res.total_elements)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setDialogMode("create")
    setEditingPrice(undefined)
    setDialogOpen(true)
  }

  function openEdit(price: ResortRoomCategoryPrice) {
    setDialogMode("edit")
    setEditingPrice(price)
    setDialogOpen(true)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await resortRoomCategoryPricesService.remove(resortId, resortRoomCategoryId, deleteTarget.id)
      toast.success(t("resortRoomCategoryPrice.deleted"))
      setDeleteTarget(null)
      await loadPrices(0, true)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("resortRoomCategoryPrice.title")}
          </h3>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={openCreate} className="h-7 text-xs px-2.5 gap-1">
          <Plus className="h-3.5 w-3.5" /> {t("resortRoomCategoryPrice.new")}
        </Button>
      </div>

      {loading && prices.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : prices.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed py-10 text-sm text-muted-foreground">
          {t("resortRoomCategoryPrice.empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {prices.map((p) => (
            <ResortRoomCategoryPriceCard
              key={p.id}
              price={p}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
          <LoadMore
            hasNext={hasNext}
            loading={loading}
            onLoadMore={() => loadPrices(page + 1)}
            totalLoaded={prices.length}
            totalElements={totalElements}
          />
        </div>
      )}

      <ResortRoomCategoryPriceDialog
        resortId={resortId}
        resortRoomCategoryId={resortRoomCategoryId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        price={editingPrice}
        onSaved={() => loadPrices(0, true)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resortRoomCategoryPrice.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("resortRoomCategoryPrice.deleteDesc")}</AlertDialogDescription>
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
