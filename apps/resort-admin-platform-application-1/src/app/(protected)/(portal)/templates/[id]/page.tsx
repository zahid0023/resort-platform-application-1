"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeftIcon, PencilIcon, PlusIcon, StarIcon,
  Trash2Icon, LayoutIcon, LayersIcon, BlocksIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { UiBlockPreview } from "@/components/ui-blocks/ui-block-preview"
import { TemplateDialog } from "@/components/templates/template-dialog"
import { TemplatePageDialog } from "@/components/template-pages/template-page-dialog"
import { TemplatePageSlotDialog } from "@/components/template-page-slots/template-page-slot-dialog"
import { TemplatePageSlotVariantDialog } from "@/components/template-page-slot-variants/template-page-slot-variant-dialog"
import { getTemplate, type Template } from "@/services/templates"
import {
  listTemplatePages, deleteTemplatePage, type TemplatePageSummary,
} from "@/services/template-pages"
import {
  listTemplatePageSlots, deleteTemplatePageSlot, type TemplatePageSlotSummary,
} from "@/services/template-page-slots"
import {
  listTemplatePageSlotVariants, deleteTemplatePageSlotVariant,
  type TemplatePageSlotVariantSummary,
} from "@/services/template-page-slot-variants"
import { listPageTypes, type PageTypeSummary } from "@/services/page-types"
import { listUiBlockCategories, type UiBlockCategory } from "@/services/ui-block-categories"
import { listUiBlockDefinitions, type UiBlockDefinitionSummary } from "@/services/ui-block-definitions"

// ─── Enriched types ────────────────────────────────────────────────────────────

interface SlotWithVariants extends TemplatePageSlotSummary {
  variants: TemplatePageSlotVariantSummary[]
}

interface PageWithSlots extends TemplatePageSummary {
  slots: SlotWithVariants[]
}

// ─── Dialog state shapes ────────────────────────────────────────────────────────

interface PageDialogState {
  open: boolean
  editing: TemplatePageSummary | null
  usedPageTypeIds: number[]
  defaultOrder?: number
}

interface SlotDialogState {
  open: boolean
  pageId: number | null
  editing: TemplatePageSlotSummary | null
  defaultOrder?: number
}

