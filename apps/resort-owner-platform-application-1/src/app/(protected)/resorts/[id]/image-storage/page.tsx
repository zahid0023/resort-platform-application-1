"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from "@resort/shadcn-ui"
import { resortImageHostingConfigsService, type ResortImageHostingConfig } from "@/services/resort-image-storage-configs"
import { ImageStorageConfigCard } from "@/components/resort-image-storage/image-storage-config-card"
import {
  ImageStorageConfigDialog,
  emptyConfigForm,
  type DialogMode,
  type ConfigFormState,
} from "@/components/resort-image-storage/image-storage-config-dialog"
import { toast } from "sonner"

export default function ImageStoragePage() {
  const params = useParams()
  const resortId = Number(params.id)
  const { t } = useTranslation()

  const [configs, setConfigs] = useState<ResortImageHostingConfig[]>([])
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [mode, setMode] = useState<DialogMode>("create")
  const [activeConfigId, setActiveConfigId] = useState<number | undefined>(undefined)
  const [form, setForm] = useState<ConfigFormState>(emptyConfigForm)

  const [deleteTarget, setDeleteTarget] = useState<ResortImageHostingConfig | null>(null)

  async function refresh() {
    setLoading(true)
    try {
      const res = await resortImageHostingConfigsService.list(resortId, { size: 50, sort_by: "id" })
      setConfigs(res.data)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openCreate() {
    setMode("create")
    setActiveConfigId(undefined)
    setForm(emptyConfigForm)
    setDialogOpen(true)
  }

  function openView(c: ResortImageHostingConfig) {
    setMode("view")
    setActiveConfigId(c.id)
    setForm({ name: c.name, provider: c.provider, config: c.config })
    setDialogOpen(true)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await resortImageHostingConfigsService.remove(resortId, deleteTarget.id)
      toast.success(t("imageStorage.deletedToast"))
      setDeleteTarget(null)
      await refresh()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" /> {t("imageStorage.new")}
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">{t("imageStorage.loading")}</div>
      ) : configs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl border-dashed">
          {t("imageStorage.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {configs.map((c) => (
            <ImageStorageConfigCard
              key={c.id}
              config={c}
              onView={() => openView(c)}
              onDelete={() => setDeleteTarget(c)}
            />
          ))}
        </div>
      )}

      <ImageStorageConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={mode}
        resortId={resortId}
        configId={activeConfigId}
        form={form}
        onFormChange={setForm}
        onSaved={refresh}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("imageStorage.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("imageStorage.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
