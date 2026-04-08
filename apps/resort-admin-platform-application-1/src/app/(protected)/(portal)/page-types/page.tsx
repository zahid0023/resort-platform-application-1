"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { PageTypeDialog } from "@/components/page-types/page-type-dialog"
import { PageTypeCard } from "@/components/page-types/page-type-card"
import {
  listPageTypes,
  getPageType,
  deletePageType,
  type PageTypeSummary,
  type PageType,
  type PageTypeListResponse,
} from "@/services/page-types"

const PAGE_SIZE = 10

export default function PageTypesPage() {
  const [data, setData] = useState<PageTypeListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<PageType | null>(null)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listPageTypes({ page, size: PAGE_SIZE, sort_by: "id", sort_dir: "ASC" })
      setData(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load page types.")
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const handleCreate = () => {
    setEditing(null)
    setSheetOpen(true)
  }

  const handleEdit = async (row: PageTypeSummary) => {
    try {
      const res = await getPageType(row.id)
      setEditing(res.data)
      setSheetOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load page type.")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deletePageType(id)
      toast.success("Page type deleted.")
      fetchList()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete page type.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Page Types</h1>
          <p className="text-sm text-muted-foreground">Manage page type classifications for the resort.</p>
        </div>
        <Button onClick={handleCreate}>
          <PlusIcon />
          New Page Type
        </Button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="size-6" />
        </div>
      ) : data?.data.length === 0 ? (
        <div className="flex justify-center py-20 text-sm text-muted-foreground">
          No page types found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((row) => (
            <PageTypeCard
              key={row.id}
              data={row}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
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

      {/* Create / Edit Sheet */}
      <PageTypeDialog
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editing={editing}
        onSuccess={fetchList}
      />
    </div>
  )
}

