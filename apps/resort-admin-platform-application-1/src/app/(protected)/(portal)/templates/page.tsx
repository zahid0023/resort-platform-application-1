"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { TemplateDialog } from "@/components/templates/template-dialog"
import { TemplateCard } from "@/components/templates/template-card"
import {
  listTemplates,
  getTemplate,
  deleteTemplate,
  type TemplateSummary,
  type Template,
  type TemplateListResponse,
} from "@/services/templates"

const PAGE_SIZE = 10

export default function TemplatesPage() {
  const [data, setData] = useState<TemplateListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listTemplates({ page, size: PAGE_SIZE, sort_by: "id", sort_dir: "ASC" })
      setData(res)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load templates.")
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

  const handleEdit = async (row: TemplateSummary) => {
    try {
      const res = await getTemplate(row.id)
      setEditing(res.data)
      setDialogOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load template.")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteTemplate(id)
      toast.success("Template deleted.")
      fetchList()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete template.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Templates</h1>
          <p className="text-sm text-muted-foreground">Manage page templates for the resort.</p>
        </div>
        <Button onClick={handleCreate}>
          <PlusIcon />
          New Template
        </Button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="size-6" />
        </div>
      ) : data?.data.length === 0 ? (
        <div className="flex justify-center py-20 text-sm text-muted-foreground">
          No templates found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((row) => (
            <TemplateCard
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

      {/* Create / Edit Dialog */}
      <TemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSuccess={fetchList}
      />
    </div>
  )
}
