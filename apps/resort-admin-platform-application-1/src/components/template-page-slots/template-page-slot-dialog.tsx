"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
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
import { createTemplatePageSlot, updateTemplatePageSlot } from "@/services/template-page-slots"
import { listUiBlockCategories, type UiBlockCategory } from "@/services/ui-block-categories"

interface TemplatePageSlotBase {
  id: number;
  ui_block_category_id: number;
  slot_name: string;
  is_required: boolean;
  slot_order: number;
}

interface TemplatePageSlotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: number
  pageId: number
  editing: TemplatePageSlotBase | null
  onSuccess: () => void
  defaultOrder?: number
}

const empty = { ui_block_category_id: "", slot_name: "", is_required: false, slot_order: "" }

export function TemplatePageSlotDialog({
  open,
  onOpenChange,
  templateId,
  pageId,
  editing,
  onSuccess,
  defaultOrder,
}: TemplatePageSlotDialogProps) {
  const [form, setForm] = useState<{ ui_block_category_id: string; slot_name: string; is_required: boolean; slot_order: string }>(empty)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<UiBlockCategory[]>([])

  useEffect(() => {
    if (!open) return
    listUiBlockCategories({ size: 100, sort_by: "name", sort_dir: "ASC" })
      .then((res) => setCategories(res.data))
      .catch(() => toast.error("Failed to load UI block categories."))
  }, [open])

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        ui_block_category_id: String(editing.ui_block_category_id),
        slot_name: editing.slot_name,
        is_required: editing.is_required,
        slot_order: String(editing.slot_order),
      })
    } else {
      setForm({ ...empty, slot_order: defaultOrder != null ? String(defaultOrder) : "" })
    }
  }, [editing, open, defaultOrder])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ui_block_category_id: Number(form.ui_block_category_id),
        slot_name: form.slot_name,
        is_required: form.is_required,
        slot_order: Number(form.slot_order),
      }
      if (editing) {
        await updateTemplatePageSlot(templateId, pageId, editing.id, payload)
        toast.success("Slot updated successfully!")
      } else {
        await createTemplatePageSlot(templateId, pageId, payload)
        toast.success("Slot created successfully!")
      }
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const selectClass =
    "border-input focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Slot" : "Add Slot"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update this slot's details." : "Add a new content slot to this page."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="ui_block_category_id">UI Block Category</FieldLabel>
              <select
                id="ui_block_category_id"
                name="ui_block_category_id"
                value={form.ui_block_category_id}
                onChange={handleChange}
                required
                className={selectClass}
              >
                <option value="">Select a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
              <FieldDescription>The type of UI block allowed in this slot.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="slot_name">Slot Name</FieldLabel>
              <Input
                id="slot_name"
                name="slot_name"
                value={form.slot_name}
                onChange={handleChange}
                placeholder="Hero Banner"
                maxLength={150}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="slot_order">Slot Order</FieldLabel>
              <Input
                id="slot_order"
                name="slot_order"
                type="number"
                value={form.slot_order}
                onChange={handleChange}
                placeholder="1"
                min={0}
                required
              />
              <FieldDescription>Display order within the page.</FieldDescription>
            </Field>

            <Field>
              <div className="flex items-center gap-2">
                <input
                  id="is_required"
                  name="is_required"
                  type="checkbox"
                  checked={form.is_required}
                  onChange={handleChange}
                  className="size-4 rounded border-input accent-primary"
                />
                <FieldLabel htmlFor="is_required" className="mb-0">Required</FieldLabel>
              </div>
              <FieldDescription>Whether this slot must be filled before publishing.</FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading
                ? editing ? "Saving..." : "Adding..."
                : editing ? "Save Changes" : "Add Slot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
