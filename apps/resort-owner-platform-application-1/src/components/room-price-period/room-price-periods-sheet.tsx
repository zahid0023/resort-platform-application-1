"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { RoomPricePeriodDialog } from "@/components/room-price-period/room-price-period-dialog"
import {
  listRoomPricePeriods,
  deleteRoomPricePeriod,
  type RoomPricePeriodSummary,
} from "@/services/room-price-periods"

interface RoomPricePeriodsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resortId: string
  categoryId: number
  roomId: number
  roomName: string
}

function PeriodRow({
  period,
  onEdit,
  onDelete,
}: {
  period: RoomPricePeriodSummary
  onEdit: () => void
  onDelete: () => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete()
    setDeleting(false)
    setConfirming(false)
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border bg-card p-3 text-sm ring-1 ring-foreground/10">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
              {period.price_type_name}
            </span>
            <span className="font-mono text-xs text-muted-foreground">{period.price_type_code}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {period.start_date} → {period.end_date}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-semibold">${Number(period.price).toFixed(2)}</span>
          {period.priority !== 1 && (
            <span className="text-[10px] text-muted-foreground">priority {period.priority}</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1">
        {confirming ? (
          <>
            <span className="mr-1 text-xs text-muted-foreground">Sure?</span>
            <Button size="icon-sm" variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? <Spinner className="size-3" /> : <Trash2Icon />}
            </Button>
            <Button size="icon-sm" variant="outline" onClick={() => setConfirming(false)}>✕</Button>
          </>
        ) : (
          <>
            <Button size="icon-sm" variant="ghost" onClick={onEdit}><PencilIcon /></Button>
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirming(true)}
            >
              <Trash2Icon />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export function RoomPricePeriodsSheet({
  open,
  onOpenChange,
  resortId,
  categoryId,
  roomId,
  roomName,
}: RoomPricePeriodsSheetProps) {
  const [periods, setPeriods] = useState<RoomPricePeriodSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RoomPricePeriodSummary | null>(null)

  const fetchPeriods = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listRoomPricePeriods(resortId, categoryId, roomId, {
        size: 50,
        sort_by: "startDate",
        sort_dir: "ASC",
      })
      setPeriods(res.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load price periods.")
    } finally {
      setLoading(false)
    }
  }, [resortId, categoryId, roomId])

  useEffect(() => {
    if (open) fetchPeriods()
  }, [open, fetchPeriods])

  const handleEdit = (period: RoomPricePeriodSummary) => {
    setEditing(period)
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    await deleteRoomPricePeriod(resortId, categoryId, roomId, id)
    toast.success("Price period deleted.")
    fetchPeriods()
  }

  const openAdd = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex flex-col overflow-hidden">
          <SheetHeader className="border-b pb-4">
            <SheetTitle>{roomName}</SheetTitle>
            <SheetDescription>Pricing periods for this room.</SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {periods.length} period{periods.length !== 1 ? "s" : ""}
              </span>
              <Button size="sm" onClick={openAdd}>
                <PlusIcon className="size-3" />Add Period
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Spinner className="size-5" />
              </div>
            ) : periods.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-sm text-muted-foreground">
                <p>No pricing periods defined yet.</p>
                <Button size="sm" variant="outline" onClick={openAdd}>
                  <PlusIcon className="size-3" />Add First Period
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {periods.map((period) => (
                  <PeriodRow
                    key={period.id}
                    period={period}
                    onEdit={() => handleEdit(period)}
                    onDelete={() => handleDelete(period.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <RoomPricePeriodDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        resortId={resortId}
        categoryId={categoryId}
        roomId={roomId}
        editing={editing}
        onSuccess={fetchPeriods}
      />
    </>
  )
}
