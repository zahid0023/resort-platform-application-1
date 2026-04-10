"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeftIcon, PencilIcon, PlusIcon, StarIcon, Trash2Icon } from "lucide-react"
import { UiBlockPreview } from "@/components/ui-blocks/ui-block-preview"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { TemplatePageSlotDialog } from "@/components/template-page-slots/template-page-slot-dialog"
import { TemplatePageSlotVariantDialog } from "@/components/template-page-slot-variants/template-page-slot-variant-dialog"
import { getTemplatePageSlot, type TemplatePageSlot } from "@/services/template-page-slots"
import {
  listTemplatePageSlotVariants,
  deleteTemplatePageSlotVariant,
  type TemplatePageSlotVariantSummary,
} from "@/services/template-page-slot-variants"
import { listUiBlockDefinitions, type UiBlockDefinitionSummary } from "@/services/ui-block-definitions"
import { listUiBlockCategories, type UiBlockCategory } from "@/services/ui-block-categories"

export default function TemplatePageSlotDetailPage() {
  const params = useParams<{ id: string; pageId: string; slotId: string }>()
  const templateId = Number(params.id)
  const pageId = Number(params.pageId)
  const slotId = Number(params.slotId)
  const router = useRouter()

  const [slot, setSlot] = useState<TemplatePageSlot | null>(null)
  const [variants, setVariants] = useState<TemplatePageSlotVariantSummary[]>([])
  const [definitions, setDefinitions] = useState<UiBlockDefinitionSummary[]>([])
  const [categories, setCategories] = useState<UiBlockCategory[]>([])
  const [loading, setLoading] = useState(true)

  const [editSlotDialogOpen, setEditSlotDialogOpen] = useState(false)
  const [addVariantDialogOpen, setAddVariantDialogOpen] = useState(false)
  const [editVariantDialogOpen, setEditVariantDialogOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<TemplatePageSlotVariantSummary | null>(null)
  const [deletingVariantId, setDeletingVariantId] = useState<number | null>(null)
  const [confirmingVariantId, setConfirmingVariantId] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [slotRes, variantsRes, definitionsRes, categoriesRes] = await Promise.all([
        getTemplatePageSlot(templateId, pageId, slotId),
        listTemplatePageSlotVariants(templateId, pageId, slotId, { size: 100, sort_by: "displayOrder", sort_dir: "ASC" }),
        listUiBlockDefinitions({ size: 100 }),
        listUiBlockCategories({ size: 100, sort_by: "name", sort_dir: "ASC" }),
      ])
      setSlot(slotRes.data)
      setVariants(variantsRes.data)
      setDefinitions(definitionsRes.data)
      setCategories(categoriesRes.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load slot details.")
    } finally {
      setLoading(false)
    }
  }, [templateId, pageId, slotId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const sortedVariants = variants.slice().sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
  const definitionMap = new Map(definitions.map((d) => [d.id, d]))
  const categoryMap = new Map(categories.map((c) => [c.id, c]))
  const usedDefinitionIds = sortedVariants.map((v) => v.ui_block_definition_id)

  const handleEditVariant = (variant: TemplatePageSlotVariantSummary) => {
    setEditingVariant(variant)
    setEditVariantDialogOpen(true)
  }

  const handleDeleteVariant = async (id: number) => {
    setDeletingVariantId(id)
    try {
      await deleteTemplatePageSlotVariant(templateId, pageId, slotId, id)
      toast.success("Variant deleted.")
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete variant.")
    } finally {
      setDeletingVariantId(null)
      setConfirmingVariantId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (!slot) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-sm text-muted-foreground">
        <p>Slot not found.</p>
        <Button variant="outline" onClick={() => router.push(`/templates/${templateId}/${pageId}`)}>
          Back to Page
        </Button>
      </div>
    )
  }

  const category = categoryMap.get(slot.ui_block_category_id)

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <button
        onClick={() => router.push(`/templates/${templateId}/${pageId}`)}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        Back to Page
      </button>

      {/* Slot header */}
      <div className="flex items-start justify-between gap-4 rounded-xl border bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{slot.slot_name}</h1>
            {slot.is_required && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Required
              </span>
            )}
          </div>
          {category && (
            <span className="text-xs text-muted-foreground">Category: {category.name}</span>
          )}
          <span className="text-xs text-muted-foreground">Order: {slot.slot_order}</span>
        </div>
        <Button size="sm" variant="outline" className="shrink-0" onClick={() => setEditSlotDialogOpen(true)}>
          <PencilIcon />
          Edit
        </Button>
      </div>

      {/* Variants section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">UI Block Variants</h2>
            <p className="text-sm text-muted-foreground">
              UI block definitions available for this slot.
            </p>
          </div>
          <Button size="sm" onClick={() => setAddVariantDialogOpen(true)}>
            <PlusIcon />
            Add Variant
          </Button>
        </div>

        {sortedVariants.length === 0 ? (
          <div className="flex justify-center rounded-xl border border-dashed py-14 text-sm text-muted-foreground">
            No variants yet. Add a UI block definition to this slot.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sortedVariants.map((variant) => {
              const definition = definitionMap.get(variant.ui_block_definition_id)
              const isDeleting = deletingVariantId === variant.id
              const isConfirming = confirmingVariantId === variant.id

              return (
                <div
                  key={variant.id}
                  className="group relative rounded-xl border bg-card ring-1 ring-foreground/10 overflow-hidden"
                >
                  {/* Preview */}
                  <UiBlockPreview uiBlockKey={definition?.ui_block_key ?? ""} />

                  {/* Top-left badges overlay */}
                  <div className="absolute left-2 top-2 flex items-center gap-1.5">
                    {variant.is_default && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground shadow">
                        <StarIcon className="size-2.5" />
                        Default
                      </span>
                    )}
                    <span className="rounded-full bg-black/50 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                      {definition ? definition.name : `#${variant.ui_block_definition_id}`}
                    </span>
                  </div>

                  {/* Top-right actions overlay */}
                  <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isConfirming ? (
                      <>
                        <span className="mr-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white backdrop-blur-sm">Sure?</span>
                        <Button size="icon-sm" variant="destructive" disabled={isDeleting} onClick={() => handleDeleteVariant(variant.id)}>
                          {isDeleting ? <Spinner className="size-3" /> : <Trash2Icon />}
                        </Button>
                        <Button size="icon-sm" variant="outline" onClick={() => setConfirmingVariantId(null)}>
                          ✕
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="icon-sm" variant="secondary" onClick={() => handleEditVariant(variant)}>
                          <PencilIcon />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="destructive"
                          onClick={() => setConfirmingVariantId(variant.id)}
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

      {/* Edit slot dialog */}
      <TemplatePageSlotDialog
        open={editSlotDialogOpen}
        onOpenChange={setEditSlotDialogOpen}
        templateId={templateId}
        pageId={pageId}
        editing={slot}
        onSuccess={fetchData}
      />

      {/* Add variant dialog */}
      <TemplatePageSlotVariantDialog
        open={addVariantDialogOpen}
        onOpenChange={setAddVariantDialogOpen}
        templateId={templateId}
        pageId={pageId}
        slotId={slotId}
        categoryId={slot.ui_block_category_id}
        usedDefinitionIds={usedDefinitionIds}
        editing={null}
        onSuccess={fetchData}
        defaultOrder={
          sortedVariants.length === 0
            ? 1
            : Math.max(...sortedVariants.map((v) => v.display_order)) + 1
        }
      />

      {/* Edit variant dialog */}
      <TemplatePageSlotVariantDialog
        open={editVariantDialogOpen}
        onOpenChange={setEditVariantDialogOpen}
        templateId={templateId}
        pageId={pageId}
        slotId={slotId}
        categoryId={slot.ui_block_category_id}
        usedDefinitionIds={usedDefinitionIds.filter(
          (id) => id !== editingVariant?.ui_block_definition_id
        )}
        editing={editingVariant}
        onSuccess={fetchData}
      />
    </div>
  )
}
