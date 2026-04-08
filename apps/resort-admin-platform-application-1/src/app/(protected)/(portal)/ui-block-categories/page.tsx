"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { UiBlockCategoryCard } from "@/components/ui-block-categories/ui-block-category-card"
import { UiBlockCategoryDialog } from "@/components/ui-block-categories/ui-block-category-dialog"
import {
  listUiBlockCategories,
  deleteUiBlockCategory,
  type UiBlockCategory,
  type UiBlockCategoryListResponse,
} from "@/services/ui-block-categories"

const PAGE_SIZE = 10

export default function UiBlockCategoriesPage() {
  const [data, setData] = useState<UiBlockCategoryListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<UiBlockCategory | null>(null)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listUiBlockCategories({ page, size: PAGE_SIZE, sort_by: "id", sort_dir: "ASC" })
      setData(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load UI block categories.")
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

  const handleEdit = (item: UiBlockCategory) => {
    setEditing(item)
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteUiBlockCategory(id)
      toast.success("UI block category deleted.")
      fetchList()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete UI block category.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">UI Block Categories</h1>
          <p className="text-sm text-muted-foreground">Manage categories used to classify UI blocks.</p>
        </div>
        <Button onClick={handleCreate}>
          <PlusIcon />
          New Category
        </Button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="size-6" />
        </div>
      ) : data?.data.length === 0 ? (
        <div className="flex justify-center py-20 text-sm text-muted-foreground">
          No UI block categories found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((item) => (
            <UiBlockCategoryCard
              key={item.id}
              data={item}
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
            <Button size="icon-sm" variant="outline" disabled={!data.has_previous} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeftIcon />
            </Button>
            <Button size="icon-sm" variant="outline" disabled={!data.has_next} onClick={() => setPage((p) => p + 1)}>
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog */}
      <UiBlockCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSuccess={fetchList}
      />
    </div>
  )
}
