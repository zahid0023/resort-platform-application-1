"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Building2, Check, Pencil, X } from "lucide-react"
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@resort/shadcn-ui"
import { resortBasicInfoService } from "@/services/resort-basic-info"
import { ResortLogoUpload } from "./resort-logo-upload"
import { toast } from "sonner"
import type { ResortBasicInfo } from "@/services/resorts"

interface LocalDraft {
  estd: number | ""
  logo_url: string
}

export interface ResortGeneralInfoProps {
  resortId: number
  basicInfo: ResortBasicInfo
  onSaved?: () => void | Promise<void>
  editing: boolean
  onEditingChange: (v: boolean) => void
}

export function ResortGeneralInfo({
  resortId,
  basicInfo,
  onSaved,
  editing,
  onEditingChange,
}: ResortGeneralInfoProps) {
  const { t } = useTranslation()

  const [local, setLocal] = useState<LocalDraft>({ estd: "", logo_url: "" })
  const [submitting, setSubmitting] = useState(false)

  function startEdit() {
    setLocal({ estd: basicInfo.estd, logo_url: basicInfo.logo_url ?? "" })
    onEditingChange(true)
  }

  async function save() {
    if (local.estd === "" || isNaN(Number(local.estd))) {
      toast.error(t("basicInfo.errEstd"))
      return
    }
    setSubmitting(true)
    try {
      await resortBasicInfoService.update(resortId, {
        estd: Number(local.estd),
        logo_url: local.logo_url.trim() || undefined,
      })
      toast.success(t("basicInfo.updatedToast"))
      onEditingChange(false)
      await onSaved?.()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  function cancelEdit() {
    onEditingChange(false)
  }

  return (
    <Card className="shadow-none border-0 bg-transparent ring-0">
      <CardHeader className="flex flex-row items-center justify-between gap-4 px-0 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          <CardTitle className="text-lg">{t("common.generalInfo")}</CardTitle>
        </div>
        {!editing ? (
          <Button type="button" size="sm" variant="outline" onClick={startEdit} className="h-7 text-xs px-2.5 gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
          </Button>
        ) : (
          <div className="flex items-center gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={cancelEdit} disabled={submitting} className="h-7 text-xs px-2.5 gap-1.5">
              <X className="h-3.5 w-3.5" /> {t("common.cancel")}
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={submitting} className="h-7 text-xs px-2.5 gap-1.5">
              <Check className="h-3.5 w-3.5" />
              {submitting ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-5 px-0">
        <ResortLogoUpload
          logoUrl={editing ? local.logo_url : (basicInfo.logo_url ?? "")}
          editable={editing}
          onChange={(url) => setLocal((p) => ({ ...p, logo_url: url }))}
        />

        <div className="space-y-2">
          <Label htmlFor="rbi-estd" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("resort.estd")} {editing && "*"}
          </Label>
          <Input
            id="rbi-estd"
            type="number"
            value={editing ? (local.estd === "" ? "" : String(local.estd)) : String(basicInfo.estd)}
            onChange={(e) => setLocal((p) => ({ ...p, estd: e.target.value === "" ? "" : Number(e.target.value) }))}
            disabled={!editing}
            placeholder="1998"
            className="max-w-40"
          />
        </div>
      </CardContent>
    </Card>
  )
}
