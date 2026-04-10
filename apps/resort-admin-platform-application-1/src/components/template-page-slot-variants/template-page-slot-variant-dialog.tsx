"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  createTemplatePageSlotVariant,
  updateTemplatePageSlotVariant,
} from "@/services/template-page-slot-variants"
import { listUiBlockDefinitions, type UiBlockDefinitionSummary } from "@/services/ui-block-definitions"
import { UiBlockPreview } from "@/components/ui-blocks/ui-block-preview"

interface TemplatePageSlotVariantBase {
  id: number;
  ui_block_definition_id: number;
  display_order: number;
  is_default: boolean;
}

interface TemplatePageSlotVariantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: number
  pageId: number
  slotId: number
  categoryId: number
  usedDefinitionIds: number[]
  editing: TemplatePageSlotVariantBase | null
  onSuccess: () => void
  defaultOrder?: number
}

const empty = { ui_block_definition_id: "", display_order: "", is_default: false }

export function TemplatePageSlotVariantDialog({
  open,
  onOpenChange,
  templateId,
  pageId,
  slotId,
  categoryId,
  usedDefinitionIds,
  editing,
  onSuccess,
  defaultOrder,
}: TemplatePageSlotVariantDialogProps) {
  const [form, setForm] = useState<{ ui_block_definition_id: string; display_order: string; is_default: boolean }>(empty)
  const [loading, setLoading] = useState(false)
  const [definitions, setDefinitions] = useState<UiBlockDefinitionSummary[]>([])

  useEffect(() => {
    if (!open) return
    listUiBlockDefinitions({ size: 100 })
      .then((res) => setDefinitions(res.data))
      .catch(() => toast.error("Failed to load UI block definitions."))
  }, [open])

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        ui_block_definition_id: String(editing.ui_block_definition_id),
        display_order: String(editing.display_order),
        is_default: editing.is_default,
      })
    } else {
      setForm({ ...empty, display_order: defaultOrder != null ? String(defaultOrder) : "" })
    }
  }, [editing, open, defaultOrder])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: e.target.checked }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing && !form.ui_block_definition_id) {
      toast.error("Please select a UI block definition.")
      return
    }
    setLoading(true)
    try {
      const payload = {
        ui_block_definition_id: Number(form.ui_block_definition_id),
        display_order: Number(form.display_order),
        is_default: form.is_default,
      }
      if (editing) {
        await updateTemplatePageSlotVariant(templateId, pageId, slotId, editing.id, payload)
        toast.success("Variant updated successfully!")
      } else {
        await createTemplatePageSlotVariant(templateId, pageId, slotId, payload)
        toast.success("Variant added successfully!")
      }
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  // Filter to this slot's category; exclude already-used definitions (except the one being edited)
  const availableDefinitions = definitions.filter(
    (d) =>
      d.ui_block_category_id === categoryId &&
      (!usedDefinitionIds.includes(d.id) || (editing && d.id === editing.ui_block_definition_id))
  )

  const selectedId = form.ui_block_definition_id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Variant" : "Add Variant"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update this variant's details."
              : "Select a UI block definition to add as an option for this slot."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            {/* Preview card grid — add mode only */}
            {!editing && (
              <Field>
                <FieldLabel>UI Block Definition</FieldLabel>
                {availableDefinitions.length === 0 ? (
                  <div className="flex justify-center rounded-xl border border-dashed py-8 text-sm text-muted-foreground">
                    No available definitions for this slot's category.
                  </div>
                ) : (
                  <div className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
                    {availableDefinitions.map((d) => {
                      const isSelected = selectedId === String(d.id)
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, ui_block_definition_id: String(d.id) }))}
                          className={`relative flex flex-col gap-0 rounded-xl border text-left text-sm transition-colors overflow-hidden ${
                            isSelected
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-border bg-card hover:bg-muted/40"
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute right-2 top-2 z-10 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <CheckIcon className="size-2.5" />
                            </span>
                          )}
                          {/* Rendered preview */}
                          <UiBlockPreview uiBlockKey={d.ui_block_key} />
                          {/* Metadata */}
                          <div className="flex flex-col gap-0.5 border-t p-2">
                            <span className="truncate font-medium text-xs">{d.name}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">{d.ui_block_key}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
                <FieldDescription>Only definitions matching this slot's category are shown.</FieldDescription>
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="display_order">Display Order</FieldLabel>
              <Input
                id="display_order"
                name="display_order"
                type="number"
                value={form.display_order}
                onChange={handleChange}
                placeholder="1"
                min={0}
                required
              />
              <FieldDescription>Order in which this variant appears as an option.</FieldDescription>
            </Field>

            <Field>
              <div className="flex items-center gap-2">
                <input
                  id="is_default"
                  name="is_default"
                  type="checkbox"
                  checked={form.is_default}
                  onChange={handleChange}
                  className="size-4 rounded border-input accent-primary"
                />
                <FieldLabel htmlFor="is_default" className="mb-0">Default</FieldLabel>
              </div>
              <FieldDescription>Mark this as the default selection for the slot.</FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading || (!editing && !selectedId)}>
              {loading
                ? editing ? "Saving..." : "Adding..."
                : editing ? "Save Changes" : "Add Variant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
