"use client"

import type { CSSProperties } from "react"
import * as LucideIcons from "lucide-react"

interface LucideIconRendererProps {
  name: string
  size?: number
  className?: string
  style?: CSSProperties
}

export function LucideIconRenderer({ name, size, className, style }: LucideIconRendererProps) {
  const Icon = (LucideIcons as Record<string, unknown>)[name] as React.ComponentType<{
    size?: number
    className?: string
    style?: CSSProperties
  }> | undefined

  if (!Icon) return null

  return <Icon size={size} className={className} style={style} />
}
