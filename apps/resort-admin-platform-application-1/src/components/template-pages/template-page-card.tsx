"use client"

import { useState } from "react"
import { FileStackIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { TemplatePageSummary } from "@/services/template-pages"

interface TemplatePageCardProps {
  data: TemplatePageSummary
  onEdit: (data: TemplatePageSummary) => void
  onDelete: (id: number) => Promise<void>
}

export function TemplatePageCard({ data, onEdit, onDelete }: TemplatePageCardProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(data.id)
    setDeleting(false)
    setConfirming(false)
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-4 text-sm ring-1 ring-foreground/10">
      {/* Row 1: icon, name, slug, actions */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileStackIcon className="size-4" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">{data.page_name}</span>
          <span className="truncate font-mono text-xs text-muted-foreground">/{data.page_slug}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {confirming ? (
            <>
              <span className="mr-1 text-xs text-muted-foreground">Sure?</span>
              <Button size="icon-sm" variant="destructive" disabled={deleting} onClick={handleDelete}>
                {deleting ? <Spinner className="size-3" /> : <Trash2Icon />}
              </Button>
              <Button size="icon-sm" variant="outline" onClick={() => setConfirming(false)}>
                ✕
              </Button>
            </>
          ) : (
            <>
              <Button size="icon-sm" variant="ghost" onClick={() => onEdit(data)}>
                <PencilIcon />
              </Button>
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

      {/* Row 2: metadata */}
      <div className="flex gap-3 pl-12 text-xs text-muted-foreground">
        <span>Template #{data.template_id}</span>
        <span>·</span>
        <span>Page Type #{data.page_type_id}</span>
        {data.page_order != null && (
          <>
            <span>·</span>
            <span>Order {data.page_order}</span>
          </>
        )}
      </div>
    </div>
  )
}
