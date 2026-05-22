"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { LocaleCard } from "@/components/locales/locale-card"
import { LocaleDialog } from "@/components/locales/locale-dialog"
import { localesService, type Locale, type LocaleListResponse } from "@/services/locales"

export default function LocalesPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<LocaleListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Locale | null>(null)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      setData(await localesService.list({ page, size: 10, sort_by: "sortOrder", sort_dir: "ASC" }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("locales.errLoad"))
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchList() }, [fetchList])

  const handleEdit = async (locale: Locale) => {
    try {
      const res = await localesService.get(locale.id)
      setEditing(res.locale)
      setDialogOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("locales.errLoadOne"))
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await localesService.remove(id)
      toast.success(t("locales.deleted"))
      fetchList()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("locales.errDelete"))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t("locales.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("locales.subtitle")}</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
          <PlusIcon /> {t("locales.new")}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="size-6" /></div>
      ) : data?.data.length === 0 ? (
        <div className="flex justify-center py-20 text-sm text-muted-foreground">{t("locales.empty")}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((locale) => (
            <LocaleCard key={locale.id} data={locale} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("pagination.info", { current: data.current_page + 1, total: data.total_pages, elements: data.total_elements })}</span>
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

      <LocaleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSuccess={fetchList}
      />
    </div>
  )
}
