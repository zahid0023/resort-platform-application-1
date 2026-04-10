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
  createTemplate,
  updateTemplate,
  type Template,
} from "@/services/templates"

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Template | null
  onSuccess: () => void
}

const empty = { key: "", name: "", description: "", status: "draft" }

export function TemplateDialog({ open, onOpenChange, editing, onSuccess }: TemplateDialogProps) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setForm({
        key: editing.key,
        name: editing.name,
        description: editing.description ?? "",
        status: editing.status,
      })
    } else {
      setForm(empty)
    }
  }, [editing, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        key: form.key,
        name: form.name,
        status: form.status,
        ...(form.description ? { description: form.description } : {}),
      }
      if (editing) {
        await updateTemplate(editing.id, payload)
        toast.success("Template updated successfully!")
      } else {
        await createTemplate(payload)
        toast.success("Template created successfully!")
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
          <DialogTitle>{editing ? "Edit Template" : "Create Template"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the details of this template."
              : "Add a new template to the system."}
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
                placeholder="RESORT_MAIN"
                maxLength={100}
                required
              />
              <FieldDescription>Unique identifier key (e.g. RESORT_MAIN).</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Resort Main Template"
                maxLength={150}
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
              <FieldDescription>Optional description for this template.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="status">Status</FieldLabel>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
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
