"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Label } from "@resort/shadcn-ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@resort/shadcn-ui"
import { Card } from "@resort/shadcn-ui"
import { Button } from "@resort/shadcn-ui"
import { Eye, EyeOff } from "lucide-react"
import { ALL_STRATEGIES, getStrategy } from "./registry"
import type { IconType, IconValue } from "./types"

export interface IconPickerProps {
  value: IconValue
  onChange: (value: IconValue) => void
  readOnly?: boolean
}

export function IconPicker({ value, onChange, readOnly = false }: IconPickerProps) {
  const { t } = useTranslation()
  const [showPreview, setShowPreview] = useState(false)

  const strategy = value.type ? getStrategy(value.type) : undefined

  function handleTypeChange(type: IconType) {
    const next = getStrategy(type)
    onChange({ type, value: "", meta: next?.defaultMeta() ?? {} })
  }

  const pickerProps = {
    value: value.value,
    meta: value.meta,
    onValueChange: (v: string) => onChange({ ...value, value: v }),
    onMetaChange: (patch: Partial<Record<string, string>>) =>
      onChange({ ...value, meta: { ...value.meta, ...patch } }),
    readOnly,
  }

  const metaContent = strategy?.renderMeta(pickerProps) ?? null

  return (
    <Card className="gap-0 py-0 overflow-hidden">
      {/* Header — type selector */}
      <div className="px-4 py-3">
        <div className="space-y-2">
          <Label htmlFor="icon-type-select" className="text-xs font-medium">
            {t("iconFields.iconType")}
          </Label>
          <Select
            value={value.type || ""}
            onValueChange={(v) => handleTypeChange(v as IconType)}
            disabled={readOnly}
          >
            <SelectTrigger id="icon-type-select" className="w-full">
              <SelectValue placeholder={t("iconFields.selectType")} />
            </SelectTrigger>
            <SelectContent>
              {ALL_STRATEGIES.map((s) => (
                <SelectItem key={s.type} value={s.type}>
                  <span className="font-medium">{s.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{s.description}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content — strategy value picker */}
      {strategy && (
        <div className="px-4 py-4 border-t">
          {strategy.renderValuePicker(pickerProps)}
        </div>
      )}

      {/* Footer — meta fields */}
      {metaContent && (
        <div className="px-4 py-4 border-t">
          {metaContent}
        </div>
      )}

      {/* Preview toggle */}
      {strategy && value.value && (
        <>
          <div className="px-4 py-2 border-t flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t("iconFields.preview")}</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2.5 gap-1.5"
              onClick={() => setShowPreview((p) => !p)}
            >
              {showPreview ? (
                <><EyeOff className="h-3.5 w-3.5" /> {t("common.hide")}</>
              ) : (
                <><Eye className="h-3.5 w-3.5" /> {t("iconFields.preview")}</>
              )}
            </Button>
          </div>
          {showPreview && (
            <div className="px-4 py-4 border-t flex items-center justify-center">
              <div className="rounded-xl border bg-muted/30 flex items-center justify-center p-4">
                {strategy.renderIcon(value.value, value.meta)}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
