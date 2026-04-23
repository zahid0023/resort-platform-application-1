"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { createFacility, updateFacility, type Facility, type IconType } from "@/services/facilities"
import { EntityCardPreview } from "@/components/shared/entity-card-preview"
import { EntityIconFields, type IconFormState } from "@/components/shared/entity-icon-fields"

interface FacilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  facilityGroupId: number
  editing: Facility | null
  onSuccess: () => void
}

interface FormState extends IconFormState {
  code: string
  name: string
  description: string
  sort_order: number
}

const emptyForm: FormState = {
  code: "", name: "", description: "", sort_order: 0,
  icon_type: "", icon_value: "", icon_color: "", icon_size: "",
}

const toFormState = (item: Facility | null): FormState => {
  if (!item) return emptyForm
  const meta = item.icon_meta ?? {}
  const color = typeof meta.color === "string" ? meta.color : ""
  const sizeRaw = meta.size
  const size = typeof sizeRaw === "number" ? String(sizeRaw) : typeof sizeRaw === "string" ? sizeRaw : ""
  return {
    code: item.code,
    name: item.name,
    description: item.description ?? "",
    sort_order: item.sort_order ?? 0,
    icon_type: item.icon_type,
    icon_value: item.icon_value,
    icon_color: color,
    icon_size: size,
  }
}

export function FacilityDialog({ open, onOpenChange, facilityGroupId, editing, onSuccess }: FacilityDialogProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(editing))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(toFormState(editing))
      setLoading(false)
    }
  }, [open, editing])

  const set = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.icon_type) {
      toast.error("Select an icon type", { description: "Please choose an icon type before saving." })
      return
    }
    if (!form.icon_value) {
      toast.error(
        form.icon_type === "LUCIDE" ? "Pick an icon" : "Icon value required",
        { description: form.icon_type === "LUCIDE" ? "Please select a Lucide icon below." : "Please enter an icon value." },
      )
      return
    }
    let icon_meta: Record<string, unknown> | undefined
    if (form.icon_color || form.icon_size) {
      icon_meta = {}
      if (form.icon_color) icon_meta.color = form.icon_color
      if (form.icon_size) icon_meta.size = Number(form.icon_size)
    }
    setLoading(true)
    try {
      const payload = {
        facility_group_id: facilityGroupId,
        code: form.code,
        name: form.name,
        description: form.description || undefined,
        sort_order: form.sort_order,
        icon_type: form.icon_type as IconType,
        icon_value: form.icon_value,
        icon_meta,
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
      <DialogContent className="gap-0 p-0 sm:max-w-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
          <DialogHeader className="shrink-0 space-y-3 border-b border-border/50 bg-background/95 px-6 pt-6 pb-4 backdrop-blur-md">
            <DialogTitle>{editing ? "Edit Facility" : "New Facility"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the details of this facility." : "Create a new facility within this group."}
            </DialogDescription>
            <EntityCardPreview
              name={form.name}
              code={form.code}
              description={form.description}
              sort_order={form.sort_order}
              icon_type={form.icon_type}
              icon_value={form.icon_value}
              icon_color={form.icon_color}
              id={editing?.id}
              namePlaceholder="Untitled facility"
            />
          </DialogHeader>

          <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => set({ code: e.target.value.toUpperCase().replace(/[^A-Z0-9_\s]/g, "").replace(/\s+/g, "_").replace(/_+/g, "_") })}
                  placeholder="POOL_OUTDOOR"
                  maxLength={100}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => set({ sort_order: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="Outdoor Pool"
                maxLength={255}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="Optional description..."
                rows={3}
              />
            </div>

            <EntityIconFields value={form} onChange={set} />
          </div>

          <DialogFooter className="shrink-0 border-t border-border/50 bg-background/95 px-6 py-4 backdrop-blur-md">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? (editing ? "Saving..." : "Creating...") : (editing ? "Save changes" : "Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
