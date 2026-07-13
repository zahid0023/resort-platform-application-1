"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Upload } from "lucide-react"
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
  Dialog,
  DialogContent,
  Input,
  Label,
  Spinner,
} from "@resort/shadcn-ui"
import { ResortImageCard } from "@/components/resort-images/resort-image-card"
import { ResortImageUploadDialog } from "@/components/resort-images/resort-image-upload-dialog"
import { resortImagesService, type ResortImage } from "@/services/resort-images"

interface EditForm {
  caption: string
  sort_order: string
}

export default function ImagesPage() {
  const { t } = useTranslation()
  const params = useParams()
  const resortId = Number(params.id)

  const [images, setImages] = useState<ResortImage[]>([])
  const [loading, setLoading] = useState(true)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ResortImage | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ caption: "", sort_order: "0" })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ResortImage | null>(null)

  const fetchImages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await resortImagesService.list(resortId)
      setImages(res.data)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [resortId])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  function openEdit(img: ResortImage) {
    setEditTarget(img)
    setEditForm({ caption: img.caption ?? "", sort_order: String(img.sort_order) })
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget) return
    setSaving(true)
    try {
      await resortImagesService.update(resortId, editTarget.id, {
        caption: editForm.caption.trim() || null,
        sort_order: Number(editForm.sort_order) || 0,
      })
      toast.success(t("images.updatedToast"))
      setEditTarget(null)
      await fetchImages()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await resortImagesService.remove(resortId, deleteTarget.id)
      toast.success(t("images.deletedToast"))
      setDeleteTarget(null)
      await fetchImages()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <StatPill label={t("images.statTotal")} value={images.length} />
        </div>
        <Button onClick={() => setUploadOpen(true)} disabled={loading}>
          <Upload className="h-4 w-4 mr-1.5" /> {t("images.upload")}
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="size-6" />
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 border rounded-xl border-dashed text-muted-foreground">
          <p>{t("images.empty")}</p>
          <Button variant="outline" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-1.5" /> {t("images.upload")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <ResortImageCard
              key={img.id}
              image={img}
              onEdit={() => openEdit(img)}
              onDelete={() => setDeleteTarget(img)}
            />
          ))}
        </div>
      )}

      {/* Upload dialog */}
      <ResortImageUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        resortId={resortId}
        onUploaded={fetchImages}
      />

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("images.caption")}</Label>
              <Input
                value={editForm.caption}
                onChange={(e) => setEditForm((p) => ({ ...p, caption: e.target.value }))}
                placeholder={t("images.captionPlaceholder")}
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("field.sort")}</Label>
              <Input
                type="number"
                value={editForm.sort_order}
                onChange={(e) => setEditForm((p) => ({ ...p, sort_order: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="ghost" onClick={() => setEditTarget(null)} disabled={saving}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t("common.saving") : t("common.save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("images.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("images.deleteDesc")}</AlertDialogDescription>
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

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-center min-w-[52px]">
      <p className="text-base font-bold leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{label}</p>
    </div>
  )
}
