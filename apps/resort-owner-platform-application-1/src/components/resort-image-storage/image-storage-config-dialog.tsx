"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { ServerIcon, Check, Eye, EyeOff, HelpCircle, Pencil, X } from "lucide-react"
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
  Card,
  CardContent,
  Dialog,
  DialogContent,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@resort/shadcn-ui"
import {
  resortImageHostingConfigsService,
  PROVIDER_FIELDS,
  type ImageHostingProvider,
} from "@/services/resort-image-storage-configs"
import { toast } from "sonner"

export type DialogMode = "create" | "view"

export interface ConfigFormState {
  name: string
  provider: ImageHostingProvider | ""
  config: Record<string, string>
}

export const emptyConfigForm: ConfigFormState = { name: "", provider: "", config: {} }

const PROVIDER_LABELS: Record<ImageHostingProvider, string> = {
  S3: "Amazon S3",
  CLOUDINARY: "Cloudinary",
}

const PROVIDER_HELP_KEYS: Record<ImageHostingProvider, { title: string; body: string }> = {
  S3: { title: "imageStorage.helpS3Title", body: "imageStorage.helpS3Body" },
  CLOUDINARY: { title: "imageStorage.helpCloudinaryTitle", body: "imageStorage.helpCloudinaryBody" },
}

interface ImageStorageConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: DialogMode
  resortId: number
  configId?: number
  form: ConfigFormState
  onFormChange: (form: ConfigFormState) => void
  onSaved?: () => void | Promise<void>
}

