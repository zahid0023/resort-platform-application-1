"use client"

import { useEffect, useRef, useState } from "react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Button, Input, Label,
} from "@resort/shadcn-ui"
import { toast } from "sonner"
import { BedDouble, Check, Loader2, Minus, Pencil, Plus, Trash2, X } from "lucide-react"
import {
  resortRoomCategoriesService,
  type ResortRoomCategoryBed,
} from "@/services/resort-room-categories"
import type { BedType } from "@/services/bed-types"
import { BedTypePickerDialog } from "@/components/bed-types/bed-type-picker-dialog"

export interface ResortRoomCategoryBedsSectionProps {
  resortId: number
  resortRoomCategoryId: number
  open: boolean
  initialBeds?: ResortRoomCategoryBed[]
}

export function ResortRoomCategoryBedsSection({
  resortId,
  resortRoomCategoryId,
  open,
  initialBeds,
}: ResortRoomCategoryBedsSectionProps) {
  const [beds, setBeds] = useState<ResortRoomCategoryBed[]>([])
  const [loading, setLoading] = useState(false)
  const loadedRef = useRef(false)

  // Add bed
  const [pickerOpen, setPickerOpen] = useState(false)
  const [addingBedType, setAddingBedType] = useState<BedType | null>(null)
  const [addQty, setAddQty] = useState(1)
  const [addSaving, setAddSaving] = useState(false)

  // Edit bed
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editQty, setEditQty] = useState(1)
  const [editSaving, setEditSaving] = useState(false)

  // Delete bed
  const [deleteTarget, setDeleteTarget] = useState<ResortRoomCategoryBed | null>(null)

  useEffect(() => {
    if (open && !loadedRef.current) {
      loadedRef.current = true
      if (initialBeds) {
        setBeds(initialBeds)
      } else {
        loadBeds()
      }
    }
    if (!open) {
      loadedRef.current = false
      setBeds([])
      setAddingBedType(null)
      setEditingId(null)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadBeds() {
    setLoading(true)
    try {
      const res = await resortRoomCategoriesService.listBeds(resortId, resortRoomCategoryId)
      setBeds(res.data)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function handleBedTypeSelected(bt: BedType) {
    setAddingBedType(bt)
    setAddQty(1)
  }

  async function confirmAdd() {
    if (!addingBedType) return
    setAddSaving(true)
    try {
      await resortRoomCategoriesService.addBed(resortId, resortRoomCategoryId, {
        bed_type_id: addingBedType.id,
        quantity: addQty,
        sort_order: beds.length,
      })
      toast.success("Bed added.")
      setAddingBedType(null)
      loadBeds()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setAddSaving(false)
    }
  }

  function startEdit(bed: ResortRoomCategoryBed) {
    setEditingId(bed.id)
    setEditQty(bed.quantity)
  }

  async function saveEdit(bed: ResortRoomCategoryBed) {
    setEditSaving(true)
    try {
      await resortRoomCategoriesService.updateBed(resortId, resortRoomCategoryId, bed.id, {
        quantity: editQty,
        sort_order: bed.sort_order,
      })
      toast.success("Bed updated.")
      setEditingId(null)
      loadBeds()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setEditSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await resortRoomCategoriesService.removeBed(resortId, resortRoomCategoryId, deleteTarget.id)
      toast.success("Bed removed.")
      setDeleteTarget(null)
      loadBeds()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Beds</h3>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1 px-2.5 text-xs"
          onClick={() => setPickerOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Add Bed
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : beds.length === 0 && !addingBedType ? (
        <p className="rounded-xl border border-dashed py-5 text-center text-xs text-muted-foreground">
          No beds configured yet.
        </p>
      ) : (
        <div className="space-y-2">
          {beds.map((bed) => {
            const isEditing = editingId === bed.id
            return (
              <div key={bed.id} className="rounded-xl border bg-card px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                    <BedDouble className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight truncate font-mono">{bed.bed_type.code}</p>
                    <p className="text-xs text-muted-foreground font-mono">#{bed.bed_type.id}</p>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button" size="icon" variant="outline"
                          className="h-7 w-7"
                          disabled={editQty <= 1 || editSaving}
                          onClick={() => setEditQty((q) => Math.max(1, q - 1))}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium tabular-nums">{editQty}</span>
                        <Button
                          type="button" size="icon" variant="outline"
                          className="h-7 w-7"
                          disabled={editSaving}
                          onClick={() => setEditQty((q) => q + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        type="button" size="icon" variant="ghost"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={() => setEditingId(null)} disabled={editSaving}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button" size="icon" variant="ghost"
                        className="h-7 w-7 text-primary"
                        onClick={() => saveEdit(bed)} disabled={editSaving}
                      >
                        {editSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold tabular-nums">×{bed.quantity}</span>
                      <Button
                        type="button" size="icon" variant="ghost" className="h-7 w-7"
                        onClick={() => startEdit(bed)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button" size="icon" variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(bed)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Inline add form */}
          {addingBedType && (
            <div className="rounded-xl border-2 border-dashed border-amber-500/30 bg-amber-500/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500">
                  <BedDouble className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight truncate">
                    {addingBedType.locales[0]?.name ?? addingBedType.code}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">{addingBedType.code}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button" size="icon" variant="outline"
                      className="h-7 w-7" disabled={addQty <= 1 || addSaving}
                      onClick={() => setAddQty((q) => Math.max(1, q - 1))}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium tabular-nums">{addQty}</span>
                    <Button
                      type="button" size="icon" variant="outline"
                      className="h-7 w-7" disabled={addSaving}
                      onClick={() => setAddQty((q) => q + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    type="button" size="icon" variant="ghost"
                    className="h-7 w-7 text-muted-foreground"
                    onClick={() => setAddingBedType(null)} disabled={addSaving}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button" size="icon" variant="ghost"
                    className="h-7 w-7 text-primary"
                    onClick={confirmAdd} disabled={addSaving}
                  >
                    {addSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <BedTypePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleBedTypeSelected}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this bed?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the bed configuration from this room category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
