"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { BedDoubleIcon, CalendarDaysIcon, PencilIcon, PlusIcon, Trash2Icon, UsersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ResortRoomCategoryDialog } from "@/components/resort-room-category/resort-room-category-dialog"
import { RoomDialog } from "@/components/room/room-dialog"
import { RoomPricePeriodsSheet } from "@/components/room-price-period/room-price-periods-sheet"
import {
  listResortRoomCategories,
  getResortRoomCategory,
  deleteResortRoomCategory,
  type ResortRoomCategorySummary,
} from "@/services/resort-room-categories"
import {
  listRooms,
  getRoom,
  deleteRoom,
  type RoomSummary,
} from "@/services/rooms"

async function fetchAllPages<T>(
  fetcher: (page: number, size: number) => Promise<{ data: T[]; has_next: boolean }>,
  size = 50
): Promise<T[]> {
  const results: T[] = []
  let page = 0
  let hasNext = true
  while (hasNext) {
    const res = await fetcher(page, size)
    results.push(...res.data)
    hasNext = res.has_next
    page++
  }
  return results
}

function RoomTile({
  room,
  onEdit,
  onDelete,
  onPricing,
}: {
  room: RoomSummary
  onEdit: () => void
  onDelete: () => Promise<void>
  onPricing: () => void
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
    <div className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3 text-sm ring-1 ring-foreground/10">
      {/* Room info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-medium leading-tight truncate">{room.name}</span>
          {room.room_number && (
            <span className="shrink-0 font-mono text-xs text-muted-foreground">#{room.room_number}</span>
          )}
          {room.floor != null && (
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              Floor {room.floor}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <UsersIcon className="size-3" />{room.max_occupancy} guests
          </span>
          <span className="font-semibold text-foreground">${room.base_price}<span className="font-normal text-muted-foreground">/night base</span></span>
        </div>
      </div>

      {/* Pricing button — primary action */}
      {!confirming && (
        <Button size="sm" variant="outline" className="shrink-0 text-xs" onClick={onPricing}>
          <CalendarDaysIcon className="size-3" />Set Pricing
        </Button>
      )}

      {/* Edit / Delete */}
      {confirming ? (
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-xs text-muted-foreground">Delete?</span>
          <Button size="icon-sm" variant="destructive" disabled={deleting} onClick={handleDelete}>
            {deleting ? <Spinner className="size-3" /> : "✓"}
          </Button>
          <Button size="icon-sm" variant="outline" onClick={() => setConfirming(false)}>✕</Button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-0.5">
          <Button size="icon-sm" variant="ghost" onClick={onEdit}><PencilIcon /></Button>
          <Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirming(true)}>
            <Trash2Icon />
          </Button>
        </div>
      )}
    </div>
  )
}

