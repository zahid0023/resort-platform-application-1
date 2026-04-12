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
  createResortAccessType,
  updateResortAccessType,
  type ResortAccessType,
} from "@/services/resort-access-types"

interface ResortAccessTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: ResortAccessType | null
  onSuccess: () => void
}

const empty = { code: "", name: "", description: "" }

export function ResortAccessTypeDialog({ open, onOpenChange, editing, onSuccess }: ResortAccessTypeDialogProps) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setForm({
        code: editing.code,
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
      if (editing) {
        await updateResortAccessType(editing.id, {
          code: form.code,
          name: form.name,
          description: form.description,
        })
        toast.success("Access type updated successfully!")
      } else {
        await createResortAccessType({
          code: form.code,
          name: form.name,
          description: form.description,
        })
        toast.success("Access type created successfully!")
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
          <DialogTitle>{editing ? "Edit Access Type" : "Create Access Type"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the details of this resort access type."
              : "Add a new resort access type to the system."}
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
                placeholder="OWNER"
                maxLength={50}
                required
              />
              <FieldDescription>Short identifier code (e.g. OWNER, ADMIN, MANAGER, STAFF).</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Owner"
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
                placeholder="e.g. Full system control"
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
