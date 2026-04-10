"use client"

import { useEffect, useRef, useState } from "react"
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
import { createTemplatePage, updateTemplatePage } from "@/services/template-pages"
import { listPageTypes, type PageTypeSummary } from "@/services/page-types"

interface TemplatePageBase {
  id: number;
  page_type_id: number;
  page_name: string;
  page_slug: string;
  page_order: number;
}

interface TemplatePageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: number
  usedPageTypeIds: number[]
  editing: TemplatePageBase | null
  onSuccess: () => void
  defaultOrder?: number
}

const toSlug = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

const empty = { page_type_id: "", page_name: "", page_slug: "", page_order: "" }

export function TemplatePageDialog({
  open,
  onOpenChange,
  templateId,
  usedPageTypeIds,
  editing,
  onSuccess,
  defaultOrder,
}: TemplatePageDialogProps) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)
  const [pageTypes, setPageTypes] = useState<PageTypeSummary[]>([])
  const slugTouched = useRef(false)

  useEffect(() => {
    if (!open) return
    listPageTypes({ size: 100, sort_by: "name", sort_dir: "ASC" })
      .then((res) => setPageTypes(res.data))
      .catch(() => toast.error("Failed to load page types."))
  }, [open])

  useEffect(() => {
    if (!open) return
    if (editing) {
      slugTouched.current = true
      setForm({
        page_type_id: String(editing.page_type_id),
        page_name: editing.page_name,
        page_slug: editing.page_slug,
        page_order: editing.page_order != null ? String(editing.page_order) : "",
      })
    } else {
      slugTouched.current = false
      setForm({ ...empty, page_order: defaultOrder != null ? String(defaultOrder) : "" })
    }
  }, [editing, open, defaultOrder])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === "page_slug") {
      slugTouched.current = true
      setForm((prev) => ({ ...prev, page_slug: value }))
    } else if (name === "page_name") {
      setForm((prev) => ({
        ...prev,
        page_name: value,
        page_slug: slugTouched.current ? prev.page_slug : toSlug(value),
      }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        page_type_id: Number(form.page_type_id),
        page_name: form.page_name,
        page_slug: form.page_slug,
        page_order: Number(form.page_order),
      }
      if (editing) {
        await updateTemplatePage(templateId, editing.id, payload)
        toast.success("Page updated successfully!")
      } else {
        await createTemplatePage(templateId, payload)
        toast.success("Page created successfully!")
      }
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  // Filter out page types already used in this template (except the one being edited)
  const availablePageTypes = pageTypes.filter(
    (pt) => !usedPageTypeIds.includes(pt.id) || (editing && pt.id === editing.page_type_id)
  )

  const selectClass =
    "border-input focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Page" : "Add Page"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update this page's details." : "Add a new page to this template."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            {!editing && (
              <Field>
                <FieldLabel htmlFor="page_type_id">Page Type</FieldLabel>
                <select
                  id="page_type_id"
                  name="page_type_id"
                  value={form.page_type_id}
                  onChange={handleChange}
                  required
                  className={selectClass}
                >
                  <option value="">Select a page type…</option>
                  {availablePageTypes.map((pt) => (
                    <option key={pt.id} value={String(pt.id)}>
                      {pt.name}
                    </option>
                  ))}
                </select>
                <FieldDescription>Each page type can only be used once per template.</FieldDescription>
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="page_name">Page Name</FieldLabel>
              <Input
                id="page_name"
                name="page_name"
                value={form.page_name}
                onChange={handleChange}
                placeholder="Home"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="page_slug">Page Slug</FieldLabel>
              <Input
                id="page_slug"
                name="page_slug"
                value={form.page_slug}
                onChange={handleChange}
                placeholder="home"
                required
              />
              <FieldDescription>URL-safe slug (e.g. home, rooms, events).</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="page_order">Page Order</FieldLabel>
              <Input
                id="page_order"
                name="page_order"
                type="number"
                value={form.page_order}
                onChange={handleChange}
                placeholder="1"
                min={0}
                required
              />
              <FieldDescription>Display order within the template.</FieldDescription>
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
                : editing ? "Save Changes" : "Add Page"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
