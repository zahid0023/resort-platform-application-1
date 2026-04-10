"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeftIcon, LayoutIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { TemplatePageDialog } from "@/components/template-pages/template-page-dialog"
import { TemplatePageSlotDialog } from "@/components/template-page-slots/template-page-slot-dialog"
import { getTemplatePage, type TemplatePage } from "@/services/template-pages"
import {
  listTemplatePageSlots,
  deleteTemplatePageSlot,
  type TemplatePageSlotSummary,
} from "@/services/template-page-slots"
import { listPageTypes, type PageTypeSummary } from "@/services/page-types"
import { listUiBlockCategories, type UiBlockCategory } from "@/services/ui-block-categories"

export default function TemplatePageDetailPage() {
  const params = useParams<{ id: string; pageId: string }>()
  const templateId = Number(params.id)
  const pageId = Number(params.pageId)
  const router = useRouter()

  const [page, setPage] = useState<TemplatePage | null>(null)
  const [slots, setSlots] = useState<TemplatePageSlotSummary[]>([])
  const [pageTypes, setPageTypes] = useState<PageTypeSummary[]>([])
  const [categories, setCategories] = useState<UiBlockCategory[]>([])
  const [loading, setLoading] = useState(true)

  const [editPageDialogOpen, setEditPageDialogOpen] = useState(false)
  const [addSlotDialogOpen, setAddSlotDialogOpen] = useState(false)
  const [editSlotDialogOpen, setEditSlotDialogOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<TemplatePageSlotSummary | null>(null)
  const [deletingSlotId, setDeletingSlotId] = useState<number | null>(null)
  const [confirmingSlotId, setConfirmingSlotId] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [pageRes, slotsRes, pageTypesRes, categoriesRes] = await Promise.all([
        getTemplatePage(templateId, pageId),
        listTemplatePageSlots(templateId, pageId, { size: 100, sort_by: "slotOrder", sort_dir: "ASC" }),
        listPageTypes({ size: 100, sort_by: "name", sort_dir: "ASC" }),
        listUiBlockCategories({ size: 100, sort_by: "name", sort_dir: "ASC" }),
      ])
      setPage(pageRes.data)
      setSlots(slotsRes.data)
      setPageTypes(pageTypesRes.data)
      setCategories(categoriesRes.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load page details.")
    } finally {
      setLoading(false)
    }
  }, [templateId, pageId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const sortedSlots = slots.slice().sort((a, b) => (a.slot_order ?? 0) - (b.slot_order ?? 0))
  const pageTypeMap = new Map(pageTypes.map((pt) => [pt.id, pt]))
  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  const handleEditSlot = (slot: TemplatePageSlotSummary) => {
    setEditingSlot(slot)
    setEditSlotDialogOpen(true)
  }

  const handleDeleteSlot = async (id: number) => {
    setDeletingSlotId(id)
    try {
      await deleteTemplatePageSlot(templateId, pageId, id)
      toast.success("Slot deleted.")
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete slot.")
    } finally {
      setDeletingSlotId(null)
      setConfirmingSlotId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (!page) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-sm text-muted-foreground">
        <p>Page not found.</p>
        <Button variant="outline" onClick={() => router.push(`/templates/${templateId}`)}>
          Back to Template
        </Button>
      </div>
    )
  }

  const pageType = pageTypeMap.get(page.page_type_id)

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <button
        onClick={() => router.push(`/templates/${templateId}`)}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        Back to Template
      </button>

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 rounded-xl border bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{page.page_name}</h1>
            {pageType && (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {pageType.name}
              </span>
            )}
          </div>
          <span className="font-mono text-xs text-muted-foreground">/{page.page_slug}</span>
          <span className="text-xs text-muted-foreground">Order: {page.page_order}</span>
        </div>
        <Button size="sm" variant="outline" className="shrink-0" onClick={() => setEditPageDialogOpen(true)}>
          <PencilIcon />
          Edit
        </Button>
      </div>

      {/* Slots section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Slots</h2>
            <p className="text-sm text-muted-foreground">Content areas available on this page.</p>
          </div>
          <Button size="sm" onClick={() => setAddSlotDialogOpen(true)}>
            <PlusIcon />
            Add Slot
          </Button>
        </div>

        {sortedSlots.length === 0 ? (
          <div className="flex justify-center rounded-xl border border-dashed py-14 text-sm text-muted-foreground">
            No slots yet. Add a slot to define content areas for this page.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sortedSlots.map((slot) => {
              const category = categoryMap.get(slot.ui_block_category_id)
              const isDeleting = deletingSlotId === slot.id
              const isConfirming = confirmingSlotId === slot.id

              return (
                <div
                  key={slot.id}
                  className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm ring-1 ring-foreground/10 cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => router.push(`/templates/${templateId}/${pageId}/${slot.id}`)}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <LayoutIcon className="size-4" />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{slot.slot_name}</span>
                      {slot.is_required && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          Required
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {category ? category.name : `Category #${slot.ui_block_category_id}`}
                      {" · "}Order {slot.slot_order}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {isConfirming ? (
                      <>
                        <span className="mr-1 text-xs text-muted-foreground">Sure?</span>
                        <Button size="icon-sm" variant="destructive" disabled={isDeleting} onClick={() => handleDeleteSlot(slot.id)}>
                          {isDeleting ? <Spinner className="size-3" /> : <Trash2Icon />}
                        </Button>
                        <Button size="icon-sm" variant="outline" onClick={() => setConfirmingSlotId(null)}>
                          ✕
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="icon-sm" variant="ghost" onClick={() => handleEditSlot(slot)}>
                          <PencilIcon />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setConfirmingSlotId(slot.id)}
                        >
                          <Trash2Icon />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit page dialog */}
      <TemplatePageDialog
        open={editPageDialogOpen}
        onOpenChange={setEditPageDialogOpen}
        templateId={templateId}
        usedPageTypeIds={[]}
        editing={page}
        onSuccess={fetchData}
      />

      {/* Add slot dialog */}
      <TemplatePageSlotDialog
        open={addSlotDialogOpen}
        onOpenChange={setAddSlotDialogOpen}
        templateId={templateId}
        pageId={pageId}
        editing={null}
        onSuccess={fetchData}
        defaultOrder={
          sortedSlots.length === 0
            ? 1
            : Math.max(...sortedSlots.map((s) => s.slot_order)) + 1
        }
      />

      {/* Edit slot dialog */}
      <TemplatePageSlotDialog
        open={editSlotDialogOpen}
        onOpenChange={setEditSlotDialogOpen}
        templateId={templateId}
        pageId={pageId}
        editing={editingSlot}
        onSuccess={fetchData}
      />
    </div>
  )
}
