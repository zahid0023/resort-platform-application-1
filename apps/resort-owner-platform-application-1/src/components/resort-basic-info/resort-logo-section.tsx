"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ImageOff, Loader2, Plus, Upload } from "lucide-react"
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@resort/shadcn-ui"
import { resortBasicInfoService } from "@/services/resort-basic-info"
import { resortImageHostingConfigsService, type ResortImageHostingConfig } from "@/services/resort-image-storage-configs"
import { ImageStorageConfigDialog, emptyConfigForm, type ConfigFormState } from "@/components/resort-image-storage/image-storage-config-dialog"
import { toast } from "sonner"
import type { ResortBasicInfoFormState } from "./types"

export interface ResortLogoSectionProps {
  resortId: number
  form: ResortBasicInfoFormState
  onSaved?: () => void | Promise<void>
}

export function ResortLogoSection({ resortId, form, onSaved }: ResortLogoSectionProps) {
  const { t } = useTranslation()

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [configs, setConfigs] = useState<ResortImageHostingConfig[]>([])
  const [loadingConfigs, setLoadingConfigs] = useState(false)
  const [uploadConfigId, setUploadConfigId] = useState("")
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const [newConfigDialogOpen, setNewConfigDialogOpen] = useState(false)
  const [newConfigForm, setNewConfigForm] = useState<ConfigFormState>(emptyConfigForm)

  async function openUploadDialog() {
    setUploadDialogOpen(true)
    setUploadConfigId("")
    setUploadFile(null)
    setLoadingConfigs(true)
    try {
      const res = await resortImageHostingConfigsService.list(resortId, { size: 50 })
      setConfigs(res.data)
    } catch {
      toast.error(t("basicInfo.errLoadConfigs"))
    } finally {
      setLoadingConfigs(false)
    }
  }

  function closeUploadDialog() {
    setUploadDialogOpen(false)
    setUploadConfigId("")
    setUploadFile(null)
  }

  async function handleUpload() {
    if (!uploadConfigId || !uploadFile) {
      toast.error(t("basicInfo.errUploadFields"))
      return
    }
    setUploading(true)
    try {
      await resortBasicInfoService.uploadLogo(resortId, Number(uploadConfigId), uploadFile)
      toast.success(t("basicInfo.logoUploadedToast"))
      closeUploadDialog()
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  async function handleNewConfigSaved() {
    setNewConfigDialogOpen(false)
    setNewConfigForm(emptyConfigForm)
    setLoadingConfigs(true)
    try {
      const res = await resortImageHostingConfigsService.list(resortId, { size: 50 })
      setConfigs(res.data)
    } catch {
      toast.error(t("basicInfo.errLoadConfigs"))
    } finally {
      setLoadingConfigs(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-primary" />
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          {t("basicInfo.logoSection")}
        </h3>
      </div>

      <Card className="w-fit">
        <CardContent className="space-y-3">
          {form.logo_url ? (
            <div className="w-32 h-32 rounded-lg border bg-muted/40 flex items-center justify-center p-2">
              <img
                src={form.logo_url}
                alt="Resort logo"
                className="w-full h-full object-contain rounded"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
              />
            </div>
          ) : (
            <div className="w-32 h-32 flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed bg-muted/30">
              <ImageOff className="h-7 w-7 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">{t("basicInfo.noLogo")}</p>
            </div>
          )}

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={openUploadDialog}
            className="w-full h-7 text-xs gap-1.5"
          >
            <Upload className="h-3 w-3" />
            {form.logo_url ? t("basicInfo.replaceLogo") : t("basicInfo.uploadLogo")}
          </Button>
        </CardContent>
      </Card>

      {/* Upload dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={(v) => { if (!v) closeUploadDialog() }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("basicInfo.uploadLogoTitle")}</DialogTitle>
          </DialogHeader>

          {loadingConfigs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : configs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">{t("basicInfo.noConfigs")}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => { setNewConfigForm(emptyConfigForm); setNewConfigDialogOpen(true) }}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> {t("imageStorage.new")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">{t("basicInfo.selectConfig")} *</Label>
                <Select value={uploadConfigId} onValueChange={setUploadConfigId} disabled={uploading}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("basicInfo.selectConfig")} />
                  </SelectTrigger>
                  <SelectContent>
                    {configs.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} ({c.provider})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">{t("basicInfo.imageFile")} *</Label>
                <Input
                  type="file"
                  accept="image/*"
                  className="cursor-pointer"
                  disabled={uploading}
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={closeUploadDialog} disabled={uploading}>
                  {t("common.cancel")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleUpload}
                  disabled={uploading || !uploadConfigId || !uploadFile}
                  className="gap-1.5"
                >
                  {uploading
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("basicInfo.uploading")}</>
                    : <><Upload className="h-3.5 w-3.5" /> {t("basicInfo.upload")}</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New config dialog */}
      <ImageStorageConfigDialog
        open={newConfigDialogOpen}
        onOpenChange={setNewConfigDialogOpen}
        mode="create"
        resortId={resortId}
        form={newConfigForm}
        onFormChange={setNewConfigForm}
        onSaved={handleNewConfigSaved}
      />
    </div>
  )
}
