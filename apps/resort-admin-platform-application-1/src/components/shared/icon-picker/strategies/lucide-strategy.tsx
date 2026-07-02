"use client"

import { Label } from "@resort/shadcn-ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@resort/shadcn-ui"
import { LucideIconPicker, LucideIconRenderer } from "ui-blocks"
import { ColorPicker } from "../color-picker"
import type { IconStrategy, PickerProps, RenderIconOpts } from "../types"

const SIZE_OPTIONS = [
  { label: "Default", value: "" },
  { label: "16px", value: "16" },
  { label: "20px", value: "20" },
  { label: "24px", value: "24" },
  { label: "32px", value: "32" },
  { label: "40px", value: "40" },
]

export const lucideStrategy: IconStrategy = {
  type: "LUCIDE",
  label: "Lucide Icon",
  description: "Pick from 1000+ open-source Lucide icons",

  defaultMeta: () => ({ color: "", size: "" }),

  renderValuePicker: ({ value, meta, onValueChange, readOnly }: PickerProps) => (
    <div className="space-y-2">
      <Label className="text-xs font-medium">Icon *</Label>
      {readOnly ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-3">
          {value
            ? <LucideIconRenderer name={value} className="h-5 w-5" style={{ color: meta.color || undefined }} />
            : null}
          <span className="font-mono text-sm">{value || "—"}</span>
        </div>
      ) : (
        <LucideIconPicker value={value} color={meta.color || undefined} onChange={onValueChange} />
      )}
    </div>
  ),

  renderMeta: ({ meta, onMetaChange, readOnly }: PickerProps) => (
    <div className="space-y-4">
      <ColorPicker
        value={meta.color ?? ""}
        onChange={(c) => onMetaChange({ color: c })}
        disabled={readOnly}
      />
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Size</Label>
        <Select
          value={meta.size || "__none"}
          onValueChange={(v) => onMetaChange({ size: v === "__none" ? "" : v })}
          disabled={readOnly}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Default" />
          </SelectTrigger>
          <SelectContent>
            {SIZE_OPTIONS.map((o) => (
              <SelectItem key={o.label} value={o.value || "__none"}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  ),

  renderIcon: (value, meta, opts?: RenderIconOpts) => {
    if (!value) return null
    return (
      <LucideIconRenderer
        name={value}
        size={meta.size ? Number(meta.size) : undefined}
        style={{ color: meta.color || undefined, ...opts?.style }}
        className={opts?.className}
      />
    )
  },
}
