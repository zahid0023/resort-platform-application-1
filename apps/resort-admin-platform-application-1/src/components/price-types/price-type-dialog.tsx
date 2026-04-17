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
import { createPriceType, updatePriceType, type PriceType } from "@/services/price-types"

interface PriceTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: PriceType | null
  onSuccess: () => void
}

const empty = { code: "", name: "", description: "" }

export function PriceTypeDialog({ open, onOpenChange, editing, onSuccess }: PriceTypeDialogProps) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setForm({ code: editing.code, name: editing.name, description: editing.description })
    } else {
      setForm(empty)
    }
  }, [editing, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editing) {
        await updatePriceType(editing.id, form)
        toast.success("Price type updated successfully!")
      } else {
        await createPriceType(form)
        toast.success("Price type created successfully!")
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
          <DialogTitle>{editing ? "Edit Price Type" : "Create Price Type"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update the details of this price type." : "Add a new price type to the system."}
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
                placeholder="HIGH_SEASON"
                maxLength={30}
                required
              />
              <FieldDescription>Short identifier code (e.g. HIGH_SEASON, LOW_SEASON).</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="High Season"
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
                placeholder="e.g. Peak season pricing applied from June to August."
                rows={3}
                required
                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              />
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
