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
  createResortFacilityGroup,
  updateResortFacilityGroup,
  type ResortFacilityGroupSummary,
} from "@/services/resort-facility-groups"
import { listFacilityGroups, type FacilityGroupSummary } from "@/services/facility-groups"

const empty = {
  facility_group_id: "",
  name: "",
  description: "",
  sort_order: "",
}

export function ResortFacilityGroupDialog({
  resortId,
  open,
  onOpenChange,
  editing,
  onSuccess,
  assignedGroupIds = [],
}: {
  resortId: string
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: ResortFacilityGroupSummary | null
  onSuccess: () => void
  assignedGroupIds?: number[]
}) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)
  const [facilityGroups, setFacilityGroups] = useState<FacilityGroupSummary[]>([])

  useEffect(() => {
    listFacilityGroups({ size: 100, sort_by: "sort_order", sort_dir: "ASC" })
      .then((res) => setFacilityGroups(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setForm(
      editing
        ? {
            facility_group_id: String(editing.facility_group_id),
            name: editing.name,
            description: editing.description,
            sort_order: String(editing.sort_order),
          }
        : empty
    )
  }, [editing, open])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    if (name === "facility_group_id") {
      const group = facilityGroups.find((g) => String(g.id) === value)
      setForm((prev) => ({
        ...prev,
        facility_group_id: value,
        name: group?.name ?? prev.name,
        description: group?.description ?? prev.description,
        sort_order: group ? String(group.sort_order) : prev.sort_order,
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
        await updateResortFacilityGroup(resortId, editing.id, {
          name: form.name,
          description: form.description,
          sort_order: Number(form.sort_order),
        })
      } else {
        await createResortFacilityGroup(resortId, {
          facility_group_id: Number(form.facility_group_id),
          name: form.name,
          description: form.description,
          sort_order: Number(form.sort_order),
        })
      }
      toast.success(`Facility group ${editing ? "updated" : "created"} successfully!`)
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
          <DialogTitle>{editing ? "Edit Facility Group" : "Add Facility Group"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update the resort facility group details." : "Link a facility group to this resort."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            {!editing && (
              <Field>
                <FieldLabel htmlFor="facility_group_id">Facility Group *</FieldLabel>
                <select
                  id="facility_group_id"
                  name="facility_group_id"
                  value={form.facility_group_id}
                  onChange={handleChange}
                  required
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a facility group</option>
                  {facilityGroups
                    .filter((g) => !assignedGroupIds.includes(g.id))
                    .map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                </select>
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="name">Display Name *</FieldLabel>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Dining & Beverages"
                maxLength={255}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="description">Description *</FieldLabel>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="All dining outlets at this resort."
                rows={3}
                required
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="sort_order">Sort Order *</FieldLabel>
              <Input
                id="sort_order"
                name="sort_order"
                type="number"
                min={0}
                value={form.sort_order}
                onChange={handleChange}
                placeholder="1"
                required
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
                : editing ? "Save Changes" : "Add Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
