"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { SaveIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import { createRoom, updateRoom, type RoomSummary } from "@/services/rooms"

const empty = {
  name: "",
  description: "",
  room_number: "",
  floor: "",
  max_adults: "",
  max_children: "",
  base_price: "",
}

type FormState = typeof empty

function getDraftKey(resortId: string, categoryId: number) {
  return `room-draft:${resortId}:${categoryId}`
}

function isNonEmpty(form: FormState) {
  return Object.values(form).some((v) => v.trim() !== "")
}

export function RoomDialog({
  resortId,
  categoryId,
  open,
  onOpenChange,
  editing,
  onSuccess,
}: {
  resortId: string
  categoryId: number
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: RoomSummary | null
  onSuccess: () => void
}) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const draftKey = getDraftKey(resortId, categoryId)

  // On open: load draft (create mode) or populate from editing (edit mode)
  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        name: editing.name ?? "",
        description: editing.description ?? "",
        room_number: editing.room_number ?? "",
        floor: editing.floor != null ? String(editing.floor) : "",
        max_adults: editing.max_adults != null ? String(editing.max_adults) : "",
        max_children: editing.max_children != null ? String(editing.max_children) : "",
        base_price: editing.base_price ?? "",
      })
      setHasDraft(false)
      setDraftSavedAt(null)
    } else {
      const saved = localStorage.getItem(draftKey)
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as { form: FormState; savedAt: string }
          setForm(parsed.form)
          setHasDraft(true)
          setDraftSavedAt(new Date(parsed.savedAt))
        } catch {
          setForm(empty)
          setHasDraft(false)
          setDraftSavedAt(null)
        }
      } else {
        setForm(empty)
        setHasDraft(false)
        setDraftSavedAt(null)
      }
    }
  }, [editing, open, draftKey])

  // Auto-save draft 800ms after user stops typing (create mode only)
  useEffect(() => {
    if (editing || !open) return
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => {
      if (isNonEmpty(form)) {
        const savedAt = new Date()
        localStorage.setItem(draftKey, JSON.stringify({ form, savedAt: savedAt.toISOString() }))
        setHasDraft(true)
        setDraftSavedAt(savedAt)
      }
    }, 800)
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current) }
  }, [form, editing, open, draftKey])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const discardDraft = () => {
    localStorage.removeItem(draftKey)
    setForm(empty)
    setHasDraft(false)
    setDraftSavedAt(null)
  }

  const clearDraft = () => {
    localStorage.removeItem(draftKey)
    setHasDraft(false)
    setDraftSavedAt(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editing) {
        await updateRoom(resortId, categoryId, editing.id, {
          name: form.name || undefined,
          description: form.description || undefined,
          room_number: form.room_number || undefined,
          floor: form.floor ? Number(form.floor) : undefined,
          max_adults: form.max_adults ? Number(form.max_adults) : undefined,
          max_children: form.max_children ? Number(form.max_children) : undefined,
          base_price: form.base_price || undefined,
        })
      } else {
        await createRoom(resortId, categoryId, {
          name: form.name,
          description: form.description || undefined,
          room_number: form.room_number || undefined,
          floor: form.floor ? Number(form.floor) : undefined,
          max_adults: Number(form.max_adults),
          max_children: form.max_children ? Number(form.max_children) : undefined,
          base_price: form.base_price,
        })
        clearDraft()
      }
      toast.success(`Room ${editing ? "updated" : "created"} successfully!`)
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const draftLabel = draftSavedAt
    ? `Draft saved at ${draftSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Room" : "Add Room"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update the room details." : "Add a new room to this category."}
          </DialogDescription>
        </DialogHeader>

        {!editing && hasDraft && draftLabel && (
          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs dark:border-amber-800 dark:bg-amber-950/40">
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <SaveIcon className="size-3" />
              <span>{draftLabel}</span>
            </div>
            <button
              type="button"
              onClick={discardDraft}
              className="text-amber-600 underline underline-offset-2 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
            >
              Discard
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name *</FieldLabel>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Room 101"
                maxLength={255}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="room_number">Room Number</FieldLabel>
                <Input
                  id="room_number"
                  name="room_number"
                  value={form.room_number}
                  onChange={handleChange}
                  placeholder="101"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="floor">Floor</FieldLabel>
                <Input
                  id="floor"
                  name="floor"
                  type="number"
                  min={0}
                  value={form.floor}
                  onChange={handleChange}
                  placeholder="1"
                />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field>
                <FieldLabel htmlFor="max_adults">Max Adults *</FieldLabel>
                <Input
                  id="max_adults"
                  name="max_adults"
                  type="number"
                  min={1}
                  value={form.max_adults}
                  onChange={handleChange}
                  placeholder="2"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="max_children">Max Children</FieldLabel>
                <Input
                  id="max_children"
                  name="max_children"
                  type="number"
                  min={0}
                  value={form.max_children}
                  onChange={handleChange}
                  placeholder="0"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="base_price">Base Price *</FieldLabel>
                <Input
                  id="base_price"
                  name="base_price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.base_price}
                  onChange={handleChange}
                  placeholder="150.00"
                  required
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="A cozy double room with ocean view."
                rows={3}
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
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
                : editing ? "Save Changes" : "Add Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
