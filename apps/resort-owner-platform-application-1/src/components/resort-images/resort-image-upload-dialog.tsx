"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Check, Hash, ImagePlus, Loader2, MessageSquare, Plus, Upload, X } from "lucide-react"
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@resort/shadcn-ui"
import { resortImageHostingConfigsService, type ResortImageHostingConfig } from "@/services/resort-image-storage-configs"
import { resortImagesService } from "@/services/resort-images"

interface FileEntry {
  file: File
  previewUrl: string
  caption: string
  sort_order: string
}

// ── Per-card component ────────────────────────────────────────────────────────

interface PreviewCardProps {
  entry: FileEntry
  disabled: boolean
  onRemove: () => void
  onUpdate: (patch: Partial<Pick<FileEntry, "caption" | "sort_order">>) => void
}

function PreviewCard({ entry, disabled, onRemove, onUpdate }: PreviewCardProps) {
  const { t } = useTranslation()
  const [editingCaption, setEditingCaption] = useState(false)
  const [editingSort, setEditingSort] = useState(false)
  const [draftCaption, setDraftCaption] = useState(entry.caption)
  const [draftSort, setDraftSort] = useState(entry.sort_order)
  const captionRef = useRef<HTMLInputElement>(null)
  const sortRef = useRef<HTMLInputElement>(null)

  function commitCaption() {
    onUpdate({ caption: draftCaption })
    setEditingCaption(false)
  }

  function commitSort() {
    onUpdate({ sort_order: draftSort })
    setEditingSort(false)
  }

  function startCaption() {
    setDraftCaption(entry.caption)
    setEditingCaption(true)
    setTimeout(() => captionRef.current?.focus(), 0)
  }

  function startSort() {
    setDraftSort(entry.sort_order)
    setEditingSort(true)
    setTimeout(() => sortRef.current?.select(), 0)
  }

  return (
    <div className="group/card relative rounded-xl overflow-hidden border border-border bg-card shadow-sm">
      {/* Image */}
      <div className="relative aspect-[4/3]">
        <img
          src={entry.previewUrl}
          alt={entry.file.name}
          className="h-full w-full object-cover"
        />

        {/* Remove button — top right */}
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-all opacity-0 group-hover/card:opacity-100 disabled:opacity-50 z-10"
        >
          <X className="size-3" />
        </button>

        {/* Sort order — top left, click to edit */}
        <div className={`absolute top-2 left-2 z-10 transition-all ${editingSort ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"}`}>
          {editingSort ? (
            <div className="flex items-center gap-1">
              <input
                ref={sortRef}
                type="number"
                value={draftSort}
                onChange={(e) => setDraftSort(e.target.value)}
                onBlur={commitSort}
                onKeyDown={(e) => { if (e.key === "Enter") commitSort(); if (e.key === "Escape") setEditingSort(false) }}
                className="w-12 rounded-md bg-black/70 backdrop-blur-sm text-white text-[11px] font-mono px-1.5 py-0.5 border-0 outline-none focus:ring-1 focus:ring-white/40"
              />
              <button
                type="button"
                onClick={commitSort}
                className="flex size-5 items-center justify-center rounded-full bg-black/70 text-white"
              >
                <Check className="size-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startSort}
              disabled={disabled}
              title={t("field.sort")}
              className="flex items-center gap-1 rounded-md bg-black/50 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-mono text-white/90 hover:bg-black/70 transition-colors disabled:opacity-50"
            >
              <Hash className="size-2.5" />
              {entry.sort_order}
            </button>
          )}
        </div>

        {/* Caption overlay — bottom, click to edit */}
        <div className={`absolute inset-x-0 bottom-0 bg-black/65 backdrop-blur-sm px-2.5 py-2 z-10 transition-all ${editingCaption ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"}`}>
          {editingCaption ? (
            <div className="flex items-center gap-1.5">
              <input
                ref={captionRef}
                type="text"
                value={draftCaption}
                onChange={(e) => setDraftCaption(e.target.value)}
                onBlur={commitCaption}
                onKeyDown={(e) => { if (e.key === "Enter") commitCaption(); if (e.key === "Escape") setEditingCaption(false) }}
                placeholder={t("images.captionPlaceholder")}
                className="flex-1 min-w-0 bg-transparent text-white text-xs font-medium px-0 py-0 border-0 outline-none placeholder:text-white/40"
              />
              <button
                type="button"
                onClick={commitCaption}
                className="flex size-5 items-center justify-center rounded-full bg-white/20 text-white shrink-0"
              >
                <Check className="size-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startCaption}
              disabled={disabled}
              className="flex items-center gap-1.5 w-full text-left disabled:opacity-50 group/cap"
            >
              <MessageSquare className="size-3.5 text-white/70 shrink-0 group-hover/cap:text-white transition-colors" />
              <span className={`text-xs font-medium truncate transition-colors group-hover/cap:text-white ${entry.caption ? "text-white" : "text-white/50"}`}>
                {entry.caption || t("images.captionPlaceholder")}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Filename */}
      <div className="px-2.5 py-1.5">
        <p className="text-[10px] text-muted-foreground truncate">{entry.file.name}</p>
      </div>
    </div>
  )
}

// ── Main dialog ───────────────────────────────────────────────────────────────

interface ResortImageUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resortId: number
  onUploaded: () => void
}

