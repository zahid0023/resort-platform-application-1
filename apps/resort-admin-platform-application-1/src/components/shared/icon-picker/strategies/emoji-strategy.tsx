"use client"

import { Input } from "@resort/shadcn-ui"
import { Label } from "@resort/shadcn-ui"
import { cn } from "@resort/shadcn-ui"
import type { IconStrategy, PickerProps, RenderIconOpts } from "../types"

const QUICK_EMOJI = [
  "😀", "😍", "🎉", "🌟", "❤️", "🔥", "✅", "⚡",
  "🏠", "🌊", "🏖️", "🍕", "☕", "🚀", "💼", "📱",
  "🎵", "🎨", "⚽", "🏊", "🌍", "🌈", "🦋", "🌺",
  "🍀", "🦁", "🐬", "🎭", "🏆", "💎", "🔑", "🌙",
]

export const emojiStrategy: IconStrategy = {
  type: "EMOJI",
  label: "Emoji",
  description: "Use any emoji character as icon",

  defaultMeta: () => ({}),

  renderValuePicker: ({ value, onValueChange, readOnly }: PickerProps) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Emoji *</Label>
        <Input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="🌊"
          disabled={readOnly}
          className="text-2xl h-12"
          maxLength={8}
        />
        <p className="text-xs text-muted-foreground">
          Type or paste any emoji. Supports multi-codepoint emoji (e.g. 🏳️‍🌈).
        </p>
      </div>

      {!readOnly && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Quick picks</Label>
          <div className="grid grid-cols-8 gap-1 rounded-md border border-border bg-muted/30 p-2">
            {QUICK_EMOJI.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => onValueChange(e)}
                title={e}
                className={cn(
                  "aspect-square rounded-md flex items-center justify-center text-xl transition-all hover:bg-background hover:scale-110",
                  value === e && "ring-2 ring-primary bg-primary/10",
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  ),

  renderMeta: () => null,

  renderIcon: (value, _meta, opts?: RenderIconOpts) => {
    if (!value) return null
    return (
      <span
        className={cn("select-none leading-none", opts?.className)}
        style={opts?.style}
        aria-label={value}
        role="img"
      >
        {value}
      </span>
    )
  },
}