interface VariantDialogState {
  open: boolean
  pageId: number | null
  slotId: number | null
  categoryId: number | null
  usedDefinitionIds: number[]
  editing: TemplatePageSlotVariantSummary | null
  defaultOrder?: number
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TemplateBuilderPage() {
  const params = useParams<{ id: string }>()
  const templateId = Number(params.id)
  const router = useRouter()

  const [template, setTemplate] = useState<Template | null>(null)
  const [pagesData, setPagesData] = useState<PageWithSlots[]>([])
  const [pageTypes, setPageTypes] = useState<PageTypeSummary[]>([])
  const [categories, setCategories] = useState<UiBlockCategory[]>([])
  const [definitions, setDefinitions] = useState<UiBlockDefinitionSummary[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [pageDialog, setPageDialog] = useState<PageDialogState>({
    open: false, editing: null, usedPageTypeIds: [],
  })
  const [slotDialog, setSlotDialog] = useState<SlotDialogState>({
    open: false, pageId: null, editing: null,
  })
  const [variantDialog, setVariantDialog] = useState<VariantDialogState>({
    open: false, pageId: null, slotId: null, categoryId: null,
    usedDefinitionIds: [], editing: null,
  })

  // Inline delete confirmation state
  const [confirmingPageId, setConfirmingPageId] = useState<number | null>(null)
  const [confirmingSlotId, setConfirmingSlotId] = useState<number | null>(null)
  const [confirmingVariantId, setConfirmingVariantId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // ─── Data fetching ────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [templateRes, pagesRes, pageTypesRes, categoriesRes, definitionsRes] = await Promise.all([
        getTemplate(templateId),
        listTemplatePages(templateId, { size: 100, sort_by: "pageOrder", sort_dir: "ASC" }),
        listPageTypes({ size: 100, sort_by: "name", sort_dir: "ASC" }),
        listUiBlockCategories({ size: 100, sort_by: "name", sort_dir: "ASC" }),
        listUiBlockDefinitions({ size: 200 }),
      ])

      setTemplate(templateRes.data)
      setPageTypes(pageTypesRes.data)
      setCategories(categoriesRes.data)
      setDefinitions(definitionsRes.data)

      const pages = pagesRes.data.sort((a, b) => (a.page_order ?? 0) - (b.page_order ?? 0))

      const pagesWithSlots: PageWithSlots[] = await Promise.all(
        pages.map(async (page) => {
          const slotsRes = await listTemplatePageSlots(templateId, page.id, {
            size: 100, sort_by: "slotOrder", sort_dir: "ASC",
          })
          const slots = slotsRes.data.sort((a, b) => (a.slot_order ?? 0) - (b.slot_order ?? 0))

          const slotsWithVariants: SlotWithVariants[] = await Promise.all(
            slots.map(async (slot) => {
              const variantsRes = await listTemplatePageSlotVariants(templateId, page.id, slot.id, {
                size: 100, sort_by: "displayOrder", sort_dir: "ASC",
              })
              return { ...slot, variants: variantsRes.data.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)) }
            })
          )
          return { ...page, slots: slotsWithVariants }
        })
      )

      setPagesData(pagesWithSlots)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load template.")
    } finally {
      setLoading(false)
    }
  }, [templateId])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── Lookup maps ──────────────────────────────────────────────────────────────

  const pageTypeMap = new Map(pageTypes.map((pt) => [pt.id, pt]))
  const categoryMap = new Map(categories.map((c) => [c.id, c]))
  const definitionMap = new Map(definitions.map((d) => [d.id, d]))

  // ─── Delete handlers ──────────────────────────────────────────────────────────

  const handleDeletePage = async (pageId: number) => {
    setDeletingId(pageId)
    try {
      await deleteTemplatePage(templateId, pageId)
      toast.success("Page deleted.")
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete page.")
    } finally {
      setDeletingId(null)
      setConfirmingPageId(null)
    }
  }

  const handleDeleteSlot = async (pageId: number, slotId: number) => {
    setDeletingId(slotId)
    try {
      await deleteTemplatePageSlot(templateId, pageId, slotId)
      toast.success("Slot deleted.")
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete slot.")
    } finally {
      setDeletingId(null)
      setConfirmingSlotId(null)
    }
  }

  const handleDeleteVariant = async (pageId: number, slotId: number, variantId: number) => {
    setDeletingId(variantId)
    try {
      await deleteTemplatePageSlotVariant(templateId, pageId, slotId, variantId)
      toast.success("Variant deleted.")
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete variant.")
    } finally {
      setDeletingId(null)
      setConfirmingVariantId(null)
    }
  }

  // ─── Dialog openers ───────────────────────────────────────────────────────────

  const openAddPage = () => {
    const usedPageTypeIds = pagesData.map((p) => p.page_type_id)
    const defaultOrder = pagesData.length === 0 ? 1 : Math.max(...pagesData.map((p) => p.page_order)) + 1
    setPageDialog({ open: true, editing: null, usedPageTypeIds, defaultOrder })
  }

  const openEditPage = (page: TemplatePageSummary) => {
    const usedPageTypeIds = pagesData.filter((p) => p.id !== page.id).map((p) => p.page_type_id)
    setPageDialog({ open: true, editing: page, usedPageTypeIds })
  }

  const openAddSlot = (page: PageWithSlots) => {
    const defaultOrder = page.slots.length === 0 ? 1 : Math.max(...page.slots.map((s) => s.slot_order)) + 1
    setSlotDialog({ open: true, pageId: page.id, editing: null, defaultOrder })
  }

  const openEditSlot = (pageId: number, slot: TemplatePageSlotSummary) => {
    setSlotDialog({ open: true, pageId, editing: slot })
  }

  const openAddVariant = (page: PageWithSlots, slot: SlotWithVariants) => {
    const usedDefinitionIds = slot.variants.map((v) => v.ui_block_definition_id)
    const defaultOrder = slot.variants.length === 0 ? 1 : Math.max(...slot.variants.map((v) => v.display_order)) + 1
    setVariantDialog({
      open: true,
      pageId: page.id,
      slotId: slot.id,
      categoryId: slot.ui_block_category_id,
      usedDefinitionIds,
      editing: null,
      defaultOrder,
    })
  }

  const openEditVariant = (page: PageWithSlots, slot: SlotWithVariants, variant: TemplatePageSlotVariantSummary) => {
    const usedDefinitionIds = slot.variants
      .filter((v) => v.id !== variant.id)
      .map((v) => v.ui_block_definition_id)
    setVariantDialog({
      open: true,
      pageId: page.id,
      slotId: slot.id,
      categoryId: slot.ui_block_category_id,
      usedDefinitionIds,
      editing: variant,
    })
  }

  // ─── Loading / not found ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-sm text-muted-foreground">
        <p>Template not found.</p>
        <Button variant="outline" onClick={() => router.push("/templates")}>Back to Templates</Button>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* Back */}
      <button
        onClick={() => router.push("/templates")}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        Back to Templates
      </button>

      {/* Template header */}
      <div className="flex items-start justify-between gap-4 rounded-xl border bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{template.name}</h1>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              template.status === "published"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-muted text-muted-foreground"
            }`}>
              {template.status}
            </span>
          </div>
          <span className="font-mono text-xs text-muted-foreground">{template.key}</span>
          {template.description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{template.description}</p>
          )}
        </div>
        <Button size="sm" variant="outline" className="shrink-0" onClick={() => setTemplateDialogOpen(true)}>
          <PencilIcon /> Edit
        </Button>
      </div>

      {/* Pages */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Pages</h2>
            <p className="text-sm text-muted-foreground">Each page type can only be added once.</p>
          </div>
          <Button size="sm" onClick={openAddPage}>
            <PlusIcon /> Add Page
          </Button>
        </div>

        {pagesData.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-sm text-muted-foreground">
            <p>No pages yet. Add a page to get started.</p>
            <Button size="sm" variant="outline" onClick={openAddPage}>
              <PlusIcon /> Add Page
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {pagesData.map((page) => {
              const pageType = pageTypeMap.get(page.page_type_id)
              const isConfirmingPage = confirmingPageId === page.id
              const isDeletingPage = deletingId === page.id

              return (
                <div key={page.id} className="rounded-xl border bg-card ring-1 ring-foreground/10 overflow-hidden">

                  {/* Page header */}
                  <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <LayoutIcon className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{page.page_name}</span>
                          {pageType && (
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {pageType.name}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">/{page.page_slug}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {isConfirmingPage ? (
                        <>
                          <span className="mr-1 text-xs text-muted-foreground">Sure?</span>
                          <Button size="icon-sm" variant="destructive" disabled={isDeletingPage} onClick={() => handleDeletePage(page.id)}>
                            {isDeletingPage ? <Spinner className="size-3" /> : <Trash2Icon />}
                          </Button>
                          <Button size="icon-sm" variant="outline" onClick={() => setConfirmingPageId(null)}>✕</Button>
                        </>
                      ) : (
                        <>
                          <Button size="icon-sm" variant="ghost" onClick={() => openEditPage(page)}>
                            <PencilIcon />
                          </Button>
                          <Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmingPageId(page.id)}>
                            <Trash2Icon />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Slots */}
                  <div className="flex flex-col gap-0 divide-y">
                    {page.slots.length === 0 ? (
                      <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
                        <p>No slots yet.</p>
                        <Button size="sm" variant="outline" onClick={() => openAddSlot(page)}>
                          <PlusIcon /> Add Slot
                        </Button>
                      </div>
                    ) : (
                      page.slots.map((slot) => {
                        const category = categoryMap.get(slot.ui_block_category_id)
                        const isConfirmingSlot = confirmingSlotId === slot.id
                        const isDeletingSlot = deletingId === slot.id

                        return (
                          <div key={slot.id} className="flex flex-col gap-3 p-4">

                            {/* Slot header */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <LayersIcon className="size-3.5 shrink-0 text-muted-foreground" />
                                <span className="text-sm font-medium">{slot.slot_name}</span>
                                {slot.is_required && (
                                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    Required
                                  </span>
                                )}
                                {category && (
                                  <span className="text-xs text-muted-foreground">{category.name}</span>
                                )}
                              </div>
                              <div className="flex shrink-0 items-center gap-1">
                                {isConfirmingSlot ? (
                                  <>
                                    <span className="mr-1 text-xs text-muted-foreground">Sure?</span>
                                    <Button size="icon-sm" variant="destructive" disabled={isDeletingSlot} onClick={() => handleDeleteSlot(page.id, slot.id)}>
                                      {isDeletingSlot ? <Spinner className="size-3" /> : <Trash2Icon />}
                                    </Button>
                                    <Button size="icon-sm" variant="outline" onClick={() => setConfirmingSlotId(null)}>✕</Button>
                                  </>
                                ) : (
                                  <>
                                    <Button size="icon-sm" variant="ghost" onClick={() => openEditSlot(page.id, slot)}>
                                      <PencilIcon />
                                    </Button>
                                    <Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmingSlotId(slot.id)}>
                                      <Trash2Icon />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Variant previews */}
                            {slot.variants.length === 0 ? (
                              <button
                                onClick={() => openAddVariant(page, slot)}
                                className="flex items-center justify-center gap-2 rounded-xl border border-dashed py-6 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                              >
                                <BlocksIcon className="size-4" />
                                Add a UI block variant
                              </button>
                            ) : (
                              <div className="overflow-x-auto">
                                <div className="flex gap-3 pb-1" style={{ minWidth: "max-content" }}>
                                  {slot.variants.map((variant) => {
                                    const def = definitionMap.get(variant.ui_block_definition_id)
                                    const isConfirmingVariant = confirmingVariantId === variant.id
                                    const isDeletingVariant = deletingId === variant.id

                                    return (
                                      <div
                                        key={variant.id}
                                        className="group relative w-72 shrink-0 rounded-xl border bg-background ring-1 ring-foreground/10 overflow-hidden"
                                      >
                                        <UiBlockPreview uiBlockKey={def?.ui_block_key ?? ""} />

                                        {/* Bottom-left info */}
                                        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 bg-gradient-to-t from-black/60 to-transparent px-2 pb-2 pt-6">
                                          {variant.is_default && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                                              <StarIcon className="size-2" />
                                              Default
                                            </span>
                                          )}
                                          <span className="truncate text-xs text-white font-medium">
                                            {def ? def.name : `#${variant.ui_block_definition_id}`}
                                          </span>
                                        </div>

                                        {/* Top-right actions */}
                                        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          {isConfirmingVariant ? (
                                            <>
                                              <span className="rounded bg-black/60 px-1.5 py-0.5 text-xs text-white backdrop-blur-sm">Sure?</span>
                                              <Button size="icon-sm" variant="destructive" disabled={isDeletingVariant} onClick={() => handleDeleteVariant(page.id, slot.id, variant.id)}>
                                                {isDeletingVariant ? <Spinner className="size-3" /> : <Trash2Icon />}
                                              </Button>
                                              <Button size="icon-sm" variant="secondary" onClick={() => setConfirmingVariantId(null)}>✕</Button>
                                            </>
                                          ) : (
                                            <>
                                              <Button size="icon-sm" variant="secondary" onClick={() => openEditVariant(page, slot, variant)}>
                                                <PencilIcon />
                                              </Button>
                                              <Button size="icon-sm" variant="destructive" onClick={() => setConfirmingVariantId(variant.id)}>
                                                <Trash2Icon />
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}

                                  {/* Add variant card */}
                                  <button
                                    onClick={() => openAddVariant(page, slot)}
                                    className="flex w-36 shrink-0 items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                                  >
                                    <PlusIcon className="size-4" />
                                    Add
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Add slot footer */}
                  <div className="border-t px-4 py-2.5">
                    <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => openAddSlot(page)}>
                      <PlusIcon /> Add Slot
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── Dialogs ─────────────────────────────────────────────────────────── */}

      <TemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        editing={template}
        onSuccess={fetchData}
      />

      <TemplatePageDialog
        open={pageDialog.open}
        onOpenChange={(open) => setPageDialog((s) => ({ ...s, open }))}
        templateId={templateId}
        usedPageTypeIds={pageDialog.usedPageTypeIds}
        editing={pageDialog.editing}
        onSuccess={fetchData}
        defaultOrder={pageDialog.defaultOrder}
      />

      {slotDialog.pageId !== null && (
        <TemplatePageSlotDialog
          open={slotDialog.open}
          onOpenChange={(open) => setSlotDialog((s) => ({ ...s, open }))}
          templateId={templateId}
          pageId={slotDialog.pageId}
          editing={slotDialog.editing}
          onSuccess={fetchData}
          defaultOrder={slotDialog.defaultOrder}
        />
      )}

      {variantDialog.pageId !== null &&
       variantDialog.slotId !== null &&
       variantDialog.categoryId !== null && (
        <TemplatePageSlotVariantDialog
          open={variantDialog.open}
          onOpenChange={(open) => setVariantDialog((s) => ({ ...s, open }))}
          templateId={templateId}
          pageId={variantDialog.pageId}
          slotId={variantDialog.slotId}
          categoryId={variantDialog.categoryId}
          usedDefinitionIds={variantDialog.usedDefinitionIds}
          editing={variantDialog.editing}
          onSuccess={fetchData}
          defaultOrder={variantDialog.defaultOrder}
        />
      )}
    </div>
  )
}
