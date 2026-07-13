"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
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
import { deleteResort } from "@/services/resorts"

export default function SettingsPage() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const resortId = Number(params.id)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteResort(resortId)
      toast.success(t("settings.deletedToast"))
      router.push("/resorts")
    } catch (err) {
      toast.error((err as Error).message)
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {t("resortDashboard.portal")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{t("settings.pageTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("settings.pageSubtitle")}</p>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-destructive uppercase tracking-wide">
          {t("settings.dangerZone")}
        </h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">{t("settings.deleteResort")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("settings.deleteResortDesc")}</p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            className="shrink-0"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            {t("common.delete")}
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("settings.deleteConfirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? t("settings.deleting") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
