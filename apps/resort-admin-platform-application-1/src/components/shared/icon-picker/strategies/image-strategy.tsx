"use client"

import { Input } from "@resort/shadcn-ui"
import { Label } from "@resort/shadcn-ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@resort/shadcn-ui"
import { cn } from "@resort/shadcn-ui"
import type { IconStrategy, PickerProps, RenderIconOpts } from "../types"

const FIT_OPTIONS = [
  { label: "Contain", value: "contain" },
  { label: "Cover", value: "cover" },
  { label: "Fill", value: "fill" },
]

export const imageStrategy: IconStrategy = {
  type: "IMAGE",
  label: "Image",
  description: "Use a hosted image URL (.png, .jpg, .webp, …)",

  defaultMeta: () => ({ alt: "", fit: "contain" }),

  renderValuePicker: ({ value, meta, onValueChange, readOnly }: PickerProps) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Image URL *</Label>
        <Input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="https://example.com/icon.png"
          disabled={readOnly}
        />
      </div>

      {value && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Preview</Label>
          <div className="flex h-16 w-16 items-center justify-center rounded-md border border-border bg-muted/30 p-1">
            <img
              src={value}
              alt={meta.alt || ""}
              className={cn("h-full w-full", `object-${meta.fit || "contain"}`)}
            />
          </div>
        </div>
      )}
    </div>
  ),

  renderMeta: ({ meta, onMetaChange, readOnly }: PickerProps) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Alt Text</Label>
        <Input
          value={meta.alt ?? ""}
          onChange={(e) => onMetaChange({ alt: e.target.value })}
          placeholder="Icon description"
          disabled={readOnly}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Object Fit</Label>
        <Select
          value={meta.fit || "contain"}
          onValueChange={(v) => onMetaChange({ fit: v })}
          disabled={readOnly}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  ),

  renderIcon: (value, meta, opts?: RenderIconOpts) => {
    if (!value) return null
    return (
      <img
        src={value}
        alt={meta.alt || ""}
        className={cn(`object-${meta.fit || "contain"}`, opts?.className)}
        style={opts?.style}
      />
    )
  },
}