export function ResortImageUploadDialog({ open, onOpenChange, resortId, onUploaded }: ResortImageUploadDialogProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [configs, setConfigs] = useState<ResortImageHostingConfig[]>([])
  const [loadingConfigs, setLoadingConfigs] = useState(false)
  const [configId, setConfigId] = useState("")
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoadingConfigs(true)
    resortImageHostingConfigsService
      .list(resortId, { size: 50 })
      .then((r) => setConfigs(r.data))
      .catch(() => toast.error(t("basicInfo.errLoadConfigs")))
      .finally(() => setLoadingConfigs(false))
  }, [open, resortId, t])

  useEffect(() => {
    if (!open) {
      setEntries((prev) => {
        prev.forEach((e) => URL.revokeObjectURL(e.previewUrl))
        return []
      })
      setConfigId("")
    }
  }, [open])

  function addFiles(newFiles: File[]) {
    const startIdx = entries.length
    const newEntries: FileEntry[] = newFiles.map((file, i) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      caption: "",
      sort_order: String(startIdx + i + 1),
    }))
    setEntries((prev) => [...prev, ...newEntries])
  }

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length > 0) addFiles(selected)
    e.target.value = ""
  }

  function removeEntry(idx: number) {
    setEntries((prev) => {
      URL.revokeObjectURL(prev[idx].previewUrl)
      return prev.filter((_, i) => i !== idx)
    })
  }

  function updateEntry(idx: number, patch: Partial<Pick<FileEntry, "caption" | "sort_order">>) {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)))
  }

  async function handleUpload() {
    if (!configId) { toast.error(t("images.errNoConfig")); return }
    if (entries.length === 0) { toast.error(t("images.errNoFiles")); return }
    setUploading(true)
    try {
      const files = entries.map((e) => e.file)
      const meta = entries.map((e, i) => ({
        client_image_id: e.file.name,
        caption: e.caption.trim() || undefined,
        sort_order: Number(e.sort_order) || i + 1,
      }))
      await resortImagesService.upload(resortId, Number(configId), files, meta)
      toast.success(t("images.uploadedToast"))
      onOpenChange(false)
      onUploaded()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogTitle className="sr-only">Upload Images</DialogTitle>
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ImagePlus className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{t("images.uploadTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("images.uploadDesc")}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Config select */}
          <div className="space-y-1.5">
            <Label>{t("images.configLabel")} *</Label>
            {loadingConfigs ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                <Loader2 className="size-4 animate-spin" />
                <span>{t("common.loading")}</span>
              </div>
            ) : configs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-1">{t("images.noConfigs")}</p>
            ) : (
              <Select value={configId} onValueChange={setConfigId} disabled={uploading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("images.selectConfig")} />
                </SelectTrigger>
                <SelectContent>
                  {configs.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} <span className="text-muted-foreground ml-1">({c.provider})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Drop zone or gallery */}
          {entries.length === 0 ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors py-12 flex flex-col items-center gap-3 text-muted-foreground cursor-pointer disabled:opacity-50"
            >
              <Upload className="size-10" />
              <div className="text-center">
                <p className="text-sm font-medium">{t("images.dropOrClick")}</p>
                <p className="text-xs mt-0.5">{t("images.selectFiles")}</p>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              <Label>{t("images.filesSelected", { count: entries.length })}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {entries.map((entry, idx) => (
                  <PreviewCard
                    key={idx}
                    entry={entry}
                    disabled={uploading}
                    onRemove={() => removeEntry(idx)}
                    onUpdate={(patch) => updateEntry(idx, patch)}
                  />
                ))}

                {/* Add more card */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors overflow-hidden disabled:opacity-50 cursor-pointer"
                >
                  <div className="aspect-[4/3] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Plus className="size-6" />
                    <span className="text-xs">{t("images.addMore")}</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFilesChange}
        />

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t shrink-0">
          <p className="text-xs text-muted-foreground">
            {entries.length > 0
              ? t("images.filesSelected", { count: entries.length })
              : t("images.uploadDesc")}
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={uploading}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUpload} disabled={uploading || entries.length === 0 || !configId}>
              {uploading ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                  {t("images.uploading")}
                </>
              ) : (
                <>
                  <Upload className="size-4 mr-1.5" />
                  {t("images.upload")}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
