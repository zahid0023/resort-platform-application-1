"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ResortAccessTypeDialog } from "@/components/resort-access-types/resort-access-type-dialog"
import { ResortAccessTypeCard } from "@/components/resort-access-types/resort-access-type-card"
import {
  listResortAccessTypes,
  getResortAccessType,
  deleteResortAccessType,
  type ResortAccessTypeSummary,
  type ResortAccessType,
  type ResortAccessTypeListResponse,
} from "@/services/resort-access-types"

const PAGE_SIZE = 10

export default function AccessTypesPage() {
  const [data, setData] = useState<ResortAccessTypeListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ResortAccessType | null>(null)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listResortAccessTypes({ page, size: PAGE_SIZE, sort_by: "id", sort_dir: "ASC" })
      setData(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load access types.")
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const handleCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const handleEdit = async (row: ResortAccessTypeSummary) => {
    try {
      const res = await getResortAccessType(row.id)
      setEditing(res.data)
      setDialogOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load access type.")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteResortAccessType(id)
      toast.success("Access type deleted.")
      fetchList()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete access type.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Access Types</h1>
          <p className="text-sm text-muted-foreground">Manage resort access type classifications.</p>
        </div>
        <Button onClick={handleCreate}>
          <PlusIcon />
          New Access Type
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="size-6" />
        </div>
      ) : data?.data.length === 0 ? (
        <div className="flex justify-center py-20 text-sm text-muted-foreground">
          No access types found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((row) => (
            <ResortAccessTypeCard
              key={row.id}
              data={row}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {data.current_page + 1} of {data.total_pages} &mdash; {data.total_elements} total
          </span>
          <div className="flex gap-2">
            <Button
              size="icon-sm"
              variant="outline"
              disabled={!data.has_previous}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              disabled={!data.has_next}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}

      <ResortAccessTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSuccess={fetchList}
      />
    </div>
  )
}
