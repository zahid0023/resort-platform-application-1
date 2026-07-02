import type { CSSProperties, ReactNode } from "react"

export type IconType = "LUCIDE" | "SVG" | "IMAGE" | "EXTERNAL" | "EMOJI"

/** The icon data stored/passed around throughout the app. */
export interface IconValue {
  type: IconType | ""
  value: string
  /** Flexible per-strategy metadata (color, size, alt, fit, …). */
  meta: Record<string, string>
}

export const EMPTY_ICON_VALUE: IconValue = { type: "", value: "", meta: {} }

/** Props passed into each strategy's renderValuePicker / renderMeta. */
export interface PickerProps {
  value: string
  meta: Record<string, string>
  onValueChange: (value: string) => void
  onMetaChange: (patch: Partial<Record<string, string>>) => void
  readOnly: boolean
}

export interface RenderIconOpts {
  className?: string
  style?: CSSProperties
}

/**
 * Strategy interface — one implementation per icon type.
 *
 * To add a new icon type:
 *  1. Add its key to `IconType`
 *  2. Create a new strategy file implementing this interface
 *  3. Register it in `registry.tsx`
 *  4. Done — picker and renderer adapt automatically.
 */
export interface IconStrategy {
  readonly type: IconType
  readonly label: string
  readonly description: string
  /** Returns the initial meta object when this type is first selected. */
  defaultMeta(): Record<string, string>
  /** Renders the icon value picker — placed in CardContent. */
  renderValuePicker(props: PickerProps): ReactNode
  /** Renders meta fields (color, size, alt, …) — placed in CardFooter. Return null if no meta. */
  renderMeta(props: PickerProps): ReactNode | null
  /** Renders the icon for display in cards, dialogs, etc. */
  renderIcon(value: string, meta: Record<string, string>, opts?: RenderIconOpts): ReactNode
}
