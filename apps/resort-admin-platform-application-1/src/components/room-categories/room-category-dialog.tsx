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
  createRoomCategory,
  updateRoomCategory,
  type RoomCategory,
} from "@/services/room-categories"

interface RoomCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: RoomCategory | null
  onSuccess: () => void
}

const empty = { code: "", name: "", description: "", sort_order: "" }

export function RoomCategoryDialog({ open, onOpenChange, editing, onSuccess }: RoomCategoryDialogProps) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setForm({
        code: editing.code,
        name: editing.name,
        description: editing.description ?? "",
        sort_order: String(editing.sort_order ?? ""),
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
        code: form.code,
        name: form.name,
        description: form.description,
        ...(form.sort_order !== "" && { sort_order: Number(form.sort_order) }),
      }
      if (editing) {
        await updateRoomCategory(editing.id, payload)
        toast.success("Room category updated successfully!")
      } else {
        await createRoomCategory(payload)
        toast.success("Room category created successfully!")
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
          <DialogTitle>{editing ? "Edit Room Category" : "Create Room Category"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the details of this room category."
              : "Add a new room category to the system."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="code">Code</FieldLabel>
              <Input
                id="code"
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="DELUXE"
                maxLength={50}
                required
              />
              <FieldDescription>Short identifier code (e.g. STANDARD, DELUXE, SUITE).</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Deluxe Room"
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
                placeholder="e.g. Spacious room with ocean view and premium amenities."
                rows={3}
                required
                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="sort_order">Sort Order</FieldLabel>
              <Input
                id="sort_order"
                name="sort_order"
                type="number"
                value={form.sort_order}
                onChange={handleChange}
                placeholder="0"
                min={0}
              />
              <FieldDescription>Display order. Lower numbers appear first.</FieldDescription>
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
