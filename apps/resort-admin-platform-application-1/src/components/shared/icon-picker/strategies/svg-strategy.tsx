"use client"

import { Label } from "@resort/shadcn-ui"
import { Textarea } from "@resort/shadcn-ui"
import { ColorPicker } from "../color-picker"
import type { IconStrategy, PickerProps, RenderIconOpts } from "../types"

export const svgStrategy: IconStrategy = {
  type: "SVG",
  label: "SVG",
  description: "Paste raw SVG markup",

  defaultMeta: () => ({ color: "" }),

  renderValuePicker: ({ value, onValueChange, readOnly }: PickerProps) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium">SVG Markup *</Label>
        <Textarea
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">\n  <path d="..." />\n</svg>'}
          rows={6}
          disabled={readOnly}
          className="font-mono text-xs resize-y"
        />
        <p className="text-xs text-muted-foreground">
          Use <code className="font-mono bg-muted px-1 rounded">currentColor</code> for stroke/fill to inherit the color override.
        </p>
      </div>

      {value && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Preview</Label>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-muted/30 [&>svg]:h-6 [&>svg]:w-6"
            // Note: sanitize SVG with DOMPurify before using in public-facing apps.
            dangerouslySetInnerHTML={{ __html: value }}
          />
        </div>
      )}
    </div>
  ),

  renderMeta: ({ meta, onMetaChange, readOnly }: PickerProps) => (
    <ColorPicker
      label="Color Override"
      value={meta.color ?? ""}
      onChange={(c) => onMetaChange({ color: c })}
      disabled={readOnly}
    />
  ),

  renderIcon: (value, meta, opts?: RenderIconOpts) => {
    if (!value) return null
    return (
      <span
        // Note: sanitize SVG with DOMPurify before using in public-facing apps.
        dangerouslySetInnerHTML={{ __html: value }}
        style={{ color: meta.color || undefined, display: "contents", ...opts?.style }}
        className={opts?.className}
      />
    )
  },
}
