"use client"

import { Input } from "@resort/shadcn-ui"
import { Label } from "@resort/shadcn-ui"
import { cn } from "@resort/shadcn-ui"
import type { IconStrategy, PickerProps, RenderIconOpts } from "../types"

export const externalStrategy: IconStrategy = {
  type: "EXTERNAL",
  label: "External",
  description: "URL to an external CDN icon or image",

  defaultMeta: () => ({ alt: "" }),

  renderValuePicker: ({ value, onValueChange, meta, readOnly }: PickerProps) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium">External URL *</Label>
        <Input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="https://cdn.example.com/icons/star.svg"
          disabled={readOnly}
        />
        <p className="text-xs text-muted-foreground">
          Supports CDN-hosted SVGs, Iconify API, icon sprite URLs, etc.
        </p>
      </div>

      {value && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Preview</Label>
          <div className="flex h-16 w-16 items-center justify-center rounded-md border border-border bg-muted/30 p-1">
            <img src={value} alt={meta.alt || ""} className="h-full w-full object-contain" />
          </div>
        </div>
      )}
    </div>
  ),

  renderMeta: ({ meta, onMetaChange, readOnly }: PickerProps) => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Alt Text</Label>
      <Input
        value={meta.alt ?? ""}
        onChange={(e) => onMetaChange({ alt: e.target.value })}
        placeholder="Icon description"
        disabled={readOnly}
      />
    </div>
  ),

  renderIcon: (value, meta, opts?: RenderIconOpts) => {
    if (!value) return null
    return (
      <img
        src={value}
        alt={meta.alt || ""}
        className={cn("object-contain", opts?.className)}
        style={opts?.style}
      />
    )
  },
}