export default function RoomsPage() {
  const { resortId } = useParams<{ resortId: string }>()

  const [categories, setCategories] = useState<ResortRoomCategorySummary[]>([])
  const [roomsByCategory, setRoomsByCategory] = useState<Record<number, RoomSummary[]>>({})
  const [loading, setLoading] = useState(true)

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ResortRoomCategorySummary | null>(null)
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)

  const [roomDialogOpen, setRoomDialogOpen] = useState(false)
  const [roomDialogCategoryId, setRoomDialogCategoryId] = useState<number | null>(null)
  const [editingRoom, setEditingRoom] = useState<RoomSummary | null>(null)

  const [pricingSheetOpen, setPricingSheetOpen] = useState(false)
  const [pricingRoom, setPricingRoom] = useState<{ categoryId: number; room: RoomSummary } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const allCategories = await fetchAllPages<ResortRoomCategorySummary>(
        (page, size) => listResortRoomCategories(resortId, { page, size, sort_by: "sortOrder", sort_dir: "ASC" })
      )
      setCategories(allCategories)

      const roomResults = await Promise.all(
        allCategories.map((cat) =>
          fetchAllPages<RoomSummary>(
            (page, size) => listRooms(resortId, cat.id, { page, size, sort_by: "name", sort_dir: "ASC" })
          ).then((data) => ({ categoryId: cat.id, data }))
        )
      )

      const map: Record<number, RoomSummary[]> = {}
      for (const { categoryId, data } of roomResults) map[categoryId] = data
      setRoomsByCategory(map)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load rooms.")
    } finally {
      setLoading(false)
    }
  }, [resortId])

  useEffect(() => { load() }, [load])

  const handleEditCategory = async (cat: ResortRoomCategorySummary) => {
    try {
      const res = await getResortRoomCategory(resortId, cat.id)
      setEditingCategory(res.data)
      setCategoryDialogOpen(true)
    } catch {
      toast.error("Failed to load category.")
    }
  }

  const handleDeleteCategory = async (id: number) => {
    setDeletingCategoryId(id)
    try {
      await deleteResortRoomCategory(resortId, id)
      toast.success("Room category removed.")
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete.")
    } finally {
      setDeletingCategoryId(null)
    }
  }

  const openAddRoom = (categoryId: number) => {
    setRoomDialogCategoryId(categoryId)
    setEditingRoom(null)
    setRoomDialogOpen(true)
  }

  const handleEditRoom = async (categoryId: number, room: RoomSummary) => {
    try {
      const res = await getRoom(resortId, categoryId, room.id)
      setRoomDialogCategoryId(categoryId)
      setEditingRoom(res.data)
      setRoomDialogOpen(true)
    } catch {
      toast.error("Failed to load room.")
    }
  }

  const openPricing = (categoryId: number, room: RoomSummary) => {
    setPricingRoom({ categoryId, room })
    setPricingSheetOpen(true)
  }

  const handleDeleteRoom = async (categoryId: number, roomId: number) => {
    await deleteRoom(resortId, categoryId, roomId)
    toast.success("Room removed.")
    load()
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner className="size-6" /></div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Rooms</h1>
          <p className="text-sm text-muted-foreground">Manage room categories and rooms for this resort.</p>
        </div>
        <Button onClick={() => { setEditingCategory(null); setCategoryDialogOpen(true) }}>
          <PlusIcon />Add Room Category
        </Button>
      </div>

      {categories.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-sm text-muted-foreground">
          <p>No room categories added yet.</p>
          <Button onClick={() => { setEditingCategory(null); setCategoryDialogOpen(true) }}>
            <PlusIcon />Add Room Category
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {categories.map((cat) => {
          const rooms = roomsByCategory[cat.id] ?? []
          const isDeleting = deletingCategoryId === cat.id

          return (
            <div key={cat.id} className="overflow-hidden rounded-xl border bg-card ring-1 ring-foreground/10">
              <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BedDoubleIcon className="size-4" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{cat.name}</span>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {rooms.length} room{rooms.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {cat.description && (
                    <span className="truncate text-xs text-muted-foreground">{cat.description}</span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => openAddRoom(cat.id)}>
                    <PlusIcon className="size-3" />Add Room
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => handleEditCategory(cat)}>
                    <PencilIcon />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={isDeleting}
                    onClick={() => handleDeleteCategory(cat.id)}
                  >
                    {isDeleting ? <Spinner className="size-3" /> : <Trash2Icon />}
                  </Button>
                </div>
              </div>

              {rooms.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
                  <p>No rooms added yet.</p>
                  <Button size="sm" variant="outline" onClick={() => openAddRoom(cat.id)}>
                    <PlusIcon className="size-3" />Add Room
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 p-3">
                  {rooms.map((room) => (
                    <RoomTile
                      key={room.id}
                      room={room}
                      onPricing={() => openPricing(cat.id, room)}
                      onEdit={() => handleEditRoom(cat.id, room)}
                      onDelete={() => handleDeleteRoom(cat.id, room.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ResortRoomCategoryDialog
        resortId={resortId}
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        editing={editingCategory}
        onSuccess={load}
        assignedCategoryIds={categories.map((c) => c.room_category_id)}
      />

      {roomDialogCategoryId !== null && (
        <RoomDialog
          resortId={resortId}
          categoryId={roomDialogCategoryId}
          open={roomDialogOpen}
          onOpenChange={setRoomDialogOpen}
          editing={editingRoom}
          onSuccess={load}
        />
      )}

      {pricingRoom !== null && (
        <RoomPricePeriodsSheet
          open={pricingSheetOpen}
          onOpenChange={setPricingSheetOpen}
          resortId={resortId}
          categoryId={pricingRoom.categoryId}
          roomId={pricingRoom.room.id}
          roomName={pricingRoom.room.name}
        />
      )}
    </div>
  )
}
