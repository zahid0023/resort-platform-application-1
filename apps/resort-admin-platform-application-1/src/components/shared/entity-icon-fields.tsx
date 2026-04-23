"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { LucideIconPicker } from "ui-blocks"

export type IconType = "LUCIDE" | "IMAGE" | "SVG" | "EXTERNAL"

export interface IconFormState {
  icon_type: IconType | ""
  icon_value: string
  icon_color: string
  icon_size: string
}

interface EntityIconFieldsProps {
  value: IconFormState
  onChange: (patch: Partial<IconFormState>) => void
  readOnly?: boolean
}

const PRESET_COLORS = [
  "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6",
  "#64748b", "#6366f1", "#14b8a6", "#ec4899", "#ef4444",
]
const HEX_RE = /^#([0-9a-fA-F]{6})$/

const ICON_SIZE_OPTIONS = [
  { label: "Default", value: "" },
  { label: "16", value: "16" },
  { label: "20", value: "20" },
  { label: "24", value: "24" },
  { label: "32", value: "32" },
  { label: "40", value: "40" },
]

export function EntityIconFields({ value, onChange, readOnly = false }: EntityIconFieldsProps) {
  const { icon_type, icon_value, icon_color, icon_size } = value

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="icon_type">Icon Type</Label>
          <Select
            value={icon_type}
            onValueChange={(v) => onChange({ icon_type: v as IconType, icon_value: "" })}
            disabled={readOnly}
          >
            <SelectTrigger id="icon_type">
              <SelectValue placeholder="Select icon type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LUCIDE">Lucide</SelectItem>
              <SelectItem value="IMAGE">Image</SelectItem>
              <SelectItem value="SVG">SVG</SelectItem>
              <SelectItem value="EXTERNAL">External</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {icon_type && icon_type !== "LUCIDE" && (
          <div className="space-y-2">
            <Label htmlFor="icon_value">Icon Value</Label>
            <Input
              id="icon_value"
              value={icon_value}
              onChange={(e) => onChange({ icon_value: e.target.value })}
              placeholder={
                icon_type === "IMAGE" ? "https://..."
                  : icon_type === "SVG" ? "<svg>...</svg>"
                  : "External reference"
              }
              required
              disabled={readOnly}
            />
          </div>
        )}
      </div>

      {icon_type === "LUCIDE" && (
        <div className="space-y-2">
          <Label>Pick an icon</Label>
          {readOnly ? (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-3">
              <span className="font-mono text-sm">{icon_value || "—"}</span>
            </div>
          ) : (
            <LucideIconPicker
              value={icon_value}
              color={icon_color || undefined}
              onChange={(name) => onChange({ icon_value: name })}
            />
          )}
        </div>
      )}

      {icon_type === "LUCIDE" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Icon Meta</Label>
            <span className="text-xs text-muted-foreground">optional</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon_color" className="text-xs text-muted-foreground">Color</Label>
              <Popover>
                <PopoverTrigger asChild disabled={readOnly}>
                  <button
                    id="icon_color"
                    type="button"
                    disabled={readOnly}
                    className={cn(
                      "flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                  >
                    {icon_color
                      ? <span className="h-4 w-4 rounded-full border border-border/60" style={{ backgroundColor: icon_color }} />
                      : <span className="h-4 w-4 rounded-full border border-dashed border-border" />}
                    <span className="font-mono text-xs">{icon_color || "None"}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 space-y-3" align="start">
                  <div>
                    <Label className="text-xs text-muted-foreground">Picker</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={icon_color || "#0ea5e9"}
                        onChange={(e) => onChange({ icon_color: e.target.value })}
                        className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-1"
                      />
                      <Input
                        value={icon_color}
                        onChange={(e) => onChange({ icon_color: e.target.value })}
                        placeholder="#0ea5e9"
                        className={cn("h-9 font-mono text-xs", icon_color && !HEX_RE.test(icon_color) && "border-destructive focus-visible:ring-destructive")}
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
                          onClick={() => onChange({ icon_color: c })}
                          className={cn("h-7 w-7 rounded-md border border-border/60 transition-transform hover:scale-110", icon_color?.toLowerCase() === c && "ring-2 ring-ring ring-offset-2 ring-offset-background")}
                          style={{ backgroundColor: c }}
                          aria-label={c}
                        />
                      ))}
                    </div>
                  </div>
                  {icon_color && (
                    <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => onChange({ icon_color: "" })}>
                      Clear color
                    </Button>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon_size" className="text-xs text-muted-foreground">Size</Label>
              <Select
                value={icon_size || "__none"}
                onValueChange={(v) => onChange({ icon_size: v === "__none" ? "" : v })}
                disabled={readOnly}
              >
                <SelectTrigger id="icon_size">
                  <SelectValue placeholder="Select size..." />
                </SelectTrigger>
                <SelectContent>
                  {ICON_SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.label} value={opt.value || "__none"}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
