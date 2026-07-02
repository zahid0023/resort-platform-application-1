import type { CSSProperties, ReactNode } from "react"
import { getStrategy } from "./registry"
import type { IconValue } from "./types"

export interface IconRendererProps {
  icon: IconValue
  className?: string
  style?: CSSProperties
  /** Rendered when icon type or value is empty. Defaults to null. */
  fallback?: ReactNode
}

/**
 * Renders any icon by delegating to the registered strategy for icon.type.
 * Strategy-agnostic — adding a new icon type requires no changes here.
 */
export function IconRenderer({ icon, className, style, fallback = null }: IconRendererProps) {
  if (!icon.type || !icon.value) return <>{fallback}</>
  const strategy = getStrategy(icon.type)
  if (!strategy) return <>{fallback}</>
  return <>{strategy.renderIcon(icon.value, icon.meta, { className, style })}</>
}
