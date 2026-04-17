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
  createRoomPricePeriod,
  updateRoomPricePeriod,
  type RoomPricePeriodSummary,
} from "@/services/room-price-periods"
import { listPriceTypes, type PriceTypeSummary } from "@/services/price-types"

interface RoomPricePeriodDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resortId: string
  categoryId: number
  roomId: number
  editing: RoomPricePeriodSummary | null
  onSuccess: () => void
}

const empty = {
  start_date: "",
  end_date: "",
  price: "",
  priority: "1",
  price_type_id: "",
}

export function RoomPricePeriodDialog({
  open,
  onOpenChange,
  resortId,
  categoryId,
  roomId,
  editing,
  onSuccess,
}: RoomPricePeriodDialogProps) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)
  const [priceTypes, setPriceTypes] = useState<PriceTypeSummary[]>([])

  useEffect(() => {
    listPriceTypes({ size: 50 })
      .then((res) => setPriceTypes(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (editing) {
      setForm({
        start_date: editing.start_date,
        end_date: editing.end_date,
        price: String(editing.price),
        priority: String(editing.priority ?? 1),
        price_type_id: String(editing.price_type_id),
      })
    } else {
      setForm(empty)
    }
  }, [editing, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editing) {
        await updateRoomPricePeriod(resortId, categoryId, roomId, editing.id, {
          start_date: form.start_date,
          end_date: form.end_date,
          price: Number(form.price),
          priority: form.priority ? Number(form.priority) : undefined,
          price_type_id: Number(form.price_type_id),
        })
        toast.success("Price period updated successfully!")
      } else {
        await createRoomPricePeriod(resortId, categoryId, roomId, {
          start_date: form.start_date,
          end_date: form.end_date,
          price: Number(form.price),
          priority: form.priority ? Number(form.priority) : undefined,
          price_type_id: Number(form.price_type_id),
        })
        toast.success("Price period created successfully!")
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
          <DialogTitle>{editing ? "Edit Price Period" : "Add Price Period"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update the pricing period details." : "Define a new pricing period for this room."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="price_type_id">Price Type *</FieldLabel>
              <select
                id="price_type_id"
                name="price_type_id"
                value={form.price_type_id}
                onChange={handleChange}
                required
                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a price type…</option>
                {priceTypes.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.name} ({pt.code})
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="start_date">Start Date *</FieldLabel>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={handleChange}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="end_date">End Date *</FieldLabel>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={handleChange}
                  required
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="price">Price *</FieldLabel>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="350.00"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="priority">Priority</FieldLabel>
                <Input
                  id="priority"
                  name="priority"
                  type="number"
                  min={1}
                  value={form.priority}
                  onChange={handleChange}
                  placeholder="1"
                />
                <FieldDescription>Higher wins on overlap.</FieldDescription>
              </Field>
            </div>
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
                : editing ? "Save Changes" : "Add Period"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
