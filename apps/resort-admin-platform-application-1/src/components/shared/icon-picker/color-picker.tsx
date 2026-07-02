"use client"

import { Button } from "@resort/shadcn-ui"
import { Input } from "@resort/shadcn-ui"
import { Label } from "@resort/shadcn-ui"
import { Popover, PopoverContent, PopoverTrigger } from "@resort/shadcn-ui"
import { cn } from "@resort/shadcn-ui"

const PRESET_COLORS = [
  "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6",
  "#64748b", "#6366f1", "#14b8a6", "#ec4899", "#ef4444",
]
const HEX_RE = /^#([0-9a-fA-F]{6})$/

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  disabled?: boolean
  label?: string
}

export function ColorPicker({ value, onChange, disabled = false, label = "Color" }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger asChild disabled={disabled}>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {value
              ? <span className="h-4 w-4 rounded-full border border-border/60 shrink-0" style={{ backgroundColor: value }} />
              : <span className="h-4 w-4 rounded-full border border-dashed border-border shrink-0" />}
            <span className="font-mono text-xs">{value || "None"}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-3" align="start">
          <div>
            <Label className="text-xs text-muted-foreground">Picker</Label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={value || "#0ea5e9"}
                onChange={(e) => onChange(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-1"
              />
              <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#0ea5e9"
                className={cn(
                  "h-9 font-mono text-xs",
                  value && !HEX_RE.test(value) && "border-destructive focus-visible:ring-destructive",
                )}
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Presets</Label>
            <div className="mt-1 grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange(c)}
                  className={cn(
                    "h-7 w-7 rounded-md border border-border/60 transition-transform hover:scale-110",
                    value?.toLowerCase() === c && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          {value && (
            <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => onChange("")}>
              Clear color
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
