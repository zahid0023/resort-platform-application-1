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
  createFacilityGroup,
  updateFacilityGroup,
  type FacilityGroup,
} from "@/services/facility-groups"

interface FacilityGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: FacilityGroup | null
  onSuccess: () => void
}

const empty = { code: "", name: "", description: "", sort_order: "" }

export function FacilityGroupDialog({ open, onOpenChange, editing, onSuccess }: FacilityGroupDialogProps) {
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
        ...(form.description && { description: form.description }),
        ...(form.sort_order !== "" && { sort_order: Number(form.sort_order) }),
      }
      if (editing) {
        await updateFacilityGroup(editing.id, payload)
        toast.success("Facility group updated successfully!")
      } else {
        await createFacilityGroup(payload)
        toast.success("Facility group created successfully!")
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
          <DialogTitle>{editing ? "Edit Facility Group" : "Create Facility Group"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the details of this facility group."
              : "Add a new facility group to the system."}
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
                placeholder="DINING"
                maxLength={50}
                required
              />
              <FieldDescription>Short identifier code (e.g. DINING, WELLNESS, RECREATION).</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Dining"
                maxLength={255}
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
                placeholder="e.g. All food and beverage outlets including restaurants, bars, and room service."
                rows={3}
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
