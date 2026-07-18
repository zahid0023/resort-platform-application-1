"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Info, Loader2, Search, Tag } from "lucide-react"
import { Badge, Button, Dialog, DialogContent, DialogTitle, Input } from "@resort/shadcn-ui"
import { priceTypesService, type PriceType } from "@/services/price-types"
import { Pagination } from "@/components/shared/pagination"
import { PriceTypeDetailDialog } from "./price-type-detail-dialog"

const PAGE_SIZE = 20

export interface PriceTypePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedId?: number
  onSelect: (pt: PriceType) => void
}

export function PriceTypePickerDialog({ open, onOpenChange, selectedId, onSelect }: PriceTypePickerDialogProps) {
  const { t } = useTranslation()
  const [priceTypes, setPriceTypes] = useState<PriceType[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
  const isFirstSearchRender = useRef(true)
  const [detailPriceType, setDetailPriceType] = useState<PriceType | null>(null)

  useEffect(() => {
    if (open) {
      setSearch("")
      setPage(0)
      isFirstSearchRender.current = true
      load(0, "")
    } else {
      setPriceTypes([])
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isFirstSearchRender.current) { isFirstSearchRender.current = false; return }
    if (!open) return
    setPage(0)
    const timer = setTimeout(() => load(0, search), 350)
    return () => clearTimeout(timer)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load(p: number, q: string) {
    setLoading(true)
    try {
      const res = await priceTypesService.list({
        page: p,
        size: PAGE_SIZE,
        sort_by: "sortOrder",
        code: q.trim() || undefined,
      })
      setPriceTypes(res.data)
      setPage(p)
      setTotalPages(res.total_pages)
      setTotalElements(res.total_elements)
      setHasNext(res.has_next)
      setHasPrevious(res.has_previous)
    } catch {
      // silent — caller handles errors in its own toast
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(pt: PriceType) {
    onSelect(pt)
    onOpenChange(false)
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogTitle className="sr-only">{t("resortRoomCategoryPrice.selectPriceType")}</DialogTitle>

        {/* Header */}
        <div className="flex flex-col gap-3 px-5 pt-4 pb-4 pr-12 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
              <Tag className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{t("resortRoomCategoryPrice.selectPriceType")}</p>
              {totalElements > 0 && (
                <p className="text-xs text-muted-foreground">{totalElements} {t("priceType.title").toLowerCase()}</p>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`${t("common.search")}…`}
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
          ) : priceTypes.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground border rounded-xl border-dashed">
              {t("resortRoomCategoryPrice.noPriceTypes")}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {priceTypes.map((pt) => {
                const isSelected = pt.id === selectedId
                const name = pt.locales[0]?.name ?? pt.code
                const description = pt.locales[0]?.description
                return (
                  <div
                    key={pt.id}
                    className={`relative text-left rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/30"
                        : "bg-card hover:border-amber-500/40"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelect(pt)}
                      className="w-full text-left p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-amber-500/20 text-amber-500" : "bg-muted text-muted-foreground"
                        }`}>
                          <Tag className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1 pr-7">
                          <p className="font-semibold text-sm leading-tight truncate">{name}</p>
                          <Badge
                            variant="outline"
                            className={`font-mono text-[10px] px-1.5 py-0 h-4 mt-1 ${
                              isSelected ? "border-amber-500/30 text-amber-600 dark:text-amber-400" : ""
                            }`}
                          >
                            {pt.code}
                          </Badge>
                          {description && (
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{description}</p>
                          )}
                        </div>
                      </div>
                    </button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 h-7 w-7 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                      onClick={(e) => { e.stopPropagation(); setDetailPriceType(pt) }}
                      title="View details"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
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
              onPageChange={(p) => load(p, search)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>

    <PriceTypeDetailDialog
      open={!!detailPriceType}
      onOpenChange={(o) => { if (!o) setDetailPriceType(null) }}
      priceType={detailPriceType}
    />
    </>
  )
}