export function ImageStorageConfigDialog({
  open,
  onOpenChange,
  mode,
  resortId,
  configId,
  form,
  onFormChange,
  onSaved,
}: ImageStorageConfigDialogProps) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [editing, setEditing] = useState(false)
  const [localName, setLocalName] = useState("")
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [step, setStep] = useState<"provider" | "details">("provider")

  useEffect(() => {
    if (!open) {
      setConfirmClose(false)
      setEditing(false)
      setShowSecrets({})
      setStep("provider")
    }
  }, [open])

  const isCreate = mode === "create"
  const isReadOnly = mode === "view" && !editing
  const activeFields = form.provider ? (PROVIDER_FIELDS[form.provider as ImageHostingProvider] ?? []) : []

  const isDirty = isCreate
    ? step === "details"
      ? form.name.trim() !== "" || Object.values(form.config).some((v) => v.trim() !== "")
      : form.provider !== ""
    : editing

  function requestClose() {
    if (isDirty) setConfirmClose(true)
    else onOpenChange(false)
  }

  function selectProvider(provider: ImageHostingProvider) {
    const fields = PROVIDER_FIELDS[provider] ?? []
    const newConfig: Record<string, string> = {}
    fields.forEach(({ key }) => { newConfig[key] = "" })
    onFormChange({ ...form, provider, config: newConfig })
  }

  function goToDetails() {
    if (!form.provider) { toast.error(t("imageStorage.errProvider")); return }
    setStep("details")
  }

  function goBack() {
    onFormChange({ name: "", provider: "", config: {} })
    setStep("provider")
  }

  function startEdit() {
    setLocalName(form.name)
    setEditing(true)
  }

  async function saveEdit() {
    if (!localName.trim()) { toast.error(t("imageStorage.errName")); return }
    if (configId == null) return
    setSubmitting(true)
    try {
      await resortImageHostingConfigsService.update(resortId, configId, localName.trim())
      toast.success(t("imageStorage.updatedToast"))
      onFormChange({ ...form, name: localName.trim() })
      setEditing(false)
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isCreate) return
    if (!form.name.trim()) { toast.error(t("imageStorage.errName")); return }
    if (!form.provider) { toast.error(t("imageStorage.errProvider")); return }
    const fields = PROVIDER_FIELDS[form.provider as ImageHostingProvider] ?? []
    for (const f of fields) {
      if (!form.config[f.key]?.trim()) {
        toast.error(`${f.label} is required.`)
        return
      }
    }
    setSubmitting(true)
    try {
      await resortImageHostingConfigsService.create(resortId, {
        name: form.name.trim(),
        provider: form.provider as ImageHostingProvider,
        config: Object.fromEntries(fields.map(({ key }) => [key, form.config[key].trim()])),
      })
      toast.success(t("imageStorage.createdToast"))
      onOpenChange(false)
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const headerTitle = isCreate
    ? t("imageStorage.titleCreate")
    : editing
      ? t("imageStorage.titleEdit")
      : t("imageStorage.titleView")

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) requestClose() }}>
        <DialogContent
          className="max-w-lg p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose() }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <ServerIcon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold">{headerTitle}</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="bottom" align="start" className="w-72 space-y-2 p-4">
                      <p className="font-semibold text-sm">{t("imageStorage.helpTitle")}</p>
                      {t("imageStorage.helpBody").split("\n\n").map((para, i) => (
                        <p key={i} className="text-xs text-muted-foreground leading-relaxed">{para}</p>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isCreate
                    ? step === "provider"
                      ? t("imageStorage.selectProvider")
                      : t("imageStorage.descCreate")
                    : editing
                      ? t("imageStorage.descEdit")
                      : t("imageStorage.descView")}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* CREATE — Step 1: provider selection */}
              {isCreate && step === "provider" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">{t("imageStorage.selectProvider")} *</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(PROVIDER_FIELDS) as ImageHostingProvider[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => selectProvider(p)}
                        className={[
                          "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all hover:border-primary/60 hover:bg-primary/5",
                          form.provider === p
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border bg-card",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            {p}
                          </span>
                          <div className="ml-auto flex items-center gap-1">
                            {form.provider === p && (
                              <Check className="h-3.5 w-3.5 text-primary" />
                            )}
                            <Popover>
                              <PopoverTrigger asChild>
                                <span
                                  role="button"
                                  tabIndex={-1}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <HelpCircle className="h-3.5 w-3.5" />
                                </span>
                              </PopoverTrigger>
                              <PopoverContent side="top" align="end" className="w-72 space-y-2 p-4" onClick={(e) => e.stopPropagation()}>
                                <p className="font-semibold text-sm">{t(PROVIDER_HELP_KEYS[p].title)}</p>
                                {t(PROVIDER_HELP_KEYS[p].body).split("\n").map((line, i) => (
                                  <p key={i} className="text-xs text-muted-foreground leading-relaxed">{line}</p>
                                ))}
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        <p className="text-sm font-medium">{PROVIDER_LABELS[p]}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CREATE — Step 2: name + config fields */}
              {isCreate && step === "details" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                      {t("imageStorage.configSection")}
                    </h3>
                  </div>
                  <Card>
                    <CardContent className="space-y-4">
                      {/* Selected provider (read-only) */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">{t("imageStorage.provider")}</Label>
                        <Input value={PROVIDER_LABELS[form.provider as ImageHostingProvider] ?? form.provider} disabled onChange={() => {}} />
                      </div>

                      {/* Name */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">{t("imageStorage.name")} *</Label>
                        <Input
                          value={form.name}
                          onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                          placeholder={t("imageStorage.name")}
                          autoFocus
                        />
                      </div>

                      {/* Config fields */}
                      {activeFields.map((f) => (
                        <div key={f.key} className="space-y-2">
                          <Label className="text-xs font-medium">{f.label} *</Label>
                          <div className="relative">
                            <Input
                              type={f.secret && !showSecrets[f.key] ? "password" : "text"}
                              value={form.config[f.key] ?? ""}
                              onChange={(e) => onFormChange({ ...form, config: { ...form.config, [f.key]: e.target.value } })}
                              placeholder={f.label}
                              className={f.secret ? "pr-10" : undefined}
                            />
                            {f.secret && (
                              <button
                                type="button"
                                onClick={() => setShowSecrets((prev) => ({ ...prev, [f.key]: !prev[f.key] }))}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                tabIndex={-1}
                              >
                                {showSecrets[f.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* VIEW mode */}
              {!isCreate && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                        {t("imageStorage.configSection")}
                      </h3>
                    </div>
                    {!editing && (
                      <Button type="button" size="sm" variant="outline" onClick={startEdit} className="h-7 text-xs px-2.5 gap-1.5">
                        <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
                      </Button>
                    )}
                    {editing && (
                      <div className="flex items-center gap-1.5">
                        <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)} disabled={submitting} className="h-7 text-xs px-2.5 gap-1.5">
                          <X className="h-3.5 w-3.5" /> {t("common.cancel")}
                        </Button>
                        <Button type="button" size="sm" onClick={saveEdit} disabled={submitting} className="h-7 text-xs px-2.5 gap-1.5">
                          <Check className="h-3.5 w-3.5" />
                          {submitting ? t("common.saving") : t("common.save")}
                        </Button>
                      </div>
                    )}
                  </div>
                  <Card>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">{t("imageStorage.name")}{editing && " *"}</Label>
                        <Input
                          value={editing ? localName : form.name}
                          onChange={(e) => editing && setLocalName(e.target.value)}
                          disabled={isReadOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">{t("imageStorage.provider")}</Label>
                        <Input value={PROVIDER_LABELS[form.provider as ImageHostingProvider] ?? form.provider} disabled onChange={() => {}} />
                      </div>
                      {activeFields.map((f) => (
                        <div key={f.key} className="space-y-2">
                          <Label className="text-xs font-medium">{f.label}</Label>
                          <div className="relative">
                            <Input
                              type={f.secret && !showSecrets[f.key] ? "password" : "text"}
                              value={form.config[f.key] ?? ""}
                              onChange={() => {}}
                              disabled
                              className={f.secret ? "pr-10" : undefined}
                            />
                            {f.secret && (
                              <button
                                type="button"
                                onClick={() => setShowSecrets((prev) => ({ ...prev, [f.key]: !prev[f.key] }))}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                tabIndex={-1}
                              >
                                {showSecrets[f.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Footer */}
            {isCreate && (
              <div className="px-6 py-4 border-t flex items-center justify-between bg-background/50">
                <Button type="button" variant="ghost" onClick={step === "provider" ? requestClose : goBack}>
                  {step === "provider" ? t("common.cancel") : t("common.back")}
                </Button>
                {step === "provider" ? (
                  <Button type="button" onClick={goToDetails} disabled={!form.provider}>
                    {t("common.next")}
                  </Button>
                ) : (
                  <Button type="submit" disabled={submitting}>
                    {submitting ? t("common.saving") : t("common.save")}
                  </Button>
                )}
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialog.discardChanges.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("dialog.discardChanges.desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onOpenChange(false)}>
              {t("dialog.discardChanges.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
