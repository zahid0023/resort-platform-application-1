// Core types
export type { IconType, IconValue, IconStrategy, PickerProps, RenderIconOpts } from "./types"
export { EMPTY_ICON_VALUE } from "./types"

// Components
export { IconPicker } from "./icon-picker"
export type { IconPickerProps } from "./icon-picker"
export { IconRenderer } from "./icon-renderer"
export type { IconRendererProps } from "./icon-renderer"
export { ColorPicker } from "./color-picker"

// Registry utilities
export { ALL_STRATEGIES, getStrategy } from "./registry"

// Individual strategies (for advanced use / testing)
export { lucideStrategy } from "./strategies/lucide-strategy"
export { svgStrategy } from "./strategies/svg-strategy"
export { imageStrategy } from "./strategies/image-strategy"
export { externalStrategy } from "./strategies/external-strategy"
export { emojiStrategy } from "./strategies/emoji-strategy"
