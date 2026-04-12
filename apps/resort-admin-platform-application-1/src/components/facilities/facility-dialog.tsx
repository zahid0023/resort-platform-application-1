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
import { createFacility, updateFacility, type Facility } from "@/services/facilities"
import { listFacilityGroups, type FacilityGroupSummary } from "@/services/facility-groups"

interface FacilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Facility | null
  onSuccess: () => void
}

const empty = { facility_group_id: "", code: "", name: "", description: "", type: "", icon: "" }

export function FacilityDialog({ open, onOpenChange, editing, onSuccess }: FacilityDialogProps) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<FacilityGroupSummary[]>([])

  useEffect(() => {
    listFacilityGroups({ size: 50, sort_by: "name", sort_dir: "ASC" })
      .then((res) => setGroups(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (editing) {
      setForm({
        facility_group_id: String(editing.facility_group_id),
        code: editing.code,
        name: editing.name,
        description: editing.description ?? "",
        type: editing.type,
        icon: editing.icon ?? "",
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
        facility_group_id: Number(form.facility_group_id),
        code: form.code,
        name: form.name,
        type: form.type,
        ...(form.description && { description: form.description }),
        ...(form.icon && { icon: form.icon }),
      }
      if (editing) {
        await updateFacility(editing.id, payload)
        toast.success("Facility updated successfully!")
      } else {
        await createFacility(payload)
        toast.success("Facility created successfully!")
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
          <DialogTitle>{editing ? "Edit Facility" : "Create Facility"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the details of this facility."
              : "Add a new facility to the system."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="facility_group_id">Facility Group</FieldLabel>
              <select
                id="facility_group_id"
                name="facility_group_id"
                value={form.facility_group_id}
                onChange={handleChange}
                required
                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a group…</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </Field>

            <Field>
              <FieldLabel htmlFor="code">Code</FieldLabel>
              <Input
                id="code"
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="POOL_OUTDOOR"
                maxLength={50}
                required
              />
              <FieldDescription>Short identifier code (e.g. POOL_OUTDOOR, GYM, SPA).</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Outdoor Pool"
                maxLength={255}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="type">Type</FieldLabel>
              <Input
                id="type"
                name="type"
                value={form.type}
                onChange={handleChange}
                placeholder="OUTDOOR"
                maxLength={30}
                required
              />
              <FieldDescription>Category type (e.g. INDOOR, OUTDOOR).</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="e.g. A large outdoor swimming pool with sun loungers."
                rows={3}
                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="icon">Icon</FieldLabel>
              <Input
                id="icon"
                name="icon"
                value={form.icon}
                onChange={handleChange}
                placeholder="icon-pool"
                maxLength={255}
              />
              <FieldDescription>Icon identifier or URL for the facility.</FieldDescription>
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
