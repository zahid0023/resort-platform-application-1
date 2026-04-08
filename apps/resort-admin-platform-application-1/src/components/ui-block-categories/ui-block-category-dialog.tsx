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
import {
  createUiBlockCategory,
  updateUiBlockCategory,
  type UiBlockCategory,
} from "@/services/ui-block-categories"

interface UiBlockCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: UiBlockCategory | null
  onSuccess: () => void
}

const empty = { key: "", name: "", description: "" }

export function UiBlockCategoryDialog({ open, onOpenChange, editing, onSuccess }: UiBlockCategoryDialogProps) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setForm({
        key: editing.key,
        name: editing.name,
        description: editing.description ?? "",
      })
    } else {
      setForm(empty)
    }
  }, [editing, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        key: form.key,
        name: form.name,
        ...(form.description ? { description: form.description } : {}),
      }
      if (editing) {
        await updateUiBlockCategory(editing.id, payload)
        toast.success("UI block category updated successfully!")
      } else {
        await createUiBlockCategory(payload)
        toast.success("UI block category created successfully!")
      }
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit UI Block Category" : "Create UI Block Category"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the details of this UI block category."
              : "Add a new UI block category to the system."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="key">Key</FieldLabel>
              <Input
                id="key"
                name="key"
                value={form.key}
                onChange={handleChange}
                placeholder="HERO"
                maxLength={100}
                required
              />
              <FieldDescription>Unique identifier key (e.g. HERO, GALLERY).</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Hero Block"
                maxLength={100}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Optional description..."
                rows={3}
                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              />
              <FieldDescription>Optional description for this category.</FieldDescription>
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
                ? editing ? "Saving..." : "Creating..."
                : editing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
