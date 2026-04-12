"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { RoomCategoryDialog } from "@/components/room-categories/room-category-dialog"
import { RoomCategoryCard } from "@/components/room-categories/room-category-card"
import {
  listRoomCategories,
  getRoomCategory,
  deleteRoomCategory,
  type RoomCategorySummary,
  type RoomCategory,
  type RoomCategoryListResponse,
} from "@/services/room-categories"

export default function RoomCategoriesPage() {
  const [data, setData] = useState<RoomCategoryListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RoomCategory | null>(null)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      setData(await listRoomCategories({ page, size: 10, sort_by: "id", sort_dir: "ASC" }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load.")
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchList() }, [fetchList])

  const handleEdit = async (row: RoomCategorySummary) => {
    try {
      const res = await getRoomCategory(row.id)
      setEditing(res.data)
      setDialogOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load.")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteRoomCategory(id)
      toast.success("Room category deleted.")
      fetchList()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Room Categories</h1>
          <p className="text-sm text-muted-foreground">Manage room category records.</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
          <PlusIcon />New Room Category
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="size-6" /></div>
      ) : data?.data.length === 0 ? (
        <div className="flex justify-center py-20 text-sm text-muted-foreground">No records found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map(row => (
            <RoomCategoryCard key={row.id} data={row} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {data.current_page + 1} of {data.total_pages} — {data.total_elements} total</span>
          <div className="flex gap-2">
            <Button size="icon-sm" variant="outline" disabled={!data.has_previous} onClick={() => setPage(p => p - 1)}>
              <ChevronLeftIcon />
            </Button>
            <Button size="icon-sm" variant="outline" disabled={!data.has_next} onClick={() => setPage(p => p + 1)}>
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}

      <RoomCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSuccess={fetchList}
      />
    </div>
  )
}
