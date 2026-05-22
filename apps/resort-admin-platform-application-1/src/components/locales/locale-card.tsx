"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { LanguagesIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import type { Locale } from "@/services/locales"

interface LocaleCardProps {
  data: Locale
  onEdit: (data: Locale) => void
  onDelete: (id: number) => Promise<void>
}

export function LocaleCard({ data, onEdit, onDelete }: LocaleCardProps) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(data.id)
    setDeleting(false)
    setConfirming(false)
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-sm ring-1 ring-foreground/10">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LanguagesIcon className="size-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">{data.name}</span>
          <span className="truncate font-mono text-xs text-muted-foreground">{data.code}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Badge variant="secondary" className="mr-1">#{data.sort_order}</Badge>
          {confirming ? (
            <>
              <span className="mr-1 text-xs text-muted-foreground">{t("locales.sure")}</span>
              <Button size="icon-sm" variant="destructive" disabled={deleting} onClick={handleDelete}>
                {deleting ? <Spinner className="size-3" /> : <Trash2Icon />}
              </Button>
              <Button size="icon-sm" variant="outline" onClick={() => setConfirming(false)}>✕</Button>
            </>
          ) : (
            <>
              <Button size="icon-sm" variant="ghost" onClick={() => onEdit(data)}><PencilIcon /></Button>
              <Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirming(true)}><Trash2Icon /></Button>
            </>
          )}
        </div>
      </div>
      {data.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 border-t pt-2">{data.description}</p>
      )}
    </div>
  )
}
