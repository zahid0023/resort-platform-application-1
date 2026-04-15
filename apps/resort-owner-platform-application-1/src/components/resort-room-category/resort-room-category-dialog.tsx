"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import {
  createResortRoomCategory,
  updateResortRoomCategory,
  type ResortRoomCategorySummary,
} from "@/services/resort-room-categories"
import { listRoomCategories, type RoomCategorySummary } from "@/services/room-categories"

const empty = {
  room_category_id: "",
  name: "",
  description: "",
  sort_order: "",
}

export function ResortRoomCategoryDialog({
  resortId,
  open,
  onOpenChange,
  editing,
  onSuccess,
  assignedCategoryIds = [],
}: {
  resortId: string
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: ResortRoomCategorySummary | null
  onSuccess: () => void
  assignedCategoryIds?: number[]
}) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)
  const [roomCategories, setRoomCategories] = useState<RoomCategorySummary[]>([])

  useEffect(() => {
    listRoomCategories({ size: 100 })
      .then((res) => setRoomCategories(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setForm(
      editing
        ? {
            room_category_id: String(editing.room_category_id),
            name: editing.name ?? "",
            description: editing.description ?? "",
            sort_order: editing.sort_order != null ? String(editing.sort_order) : "",
          }
        : empty
    )
  }, [editing, open])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    if (name === "room_category_id") {
      const cat = roomCategories.find((c) => String(c.id) === value)
      setForm((prev) => ({
        ...prev,
        room_category_id: value,
        name: cat?.name ?? prev.name,
        description: cat?.description ?? prev.description,
        sort_order: cat ? String(cat.sort_order) : prev.sort_order,
      }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editing) {
        await updateResortRoomCategory(resortId, editing.id, {
          name: form.name || undefined,
          description: form.description || undefined,
          sort_order: form.sort_order ? Number(form.sort_order) : undefined,
        })
      } else {
        await createResortRoomCategory(resortId, {
          room_category_id: Number(form.room_category_id),
          name: form.name || undefined,
          description: form.description || undefined,
          sort_order: form.sort_order ? Number(form.sort_order) : undefined,
        })
      }
      toast.success(`Room category ${editing ? "updated" : "created"} successfully!`)
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
          <DialogTitle>{editing ? "Edit Room Category" : "Add Room Category"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update room category details." : "Link a room category to this resort."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            {!editing && (
              <Field>
                <FieldLabel htmlFor="room_category_id">Room Category *</FieldLabel>
                <select
                  id="room_category_id"
                  name="room_category_id"
                  value={form.room_category_id}
                  onChange={handleChange}
                  required
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a room category</option>
                  {roomCategories
                    .filter((c) => !assignedCategoryIds.includes(c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="name">Display Name</FieldLabel>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Deluxe Ocean View"
                maxLength={255}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Spacious rooms with direct ocean view."
                rows={3}
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="sort_order">Sort Order</FieldLabel>
              <Input
                id="sort_order"
                name="sort_order"
                type="number"
                min={0}
                value={form.sort_order}
                onChange={handleChange}
                placeholder="1"
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading
                ? editing ? "Saving..." : "Creating..."
                : editing ? "Save Changes" : "Add Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
